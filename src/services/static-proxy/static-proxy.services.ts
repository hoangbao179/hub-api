import axios from 'axios';
import { StaticProxyTypeMapping } from '../../enums/proxy.enum';
import { IStaticProxyService } from './istatic-proxy.service';
import { HttpsProxyAgent } from 'https-proxy-agent/dist';
import { PurchaseNotifierInterface } from '../../services/notification/inotifyPurchase';
import { PurchaseNotifier } from '../../services/notification/notifyPurchase';

export class StaticProxyService implements IStaticProxyService {
    private readonly BASE_URL = `${process.env.SITE_BUY_PROXY}/apiv2/muaproxy.php`;
    private readonly BASE_URL_V6 = `${process.env.SITE_BUY_PROXY}/ipv6/apimuaipv6.php`;
    private readonly proxyAgent: HttpsProxyAgent<string>;
    private readonly notifier: PurchaseNotifierInterface;

    constructor() {
        const proxyString = process.env.PROXY_VN_CALL_API;
        if (!proxyString) {
            throw new Error('Biến môi trường PROXY_VN_CALL_API không được định nghĩa');
        }
        // Tách proxyString thành host, port, user, pass
        const [host, port, user, pass] = proxyString.split(':');
        if (!host || !port || !user || !pass) {
            throw new Error('Định dạng PROXY_VN_CALL_API không đúng, phải là host:port:user:pass');
        }
        const proxyUrl = `http://${user}:${pass}@${host}:${port}`;
        this.proxyAgent = new HttpsProxyAgent<string>(proxyUrl);
        this.notifier = new PurchaseNotifier();
    }

    async buyStaticProxy(key: string, orderId: string, quantity: number): Promise<any> {
        if (quantity > 5) {
            this.notifier.notifyPurchase(false, orderId, quantity, "info").catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return Array(quantity).fill({ product: `Mã đơn hàng: ${orderId} đang order hơn 5 proxy, liên hệ shop hoặc tele: hateno17 để nhận proxy có name pass theo ý bạn` });
        }

        const proxyType = StaticProxyTypeMapping[key];
        if (!proxyType) {
            throw new Error('Invalid orderId provided');
        }

        // hiện đang có lỗi làm timeout
        if (proxyType == "US") {
            return Array(quantity).fill({ product: `Đơn hàng: ${orderId} call API lỗi, shop hoặc tele: hateno17 để nhận proxy có name pass theo ý bạn` });
        }
        const fullUrl = `${this.BASE_URL}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&loaiproxy=${encodeURIComponent(proxyType)}&soluong=${encodeURIComponent(quantity)}&ngay=${encodeURIComponent(30)}`;

        try {
            const response = await axios.get(fullUrl, { httpsAgent: this.proxyAgent });
            const proxyList = processProxyResponse(response.data);
            this.notifier.notifyPurchase(false, orderId, quantity, "success").catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return proxyList;
        } catch (error) {
            console.log("Lỗi:", error.message);
            this.notifier.notifyPurchase(false, orderId, quantity, "error", error.message).catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return Array(quantity).fill({ product: `Mã đơn hàng: ${orderId} call API lỗi, liên hệ chủ shop để nhận sản phẩm và hỗ trợ` });
        }
    }

    async getAmountInventory(): Promise<any> {
        // const userInfoUrl = `${process.env.API_GET_INFO_USER}`;

        // try {
        //     const response = await axios.get<Lead>(userInfoUrl); 
        //     const data: Lead = response.data;
        //     const moneyOfUser = data.attributes?.find((attr) => attr.key === "tienweb");

        //     if (moneyOfUser && moneyOfUser.user_value) {
        //         const amount = parseFloat(moneyOfUser.user_value.replace(" VNĐ", "").replace(/\./g, ""));
        //         const quotient = Math.floor(amount / 14400);
        //         return Promise.resolve({ sum: quotient });
        //     }

        //     return Promise.resolve({ sum: 22 });
        // } catch (error) {
        //     console.error("API call error:", error);
        //     return Promise.resolve({ sum: 22 });
        // }
        return Promise.resolve({ sum: 270 });
    }

    async buyStaticProxySocks5(key: string, orderId: string, quantity: number): Promise<any> {
        if (quantity > 5) {
            this.notifier.notifyPurchase(false, orderId, quantity, "info").catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return Array(quantity).fill({ product: `Mã đơn hàng: ${orderId} đang order hơn 5 proxy, liên hệ shop hoặc tele: hateno17 để nhận proxy có name pass theo ý bạn` });
        }
        const proxyType = StaticProxyTypeMapping[key];
        if (!proxyType) {
            throw new Error('Invalid orderId provided');
        }

        if (proxyType == "US") {
            return Array(quantity).fill({ product: `Đơn hàng: ${orderId} call API lỗi, liên hệ shop hoặc tele: hateno17 để nhận proxy có name pass theo ý bạn` });
        }

        const fullUrl = `${this.BASE_URL}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&type=${encodeURIComponent('SOCKS5')}&loaiproxy=${encodeURIComponent(proxyType)}&soluong=${encodeURIComponent(quantity)}&ngay=${encodeURIComponent(30)}`;
        try {
            const response = await axios.get(fullUrl, { httpsAgent: this.proxyAgent });
            const proxyList = processProxyResponse(response.data);
            this.notifier.notifyPurchase(false, orderId, quantity, "success").catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return proxyList;
        } catch (error) {
            this.notifier.notifyPurchase(false, orderId, quantity, "error", error.message).catch(err =>
                console.error('Lỗi gửi thông báo info:', err)
            );
            return Array(quantity).fill({ product: `Mã đơn hàng: ${orderId} call api đang lỗi, liên hệ chủ shop để nhận sản phẩm và hỗ trợ` });
        }
    }

    async getAmountInventorySocks5(): Promise<any> {
        return Promise.resolve({ sum: 335 });
    }

    async buyStaticProxyV6(key: string, orderId: string, quantity: number): Promise<any> {
        const proxyType = StaticProxyTypeMapping[key];
        if (!proxyType || proxyType !== "IPV6") {
            throw new Error('Invalid orderId provided');
        }

        const fullUrl = `${this.BASE_URL_V6}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&soluong=${encodeURIComponent(quantity)}&ngay=${encodeURIComponent(30)}`;
        try {
            const response = await axios.post(fullUrl, {}, { httpsAgent: this.proxyAgent });
            const proxyList = processProxyResponseV6(response.data);
            return proxyList;
        } catch (error) {
            throw new Error(`Error calling proxy API: }`);
        }
    }

    getAmountInventoryV6(): Promise<any> {
        return Promise.resolve({ sum: 250 });
    }
}


function processProxyResponse(responseData: any): any[] {
    const result: any[] = [];

    // Nếu là string, parse JSON
    const dataArray =
        typeof responseData === "string"
            ? JSON.parse(responseData)
            : responseData;

    if (!Array.isArray(dataArray)) {
        throw new Error("Invalid response format: expected an array");
    }

    for (const data of dataArray) {
        if (data.status === 100 && data.proxy) {
            const proxyParts = data.proxy.split(":");

            if (proxyParts.length === 4) {
                const [ip, port, user, password] = proxyParts;
                const product = `${ip}:${port}:${user}:${password}`;
                result.push({ product });
            } else {
                console.warn("Invalid proxy format:", data.proxy);
            }
        } else if (data.status === 200) {
            break; // kết thúc khi gặp status 200
        }
    }

    return result;
}

function processProxyResponseV6(data: string): { product: string }[] {
    // Kiểm tra nếu data không phải string hoặc rỗng
    if (typeof data !== "string" || !data.trim()) {
        throw new Error("Invalid proxy response data: data must be a non-empty string");
    }

    // Tách chuỗi thành các JSON object dựa trên dấu '}{'
    const jsonObjects = data
        .replace(/\}\{/g, "}|{") // Thêm dấu '|' giữa các object để dễ tách
        .split("|")
        .map((item) => item.trim());

    const result: { product: string }[] = [];

    for (const jsonStr of jsonObjects) {
        try {
            // Parse chuỗi JSON thành object
            const parsed = JSON.parse(jsonStr);

            // Kiểm tra status và proxy
            if (parsed.status !== 100 || !parsed.proxy) {
                throw new Error("Invalid proxy object data");
            }

            // Thêm proxy vào kết quả
            result.push({ product: parsed.proxy });
        } catch (error) {
            throw new Error(`Failed to parse proxy object: ${error.message}`);
        }
    }

    // Kiểm tra nếu không có proxy nào
    if (result.length === 0) {
        throw new Error("No valid proxy data found");
    }

    return result;
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

function generateProxies(quantity) {
    return Array.from({ length: quantity }, () => ({
        product: randomProxy()
    }));
}
