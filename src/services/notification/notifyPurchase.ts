import axios, { AxiosResponse } from 'axios';
import { TelegramNotifier, TelegramNotification } from '../../utils/telegram';
import { PurchaseNotifierInterface } from './inotifyPurchase';

interface UserDataA {
  attributes?: Array<{ key: string; user_value: string }>;
}

interface UserDataB {
  data?: { balance: number };
}

export class PurchaseNotifier implements PurchaseNotifierInterface {
  private apiGetInfoUser: string;
  private apiUserWebRotatingProxy: string;
  private telegramNotifier: TelegramNotification;

  constructor() {
    this.apiGetInfoUser = process.env.API_GET_INFO_USER || '';
    this.apiUserWebRotatingProxy = process.env.API_USER_WEB_ROTATING_PROXY || '';
    this.telegramNotifier = new TelegramNotifier();
  }

  /**
   * Gửi thông báo mua hàng qua Telegram
   */
  async notifyPurchase(
    isRotating: boolean,
    orderId: string,
    quantity: number,
    status: 'success' | 'error' | 'info' | 'us_waiting' |string,
    errorMessage?: any,
    scope: 'mmo' | 'member' = 'mmo',
  ): Promise<void> {
    let amountA: number | null = null;
    let amountB: number | null = null;

    // Lấy số dư Web A
    try {
      const resA: AxiosResponse<UserDataA> = await axios.get(this.apiGetInfoUser);
      const moneyOfUser = resA.data.attributes?.find(attr => attr.key === 'tienweb');
      if (moneyOfUser?.user_value) {
        amountA = parseFloat(
          moneyOfUser.user_value.replace(' VNĐ', '').replace(/\./g, '')
        );
      }
    } catch (err: any) {
      console.error('Lỗi lấy Web A:', err?.response?.data || err.message);
    }

    // Lấy số dư Web B
    try {
      const resB: AxiosResponse<UserDataB> = await axios.get(this.apiUserWebRotatingProxy, {
        headers: {
          'Api-token': process.env.API_KEY_PROXY_ROTATING || '',
        },
      });
      amountB = resB.data?.data?.balance ?? null;
    } catch (err: any) {
      console.error('Lỗi lấy Web B:', err?.response?.data || err.message);
      amountB = 0;
    }

    const formatCurrency = (amount: number | null) =>
      amount !== null ? amount.toLocaleString() + ' VNĐ' : 'Lỗi';

    let message: string;
    const prefix = scope === 'member' ? '[Người dùng call api ngoài]' : '[MMO]';
    switch (status) {
      case 'success':
        message =
          `${prefix} <b>✅ Đơn hàng ${isRotating ? 'Key xoay' : 'Proxy tĩnh'} mã ${orderId} thành công</b>\n` +
          `Số lượng: <b>${quantity}</b>\n` +
          `Web Ipv4 còn: <b>${formatCurrency(amountA)}</b>\n` +
          `Web key Xoay còn: <b>${formatCurrency(amountB)}</b>`;
        break;

      case 'error':
        message =
          `${prefix} <b>❌ Đơn hàng ${isRotating ? 'Key xoay' : 'Proxy tĩnh'} mã ${orderId} thất bại</b>\n` +
          `Số lượng: <b>${quantity}</b>\n` +
          `Lỗi: <code>${errorMessage || 'Không xác định'}</code>\n` +
          `Web Ipv4 còn: <b>${formatCurrency(amountA)}</b>\n` +
          `Web key Xoay còn: <b>${formatCurrency(amountB)}</b>`;
        break;

      case 'us_waiting':
        message =
          `${prefix} <b>❌ Đơn hàng ${isRotating ? 'Key xoay' : 'Proxy tĩnh'} mã ${orderId} thuộc case không xử lý có lẽ là proxy US </b>\n` +
          `Số lượng: <b>${quantity}</b>\n` +
          `Đơn hàng cần được hỗ trợ.\n` +
          `Web Ipv4 còn: <b>${formatCurrency(amountA)}</b>\n` +
          `Web key Xoay còn: <b>${formatCurrency(amountB)}</b>`;
        break;
      case 'info':
        message =
          `${prefix} <b>⚠️ Đơn hàng ${isRotating ? 'Key xoay' : 'Proxy tĩnh'} mã ${orderId} cần kiểm tra</b>\n` +
          `Số lượng: <b>${quantity}</b>\n` +
          `Đơn hàng vượt giới hạn — vui lòng hỗ trợ gấp.\n` +
          `Web Ipv4 còn: <b>${formatCurrency(amountA)}</b>\n` +
          `Web key Xoay còn: <b>${formatCurrency(amountB)}</b>`;
        break;

      default:
        message =
          `${prefix} <b>ℹ️ Đơn hàng ${orderId} trạng thái không xác định</b>\n` +
          `Web Ipv4 còn: <b>${formatCurrency(amountA)}</b>\n` +
          `Web key Xoay còn: <b>${formatCurrency(amountB)}</b>`;
        break;
    }
    await this.telegramNotifier.send(message, { parse_mode: 'HTML' });
  }
}
