import axios from 'axios';
import { StaticProxyTypeMapping } from '../../enums/proxy.enum';
import { IStaticProxyService } from './istatic-proxy.service';
import { PurchaseNotifierInterface } from '../../services/notification/inotifyPurchase';
import { PurchaseNotifier } from '../../services/notification/notifyPurchase';
import { dbPool } from '../../db';
import { buildFulfillmentUrlWithOrderId } from '../../utils/token';

export class StaticProxyService implements IStaticProxyService {
    private readonly BASE_URL = `${process.env.SITE_BUY_PROXY}/apiv2/muaproxy.php`;
    private readonly BASE_URL_V6 = `${process.env.SITE_BUY_PROXY}/ipv6/apimuaipv6.php`;
    private readonly notifier: PurchaseNotifierInterface;

    constructor() {
        this.notifier = new PurchaseNotifier();
    }

    async buyStaticProxy(key: string, orderId: string, quantity: number): Promise<any> {
        if (quantity > 100) {
            this.notifier.notifyPurchase(false, orderId, quantity, "info").catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return Array(quantity).fill({
                product: `Mã đơn hàng: ${orderId} đang order hơn 100 proxy, liên hệ shop hoặc tele: hateno17 để nhận proxy có name pass theo ý bạn`
            });
        }

        const proxyType = StaticProxyTypeMapping[key];
        if (!proxyType) {
            throw new Error('Invalid orderId provided');
        }

        // hiện đang có lỗi làm timeout
        if (proxyType === "US" && quantity > 50) {
            this.notifier.notifyPurchase(true, orderId, quantity, "us_waiting").catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return Array(quantity).fill({
                product: `Đơn hàng: ${orderId} đang order hơn 50 proxy, liên hệ shop hoặc tele: hateno17 để nhận proxy có name pass theo ý bạn`
            });
        }

        const today = new Date();
        const day = String(today.getDate()).padStart(2, "0");     
        const month = String(today.getMonth() + 1).padStart(2, "0"); 
        const namePass = `proxy${day}${month}`;

        // URL mua hàng (HTTP)
        const fullUrl =
            `${this.BASE_URL}` +
            `?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}` +
            `&loaiproxy=${encodeURIComponent(proxyType)}` +
            `&soluong=${encodeURIComponent(quantity)}` +
            `&ngay=${encodeURIComponent(30)}` + 
            `&user=${encodeURIComponent(namePass)}` +
            `&password=${encodeURIComponent(namePass)}`;

        // Idempotency: nếu đã có order cùng external_order_id → dùng lại (và đảm bảo result_token = orderId)
        const [exist] = await dbPool.query(
            'SELECT result_token FROM orders WHERE external_order_id = ? ORDER BY id DESC LIMIT 1',
            [orderId]
        ) as any[];

        if (!exist.length) {
            await dbPool.query(
                `INSERT INTO orders (external_order_id, result_token, loaiproxy, quantity, days, type, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
                [orderId, orderId, proxyType, quantity, 30, 'HTTP'] // result_token = orderId
            );
        } else if (exist[0].result_token !== orderId) {
            // đồng bộ về orderId phòng dữ liệu cũ
            await dbPool.query(
                `UPDATE orders SET result_token=? WHERE external_order_id=?`,
                [orderId, orderId]
            );
        }

        const resultUrl = buildFulfillmentUrlWithOrderId(orderId);

        // chạy nền
        this.processOrderInBackgroundFromUrl(orderId, fullUrl, (raw) => processProxyResponse(raw))
            .catch(err => console.error('[staticProxyService] background error', err));

        // trả message kèm link (1 dòng, không ngoặc kép để khỏi bị \")
        const message = `Vui lòng truy cập link này để nhận proxy: ${resultUrl} sau 1 - 3 phút vì sever đang xử lý proxy cho bạn`;
        return Array.from({ length: quantity }).map(() => ({ product: message }));

    }
    // PATCH START: helper chạy nền (call API mua → cập nhật DB → notify)
    private async processOrderInBackgroundFromUrl(
        externalOrderId: string,
        fullUrl: string,
        parseFn: (rawData: any) => Array<{ product: string }>
    ) {
        try {
            // Lấy order vừa tạo
            const [rows] = await dbPool.query(
                `SELECT id, loaiproxy, quantity, days, type, status
             FROM orders WHERE external_order_id = ? ORDER BY id DESC LIMIT 1`,
                [externalOrderId]
            ) as any[];
            if (!rows.length) return;

            const order = rows[0] as { id: number; loaiproxy: string; quantity: number; days: number; type: string };

            await dbPool.query(`UPDATE orders SET status='PROCESSING', updated_at=NOW() WHERE id=?`, [order.id]);

            // Gọi API mua
            const { data } = await axios.get(fullUrl, {timeout: 180000, responseType: 'text'});

            // Parse bằng hàm cũ của bạn (trả [{product: 'ip:port:user:pass'}, ...])
            const parsed = parseFn(data);

            // Lưu proxies vào DB
            for (const item of parsed) {
                const proxy = String(item.product || '');
                await dbPool.query(
                    `INSERT INTO proxies (order_id, idproxy, proxy_string, expired_at, status)
                 VALUES (?, ?, ?, ?, 'ACTIVE')`,
                    [order.id, null, proxy, null]
                );
            }

            // Cập nhật trạng thái
            const [[{ c: finalCount }]] = await dbPool.query(
                `SELECT COUNT(*) AS c FROM proxies WHERE order_id=? AND status='ACTIVE'`,
                [order.id]
            ) as any;

            if (Number(finalCount || 0) >= order.quantity) {
                await dbPool.query(`UPDATE orders SET status='SUCCESS', updated_at=NOW() WHERE id=?`, [order.id]);
                this.notifier.notifyPurchase(false, externalOrderId, order.quantity, 'success')
                    .catch(err => console.error('notify success err:', err));
            } else if (Number(finalCount || 0) > 0) {
                await dbPool.query(`UPDATE orders SET status='PARTIAL', updated_at=NOW() WHERE id=?`, [order.id]);
                this.notifier.notifyPurchase(false, externalOrderId, order.quantity, 'info', 'PARTIAL')
                    .catch(err => console.error('notify partial err:', err));
            } else {
                await dbPool.query(`UPDATE orders SET status='FAILED', updated_at=NOW() WHERE id=?`, [order.id]);
                this.notifier.notifyPurchase(false, externalOrderId, order.quantity, 'error')
                    .catch(err => console.error('notify failed err:', err));
            }
        } catch (e: any) {
            console.error('[processOrderInBackgroundFromUrl] crash', e?.message || e);
            try {
                await dbPool.query(
                    `UPDATE orders SET status='FAILED', error_message=?, updated_at=NOW()
                 WHERE external_order_id=? ORDER BY id DESC LIMIT 1`,
                    [String(e?.message || 'unknown error'), externalOrderId]
                );
            } catch { }
        }
    }

    async getAmountInventory(): Promise<any> {
        return Promise.resolve({ sum: 270 });
    }

    /**
     * Mua proxy static dạng SOCKS5.
     * Giống buyStaticProxy nhưng URL có thêm type=SOCKS5.
     */
    async buyStaticProxySocks5(key: string, orderId: string, quantity: number): Promise<any> {
        if (quantity > 100) {
            this.notifier.notifyPurchase(false, orderId, quantity, "info").catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return Array(quantity).fill({
                product: `Mã đơn hàng: ${orderId} đang order hơn 100 proxy, liên hệ shop hoặc tele: hateno17 để nhận proxy có name pass theo ý bạn`
            });
        }

        const proxyType = StaticProxyTypeMapping[key];
        if (!proxyType) {
            throw new Error('Invalid orderId provided');
        }

        // US vẫn chặn như cũ
        if (proxyType === "US" && quantity > 50) {
            this.notifier.notifyPurchase(true, orderId, quantity, "us_waiting").catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return Array(quantity).fill({
                product: `Đơn hàng: ${orderId} đang order hơn 50 proxy, liên hệ shop hoặc tele: hateno17 để nhận proxy có name pass theo ý bạn`
            });
        }

        const today = new Date();
        const day = String(today.getDate()).padStart(2, "0");     
        const month = String(today.getMonth() + 1).padStart(2, "0"); 
        const namePass = `proxy${day}${month}`;
        const fullUrl =
            `${this.BASE_URL}` +
            `?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}` +
            `&type=${encodeURIComponent('SOCKS5')}` +
            `&loaiproxy=${encodeURIComponent(proxyType)}` +
            `&soluong=${encodeURIComponent(quantity)}` +
            `&ngay=${encodeURIComponent(30)}` +
            `&user=${encodeURIComponent(namePass)}` +
            `&password=${encodeURIComponent(namePass)}`;

        const [exist] = await dbPool.query(
            'SELECT result_token FROM orders WHERE external_order_id = ? ORDER BY id DESC LIMIT 1',
            [orderId]
        ) as any[];

        if (!exist.length) {
            await dbPool.query(
                `INSERT INTO orders (external_order_id, result_token, loaiproxy, quantity, days, type, status)
     VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
                [orderId, orderId, proxyType, quantity, 30, 'SOCKS5'] // result_token = orderId
            );
        } else if (exist[0].result_token !== orderId) {
            await dbPool.query(
                `UPDATE orders SET result_token=? WHERE external_order_id=?`,
                [orderId, orderId]
            );
        }

        const resultUrl = buildFulfillmentUrlWithOrderId(orderId);

        this.processOrderInBackgroundFromUrl(orderId, fullUrl, (raw) => processProxyResponse(raw))
            .catch(err => console.error('[staticProxyService] background error', err));

        const message = `Vui lòng truy cập link này để nhận proxy: ${resultUrl} sau 1 - 3 phút vì sever đang xử lý proxy cho bạn`;
        return Array.from({ length: quantity }).map(() => ({ product: message }));
    }

    async getAmountInventorySocks5(): Promise<any> {
        return Promise.resolve({ sum: 335 });
    }

        /**
     * Cho phép service khác (ví dụ MemberProxyService) dùng chung luồng xử lý nền
     * để gọi vendor & lưu proxy vào DB.
     */
    public async enqueueStaticProxyOrder(externalOrderId: string, fullUrl: string): Promise<void> {
        await this.processOrderInBackgroundFromUrl(
            externalOrderId,
            fullUrl,
            (raw) => processProxyResponse(raw)
        );
    }
}

function processProxyResponse(responseData: any): Array<{ product: string; idproxy?: number; time?: number }> {
    const out: Array<{ product: string; idproxy?: number; time?: number }> = [];

    // Chuẩn hoá về mảng object
    const arr = normalizeToObjectsArray(responseData);

    for (const it of arr) {
        const status = Number(it?.status);
        if (status === 100 && it?.proxy) {
            // proxy dạng ip:port:user:password
            const proxy = String(it.proxy);
            const parts = proxy.split(':');
            if (parts.length === 4) {
                out.push({
                    product: proxy,
                    idproxy: typeof it.idproxy === 'number' ? it.idproxy : Number(it.idproxy) || undefined,
                    time: typeof it.time === 'number' ? it.time : Number(it.time) || undefined
                });
            } else {
                console.warn('Invalid proxy format:', proxy);
            }
        } else if (status === 200) {
            // phần tử tổng kết, bỏ qua
            break;
        } else if ([101, 102, 103, 104, 201].includes(status)) {
            // các mã lỗi / thiếu số lượng
            console.warn('Vendor status:', status, it);
        }
    }

    return out;
}

/** Chuẩn hoá raw (string/object/array, dính '}{', nhiều dòng...) về mảng object JSON */
function normalizeToObjectsArray(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') return [raw];

    if (typeof raw === 'string') {
        const txt = raw.trim();
        if (!txt) return [];

        try {
            const parsed = JSON.parse(txt);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch { }

        if (txt.includes('}{')) {
            const chunks = txt.replace(/\}\{/g, '}\n{').split('\n');
            const out: any[] = [];
            for (const ch of chunks) {
                const s = ch.trim();
                if (!s) continue;
                try {
                    const obj = JSON.parse(s);
                    Array.isArray(obj) ? out.push(...obj) : out.push(obj);
                } catch { }
            }
            if (out.length) return out;
        }

        if (txt.includes('\n')) {
            const out: any[] = [];
            for (const line of txt.split('\n')) {
                const s = line.trim();
                if (!s) continue;
                try {
                    const obj = JSON.parse(s);
                    Array.isArray(obj) ? out.push(...obj) : out.push(obj);
                } catch { }
            }
            if (out.length) return out;
        }

        const guess = txt.match(/\{[\s\S]*?\}/g);
        if (guess && guess.length) {
            const out: any[] = [];
            for (const g of guess) {
                try {
                    const obj = JSON.parse(g);
                    Array.isArray(obj) ? out.push(...obj) : out.push(obj);
                } catch { }
            }
            return out;
        }
    }
    return [];
}

function randomProxy() {
    const ip = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
    const port = Math.floor(Math.random() * (65535 - 1000 + 1)) + 1000;
    const randomString = (length) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };
    const username = randomString(6);
    const password = randomString(6);
    return `${ip}:${port}:${username}:${password}`;
}

function generateProxies(quantity: number) {
    return Array.from({ length: quantity }, () => ({
        product: randomProxy()
    }));
}

