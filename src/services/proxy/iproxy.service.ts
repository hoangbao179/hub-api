import { IProxy } from "../../models/proxy/proxy.model";

export interface IProxyService {
    buyProxy(key: string, orderId: string, quantity: number): Promise<IProxy>;

    getAmountInventory(): Promise<any>;
}
