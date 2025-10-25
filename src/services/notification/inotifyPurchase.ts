export interface PurchaseNotifierInterface {
  notifyPurchase(isRotating: boolean, orderId: string, quantity: number, status: any, message?: any): Promise<void>;
}