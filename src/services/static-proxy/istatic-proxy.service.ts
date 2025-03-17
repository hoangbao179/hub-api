import { IStaticProxy } from "../../models/static-proxy/static-proxy.model";

export interface IStaticProxyService {
    buyStaticProxy(key: string, orderId: string, quantity: number): Promise<IStaticProxy>;

    getAmountInventory(): Promise<any>;
}
