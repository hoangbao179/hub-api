export interface IStaticProxy {
    status: number,
    loaiproxy: string,
    idproxy: number,
    ip: string,
    port: number,
    user: string,
    password: string,
    type: string,
    proxy: string,
    time: Date
  }
  
/** Kiểu trả về thống nhất cho service */
export interface FulfillmentRenderResult {
  statusCode: number;
  contentType: string; // 'text/plain' hiện tại (giữ ngỏ cho JSON nếu cần)
  body: string;
}