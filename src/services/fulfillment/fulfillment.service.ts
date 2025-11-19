import { dbPool } from '../../db';

export interface FulfillmentRenderResult {
  statusCode: number;
  contentType: string;
  body: string;
}

export interface IFulfillmentService {
  renderByToken(token: string): Promise<FulfillmentRenderResult>;
}

class FulfillmentServiceImpl implements IFulfillmentService {
  public async renderByToken(token: string): Promise<FulfillmentRenderResult> {
    // 1) Lấy order theo token
    const [orders] = await dbPool.query(
      'SELECT id, status, created_at FROM orders WHERE result_token = ? LIMIT 1',
      [token]
    ) as any[];

    if (!Array.isArray(orders) || orders.length === 0) {
      return { statusCode: 404, contentType: 'text/plain', body: 'Mã không tồn tại.' };
    }

    const order = orders[0] as { id: number; status: string; created_at: Date };

    // 2) Hết hạn quá 1 tháng 
    const created = new Date(order.created_at);
    const isExpired = Date.now() - created.getTime() > 24 * 30 * 60 * 60 * 1000;
    if (isExpired) {
      return { statusCode: 410, contentType: 'text/plain', body: 'Link đã hết hạn (quá 30 ngày). Vui lòng tạo đơn mới.' };
    }

    // 3) Lấy proxies đã có
    const [rows] = await dbPool.query(
      'SELECT proxy_string, status FROM proxies WHERE order_id = ? ORDER BY id ASC',
      [order.id]
    ) as any[];

    const active = (rows as any[]).filter(r => r.status === 'ACTIVE' && r.proxy_string).map(r => String(r.proxy_string));

    // 4) Render theo trạng thái
    if (order.status === 'SUCCESS') {
      const thankYou = 'cám ơn bạn đã mua ủng hộ, cần gì cứ liên hệ qua tele: hateno17 để hỗ trợ (đổi name/pass của proxy, đổi HTTP qua SOCKS5...)';
      const body = [...active, thankYou].join('\n');
      return { statusCode: 200, contentType: 'text/plain', body };
    }

    // PARTIAL: trả những gì đã có + nhắn đang cấu hình
    if (order.status === 'PARTIAL') {
      const hint = 'Đang cấu hình thêm proxy, vui lòng truy cập lại sau để nhận đủ.';
      const body = active.length ? [...active, hint].join('\n') : hint;
      return { statusCode: 200, contentType: 'text/plain', body };
    }

    // PENDING / PROCESSING
    if (order.status === 'PENDING' || order.status === 'PROCESSING') {
      return { statusCode: 200, contentType: 'text/plain', body: 'Đang cấu hình proxy, vui lòng chờ một chút rồi truy cập lại.' };
    }

    // FAILED (hoặc trạng thái khác)
    return { statusCode: 200, contentType: 'text/plain', body: 'Đơn hàng lỗi, vui lòng liên hệ qua tele: hateno17 để hỗ trợ (đổi name/pass của proxy, đổi HTTP qua SOCKS5...)' };

  }
}

export const fulfillmentService: IFulfillmentService = new FulfillmentServiceImpl();
