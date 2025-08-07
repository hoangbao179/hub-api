import { Request, Response } from "express";
import * as googleSheetService from "../../services/licese-email/email-googleSheet.service"
import axios from "axios";
const TEMP_MAIL_API_BASE = process.env.TEMP_MAIL_API_BASE!;

class EmailController {
  async createEmail(req: Request, res: Response) {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ success: false, message: 'Thiếu username!' });
      }

      const user = await googleSheetService.getUserByUsername(username);
      if (!user || user.count <= 0) {
        return res.status(400).json({ success: false, message: 'Username không hợp lệ hoặc hết lượt!' });
      }

      // Call API create email
      const apiRes = await axios.post(`${TEMP_MAIL_API_BASE}/create`);
      const data = apiRes.data;

      // Giảm count 1
      await googleSheetService.updateCount(username, user.count - 1);

      return res.json({ success: true, message: 'Email tạm tạo thành công!', data });
    } catch (err) {
      console.error('[createEmail]', err);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống!' });
    }
  }

  async readEmail(req: Request, res: Response) {
    try {
      const { username, email } = req.body;
      if (!username || !email) {
        return res.status(400).json({ success: false, message: 'Thiếu username hoặc email!' });
      }

      const user = await googleSheetService.getUserByUsername(username);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Username không hợp lệ!' });
      }

      // Call API read email
      const apiRes = await axios.get(`${TEMP_MAIL_API_BASE}/read/${email}`);
      const data = apiRes.data;

      return res.json({ success: true, message: 'Đọc email thành công!', data });
    } catch (err) {
      console.error('[readEmail]', err);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống!' });
    }
  }
}

export default new EmailController();