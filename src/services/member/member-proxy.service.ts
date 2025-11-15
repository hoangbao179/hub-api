// src/services/member/member-proxy.service.ts
import crypto from 'crypto';
import { dbPool } from '../../db';
import { buildFulfillmentUrlWithOrderId } from '../../utils/token';
import { StaticProxyService } from '../static-proxy/static-proxy.services';
import { MemberService } from './member.service';
import { PurchaseNotifier } from '../../services/notification/notifyPurchase';

export interface BuyMemberProxyParams {
  memberKey: string;
  proxyType: string;        // vnpt | viettel | fpt
  connectionType: string;   // http | socks5
  quantity: number;
  proxyName?: string;
  proxyPass?: string;
}

export class MemberProxyService {
  private memberService: MemberService;
  private staticProxyService: StaticProxyService;
  private purchaseNotifier: PurchaseNotifier;
  private readonly BASE_URL: string;

  constructor(
    memberService?: MemberService,
    staticProxyService?: StaticProxyService,
    purchaseNotifier?: PurchaseNotifier,
  ) {
    this.memberService = memberService ?? new MemberService();
    this.staticProxyService = staticProxyService ?? new StaticProxyService();
    this.purchaseNotifier = purchaseNotifier ?? new PurchaseNotifier();
    this.BASE_URL = `${process.env.SITE_BUY_PROXY}/apiv2/muaproxy.php`;
  }

  private generateOrderId(): string {
    // 12 ký tự hex, viết hoa cho dễ đọc
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }

  private mapProxyType(raw: string): string | null {
    const v = raw.trim().toLowerCase();
    switch (v) {
      case 'viettel':
        return 'Viettel';
      case 'vnpt':
        return 'VNPT';
      case 'fpt':
        return 'FPT';
      default:
        return null;
    }
  }

  private mapConnectionType(raw: string): 'HTTP' | 'SOCKS5' | null {
    const v = raw.trim().toLowerCase();
    if (v === 'http') return 'HTTP';
    if (v === 'socks5') return 'SOCKS5';
    return null;
  }

  /**
   * Hàm chính để member mua proxy.
   * Trả về 1 dòng text cho người dùng (kể cả khi lỗi).
   */
  async buyProxyForMember(params: BuyMemberProxyParams): Promise<string> {
    const { memberKey, proxyType, connectionType, proxyName, proxyPass } = params;
    let { quantity } = params;

    const scope: 'mmo' | 'member' = 'member';
    const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;

    try {
      // 0) Kiểm tra config vendor
      if (!process.env.API_KEY_SITE_BUY_PROXY || !process.env.SITE_BUY_PROXY) {
        await this.purchaseNotifier.notifyPurchase(
          false,
          'NO_ORDER',
          safeQty,
          'error',
          'SERVER_MISCONFIG',
          scope
        );

        return 'Hệ thống chưa cấu hình mua proxy, vui lòng liên hệ admin (SERVER_MISCONFIG).';
      }

      // 1) Validate quantity
      quantity = Number(quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        await this.purchaseNotifier.notifyPurchase(
          false,
          'NO_ORDER',
          safeQty,
          'info',
          'INVALID_QUANTITY',
          scope
        );

        return 'Tham số quantity phải là số lớn hơn không.';
      }

      // 2) Tìm member theo key
      const member = await this.memberService.findByKey(memberKey);
      if (!member) {
        await this.purchaseNotifier.notifyPurchase(
          false,
          'NO_ORDER',
          quantity,
          'error',
          'MEMBER_NOT_FOUND',
          scope
        );

        return 'member_key không hợp lệ, vui lòng kiểm tra lại.';
      }

      // 3) Check member có order đang xử lý không (PENDING/PROCESSING)
      const hasActive = await this.memberService.hasActiveOrder(member.id);
      if (hasActive) {
        await this.purchaseNotifier.notifyPurchase(
          false,
          'NO_ORDER',
          quantity,
          'info',
          'ACTIVE_ORDER_EXISTS',
          scope
        );

        return 'Đơn trước của bạn đang được xử lý, vui lòng đợi hoàn tất rồi mới tạo đơn mới.';
      }

      // 4) Check & trừ allocation (trừ ngay khi call API)
      const ok = await this.memberService.decreaseAllocation(member.id, quantity);
      if (!ok) {
        await this.purchaseNotifier.notifyPurchase(
          false,
          'NO_ORDER',
          quantity,
          'info',
          'INSUFFICIENT_ALLOCATION',
          scope
        );

        return 'Allocation của bạn không đủ để mua số lượng proxy yêu cầu, vui lòng nạp thêm.';
      }

      // 5) Chuẩn hóa proxy_type & type
      const vendorProxyType = this.mapProxyType(proxyType);
      if (!vendorProxyType) {
        await this.purchaseNotifier.notifyPurchase(
          false,
          'NO_ORDER',
          quantity,
          'info',
          'INVALID_PROXY_TYPE',
          scope
        );

        return 'proxy_type không hợp lệ. Hỗ trợ: viettel, vnpt, fpt.';
      }

      const mappedType = this.mapConnectionType(connectionType);
      if (!mappedType) {
        await this.purchaseNotifier.notifyPurchase(
          false,
          'NO_ORDER',
          quantity,
          'info',
          'INVALID_TYPE',
          scope
        );

        return 'type phải là http hoặc socks5.';
      }
      const isSocks5 = mappedType === 'SOCKS5';

      // 6) Tạo order_id tự động
      const orderId = this.generateOrderId();

      // 7) Tạo record trong bảng orders, gắn member_id
      await dbPool.query(
        `INSERT INTO orders (external_order_id, result_token, loaiproxy, quantity, days, type, status, member_id)
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
        [orderId, orderId, vendorProxyType, quantity, 30, mappedType, member.id]
      );

      // 8) Notify tạo đơn thành công cho member
      await this.purchaseNotifier.notifyPurchase(
        false,
        orderId,
        quantity,
        'success',
        undefined,
        scope
      );

      // 9) Build URL gọi vendor
      let fullUrl =
        `${this.BASE_URL}` +
        `?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}` +
        `&loaiproxy=${encodeURIComponent(vendorProxyType)}` +
        `&soluong=${encodeURIComponent(quantity)}` +
        `&ngay=${encodeURIComponent(1)}`;

      // type: http / socks5
      if (isSocks5) {
        fullUrl += `&type=${encodeURIComponent('SOCKS5')}`;
      } else {
        fullUrl += `&type=${encodeURIComponent('http')}`;
      }

      // user/pass nếu có
      if (proxyName) {
        fullUrl += `&user=${encodeURIComponent(proxyName)}`;
      }
      if (proxyPass) {
        fullUrl += `&password=${encodeURIComponent(proxyPass)}`;
      }

      // 10) Kick off job chạy nền để call vendor & lưu DB
      this.staticProxyService
        .enqueueStaticProxyOrder(orderId, fullUrl)
        .catch(async (err: any) => {
          console.error('[MemberProxyService] background error', err?.message || err);
          await this.purchaseNotifier.notifyPurchase(
            false,
            orderId,
            quantity,
            'error',
            'BACKGROUND_ERROR',
            scope
          );
        });

      // 11) Build link fulfill trả cho member
      const fulfillmentUrl = buildFulfillmentUrlWithOrderId(orderId);
      const message = `Vui lòng truy cập link: ${fulfillmentUrl} sau 2 - 5 phút vì sever đang xử lý proxy cho bạn`;

      return message;
    } catch (err: any) {
      console.error('[MemberProxyService] unexpected error', err?.message || err);

      await this.purchaseNotifier.notifyPurchase(
        false,
        'NO_ORDER',
        safeQty,
        'error',
        'INTERNAL_ERROR',
        scope
      );

      return 'Đã xảy ra lỗi hệ thống, vui lòng liên hệ admin để được hỗ trợ (INTERNAL_ERROR).';
    }
  }
}
