import axios from 'axios';

export interface TelegramNotification {
  send(message: string, options?: { parse_mode?: 'Markdown' | 'HTML' | 'None' }): Promise<void>;
}

export class TelegramNotifier implements TelegramNotification {
  private readonly botToken: string;
  private readonly chatId: string;
  private readonly baseUrl: string;

  constructor() {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      throw new Error('Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong biến môi trường.');
    }

    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
  }

  /**
   * Gửi tin nhắn Telegram.
   * Mặc định dùng parse_mode = 'HTML' để tránh lỗi Markdown parse.
   */
  async send(
    message: string,
    options: { parse_mode?: 'Markdown' | 'HTML' | 'None' } = {}
  ): Promise<void> {
    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: options.parse_mode || 'HTML', 
    };

    try {
      await axios.post(this.baseUrl, payload);
    } catch (error: any) {
      const errData = error?.response?.data || error.message;

      console.error('⚠️ Lỗi gửi Telegram:', errData);

      if (errData?.description?.includes("can't parse entities")) {
        console.warn('→ Thử gửi lại tin nhắn ở dạng text không định dạng...');
        try {
          await axios.post(this.baseUrl, {
            chat_id: this.chatId,
            text: message,
            parse_mode: 'None',
          });
          console.log('✅ Gửi lại thành công (dạng text).');
        } catch (retryErr: any) {
          console.error('❌ Gửi lại thất bại:', retryErr?.response?.data || retryErr.message);
        }
      }
    }
  }
}
