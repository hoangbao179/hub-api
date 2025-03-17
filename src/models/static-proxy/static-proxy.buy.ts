export interface BuyStaticProxyRequest {
    orderId: number;
    quantity: number;
}

export interface StaticProxyResponse {
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


export interface Attribute {
    key: string;
    modified?: number;
    by_type?: string;
    datetime?: string;
    text?: string;
    by?: string;
    user_value?: string;
    boolean?: boolean;
  }
  
  export interface Lead {
    id: string;
    account_id: string;
    attributes: Attribute[];
    type: string;
    profile_id: string;
    channel_source: string;
    channel: string;
    created: number;
    updated: number;
  }
