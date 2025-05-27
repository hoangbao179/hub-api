import axios from 'axios';

export interface TelegramNotification {
  send(message: string): Promise<void>;
}

export class TelegramNotifier implements TelegramNotification {
  private readonly botToken: string;
  private readonly chatId: string;
  private readonly baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
  }

  async send(message: string): Promise<void> {
    try {
      await axios.post(this.baseUrl, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'Markdown',
      });
    } catch (error: any) {
      console.error('Lỗi gửi Telegram:', error?.response?.data || error.message);
    }
  }
}
