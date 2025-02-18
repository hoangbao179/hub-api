import { IStaticProxy } from "../../models/proxy/static-proxy.model";

export interface IStaticProxyService {
    buyStaticProxy(key: string, orderId: string, quantity: number): Promise<IStaticProxy>;

    getAmountInventory(): Promise<any>;
}
