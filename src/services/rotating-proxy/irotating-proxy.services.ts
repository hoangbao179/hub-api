export interface IRotatingProxyService {
    buyRotatingProxy(key: string, orderId: string, quantity: number): Promise<any>;

    getAmountInventory(): Promise<any>;
}
