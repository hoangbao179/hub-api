import { Router, Request } from 'express';
import { fulfillmentController } from '../controllers/fulfillment/fulfillment.controller';
import rateLimit from 'express-rate-limit';

function getClientIp(req: Request): string {
  // Ưu tiên x-forwarded-for (nếu chạy sau proxy)
  const xff = req.headers['x-forwarded-for'];
  const first = Array.isArray(xff) ? xff[0] : (xff || '');
  const ipFromXff = typeof first === 'string' && first ? first.split(',')[0].trim() : '';

  const raw = ipFromXff || req.ip || '';
  // Chuẩn hoá: bỏ [] và thay ":" (IPv6) bằng "-"
  return raw.toString().replace(/\[/g, '').replace(/\]/g, '').replace(/:/g, '-') || 'ip-unknown';
}

// 30 requests / phút / (IP, token)
const fulfillmentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const token = (req.params as any)?.token || (req.query as any)?.token || 'no-token';
    return `${ip}|${token}`;
  },
  message: 'Quá nhiều yêu cầu, vui lòng thử lại sau một lúc.',
});

const router = Router();
router.use('/', fulfillmentLimiter);            // áp cho mọi route trong router này
router.get('/:token', fulfillmentController.getByToken);

export default router;