// src/services/member/member.service.ts
import { dbPool } from '../../db';

export interface Member {
  id: number;
  key: string;
  name: string;
  allocation: number;
}

export class MemberService {
  async findByKey(memberKey: string): Promise<Member | null> {
    const [rows] = await dbPool.query(
      'SELECT id, `key`, name, allocation FROM members WHERE `key` = ? LIMIT 1',
      [memberKey]
    ) as any[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const row = rows[0] as any;
    return {
      id: Number(row.id),
      key: String(row.key),
      name: String(row.name),
      allocation: Number(row.allocation),
    };
  }

  async getInfoByKey(memberKey: string): Promise<{ name: string; allocation: number } | null> {
    const member = await this.findByKey(memberKey);
    if (!member) return null;
    return { name: member.name, allocation: member.allocation };
  }

  /**
   * Kiểm tra member có order đang PENDING/PROCESSING hay không.
   * (đảm bảo phải xử lý nối tiếp, không chạy 2–3 đơn song song)
   */
  async hasActiveOrder(memberId: number): Promise<boolean> {
    const [rows] = await dbPool.query(
      `SELECT COUNT(*) AS c FROM orders WHERE member_id = ? AND status IN ('PENDING','PROCESSING')`,
      [memberId]
    ) as any[];

    const row = rows && rows[0];
    const count = row ? Number(row.c) : 0;
    return count > 0;
  }

  /**
   * Trừ allocation theo kiểu atomic: chỉ trừ khi allocation hiện tại >= quantity.
   * Trả về true nếu trừ thành công, false nếu không đủ.
   */
  async decreaseAllocation(memberId: number, quantity: number): Promise<boolean> {
    const [result] = await dbPool.query(
      'UPDATE members SET allocation = allocation - ? WHERE id = ? AND allocation >= ?',
      [quantity, memberId, quantity]
    ) as any[];

    const okPacket = result as any;
    return !!okPacket && Number(okPacket.affectedRows || 0) > 0;
  }
}
