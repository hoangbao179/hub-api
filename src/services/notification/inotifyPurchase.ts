export interface PurchaseNotifierInterface {
  notifyPurchase(): Promise<void>;
}