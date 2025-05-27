export interface IGmailService {
    // current gmail 2013 
    buyGmail(key: string, orderId: string, quantity: number): Promise<any>;

    getGmailAmountInventory(key: string): Promise<any>;
}
