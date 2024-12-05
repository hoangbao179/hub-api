import { IProxy } from "../../models/proxy/proxy.model";

export interface IProxyService {
    buyProxy(orderId: number, quantity: number): Promise<IProxy>;

    getAmountInventory(): Promise<any>;
}
