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
    this.apiGetInfoUser = process.env.API_GET_INFO_USER;
    this.apiUserWebRotatingProxy = process.env.API_USER_WEB_ROTATING_PROXY;
    this.telegramNotifier = new TelegramNotifier();
  }

  async notifyPurchase(): Promise<void> {
    let amountA: number | null = null;
    let amountB: number | null = null;

    // Gọi Web A
    try {
      const resA: AxiosResponse<UserDataA> = await axios.get(this.apiGetInfoUser);
      const moneyOfUser = resA.data.attributes?.find(attr => attr.key === 'tienweb');
      if (moneyOfUser?.user_value) {
        amountA = parseFloat(moneyOfUser.user_value.replace(" VNĐ", "").replace(/\./g, ""));
      }
    } catch (err: any) {
      console.error('Lỗi lấy Web A:', err?.response?.data || err.message);
    }

    // Gọi Web B
    try {
      const resB: AxiosResponse<UserDataB> = await axios.get(this.apiUserWebRotatingProxy, {
        headers: {
          'Api-token': this.apiUserWebRotatingProxy,
        },
      });
      amountB = resB.data?.data?.balance ?? null;
    } catch (err: any) {
      console.error('Lỗi lấy Web B:', err?.response?.data || err.message);
    }

    // Soạn và gửi tin nhắn
    const message: string = `🛒 *Có người vừa mua hàng*\n\n` +
      `🌐 Web Ipv4 còn: *${amountA !== null ? amountA.toLocaleString() + ' VNĐ' : 'Lỗi'}*\n` +
      `🌐 Web key Xoay còn: *${amountB !== null ? amountB.toLocaleString() + ' VNĐ' : 'Lỗi'}*`;

    await this.telegramNotifier.send(message);
  }
}