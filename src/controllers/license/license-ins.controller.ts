// controllers/license.controller.ts

import { Request, Response } from "express";
import * as googleSheetService from "../../services/license-ins/googleSheet.service";

class LicenseController {
  async checkLicense(req: Request, res: Response) {
    try {
      const { key, hwid } = req.body;
      if (!key || !hwid) {
        return res.status(400).json({ success: false, message: 'Thiếu key hoặc hwid!' });
      }

      const license = await googleSheetService.getLicenseByKey(key);
      if (!license) {
        return res.json({ success: false, message: 'Key không tồn tại!' });
      }

      if (!license.hwid) {
        await googleSheetService.updateHWID(key, hwid);
        license.hwid = hwid;
      }

      if (license.hwid !== hwid) {
        return res.json({ success: false, message: 'Key đã được gắn với máy khác!' });
      }

      const today = new Date();
      const expiredDate = new Date(license.expired);
      if (expiredDate < today) {
        return res.json({ success: false, message: 'Key đã hết hạn!', expired: license.expired });
      }

      // Trả về thêm hạn key (expired)
      return res.json({
        success: true,
        message: 'Key hợp lệ!',
        expired: license.expired
      });
    } catch (err) {
      console.error('[checkLicense]', err);
      res.status(500).json({ success: false, message: 'Lỗi hệ thống!' });
    }
  }

    getVersion(req: Request, res: Response) {
    // Lấy từ .env, nếu không có thì dùng mặc định
    return res.json({ version: process.env.APP_INS_VERSION});
  }
}

export default new LicenseController();
