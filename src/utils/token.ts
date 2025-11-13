import crypto from 'crypto';

export function genResultToken(externalOrderId: string) {
  const rand = crypto.randomBytes(6).toString('hex');              // 12 kí tự hex
  const ts = new Date().toISOString().slice(0,19).replace(/[-:T]/g,''); // yyyymmddHHMMss
  return `ord_${externalOrderId}_${ts}_${rand}`;
}

export function buildFulfillmentUrl(token: string) {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/,'') || '';
  return `${base}/fulfillments/${token}`;
}

export function unixToDateTime(unix: number) {
  return new Date(unix * 1000);
}

export function buildFulfillmentUrlWithOrderId(orderId: string) {
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/+$/,'') || '';
  // nếu mount dưới /api thì đổi thành /api/fulfillments
  return `${base}/api/fulfillments/${orderId}`;
}