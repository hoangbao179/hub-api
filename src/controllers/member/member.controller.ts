// src/controllers/member/member.controller.ts
import { Request, Response } from 'express';
import { MemberService } from '../../services/member/member.service';
import {
  BuyMemberProxyParams,
  MemberProxyService,
} from '../../services/member/member-proxy.service';

class MemberController {
  constructor(
    private readonly memberService: MemberService,
    private readonly memberProxyService: MemberProxyService
  ) {}

  /**
   * GET /api/member/info?member_key=...
   * Trả về name + allocation, không trả id.
   */
  getInfo = async (req: Request, res: Response): Promise<any> => {
    try {
      const { member_key } = req.query;

      if (!member_key || typeof member_key !== 'string') {
        return res.status(400).json({ error: 'Vui lòng thêm key vào' });
      }

      const info = await this.memberService.getInfoByKey(member_key);
      if (!info) {
        return res.status(404).json({ error: 'Người dùng không tồn tại' });
      }

      return res.status(200).json(info);
    } catch (err) {
      console.error('[MemberController.getInfo] error', err);
      return res.status(500).json({ error: 'Có lỗi nghiêm trọng vui lòng liên hệ tele hateno17 để hỗ trợ' });
    }
  };

  /**
   * GET /api/member/proxy/buy
   * Query:
   *  - member_key (string, required)
   *  - proxy_type (string, required)  -> viettel | vnpt | fpt
   *  - type (string, required)        -> http | socks5
   *  - quantity (number, required)
   *  - proxy_name (optional)
   *  - proxy_pass (optional)
   *
   * Trả về 1 dòng text: "Vui lòng truy cập link ...".
   */
  buyProxy = async (req: Request, res: Response): Promise<any> => {
    try {
      const { member_key, proxy_type, connection_type, quantity, proxy_name, proxy_pass } = req.query;

      if (!member_key || !proxy_type || !connection_type || !quantity) {
        return res.status(400).json({
          error: 'Cần đây đủ tham số bao gồm member_key, connectionType, quantity và proxyType',
        });
      }

      const qty = Number(quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ error: 'số lượng phải lớn hơn 0' });
      }

      const params: BuyMemberProxyParams = {
        memberKey: String(member_key),
        proxyType: String(proxy_type),
        connectionType: String(connection_type),
        quantity: qty,
        proxyName: proxy_name ? String(proxy_name) : undefined,
        proxyPass: proxy_pass ? String(proxy_pass) : undefined,
      };

      const message = await this.memberProxyService.buyProxyForMember(params);

      // API này trả plain text chứ không phải JSON
      return res.status(200).type('text/plain; charset=utf-8').send(message);
    } catch (err: any) {
      console.error('[MemberController.buyProxy] error', err);
      return res.status(500).json({ error: 'Có lỗi nghiêm trọng vui lòng liên hệ tele hateno17 để hỗ trợ' });
    }
  };
}

export default MemberController;
