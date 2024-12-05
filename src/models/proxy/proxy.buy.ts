export interface BuyProxyRequest {
    orderId: number;
    quantity: number;
}

export interface ProxyResponse {
    status: number;
    loaiproxy: string;
    idproxy: number;
    ip: string;
    port: number;
    user: string;
    password: string;
    type: string;
    proxy: string;
    time: number;
}

export interface SuccessResponse {
    status: number;
    comen: string;
}
