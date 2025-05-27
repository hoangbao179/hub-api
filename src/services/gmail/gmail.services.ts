import { IGmailService } from "./igmail.services";
import axios from 'axios';
import { GmailTypeMapping } from "../../enums/gmail.enum";

export class GmailService implements IGmailService {
    private readonly userToken = process.env.USER_TOKEN_API_TH;
    private readonly apiBaseUrl = `https://${process.env.SITE_SELL_GMAIL}/api`;

    async buyGmail(key: string, orderId: string, quantity: number): Promise<any> {
        try {
            const gmailType = GmailTypeMapping[key];
            if (!gmailType) {
                throw new Error('Invalid orderId provided');
            }

            const buyUrl = `${this.apiBaseUrl}/buyProducts?kioskToken=${encodeURIComponent(gmailType)}&userToken=${this.userToken}&quantity=${quantity}`;
            const buyResponse = await axios.get(buyUrl);

            if (buyResponse.data.success !== "true") {
                return { success: "false", description: buyResponse.data.description || "Purchase failed" };
            }

            const newOrderId = buyResponse.data.order_id;

            // chưa xử lý được vụ call api xem còn bao nhiêu tiền nên tạm thời chưa xử lý 

            // Hàm thử lấy sản phẩm với retry
            const fetchProducts = async (attempt = 1): Promise<any> => {
                const getUrl = `${this.apiBaseUrl}/getProducts?orderId=${newOrderId}&userToken=${this.userToken}`;
                const getResponse = await axios.get(getUrl);

                if (getResponse.data.success === "true") {
                    return getResponse.data.data.map((item: { product: string }) => ({ product: 'email|pass|mailkp:'+ item.product }));
                }

                if (getResponse.data.description === "Order in processing!" && attempt <= 2) {
                    await new Promise(resolve => setTimeout(resolve, 3000)); // Chờ 5 giây
                    return fetchProducts(attempt + 1);
                }

                return { success: "false", description: getResponse.data.description || "Failed to fetch products" };
            };

            return await fetchProducts();
        } catch (error: any) {
            console.error('Error in buyGmail:', error.message);
            return { success: "false", description: error.message || "Purchase error" };
        }
    }

    async getGmailAmountInventory(key: string): Promise<{ sum: number }> {
        try {
            const gmailType = GmailTypeMapping[key];
            if (!gmailType) {
                throw new Error('Invalid orderId provided');
            }
            const response = await axios.get(`${this.apiBaseUrl}/getStock?kioskToken=${encodeURIComponent(gmailType)}&userToken=${this.userToken}`);
            if (response.data.success === "true") {
                return { sum: parseInt(response.data.stock, 10) };
            }
            throw new Error('API response unsuccessful');
        } catch (error) {
            console.error('Error fetching Gmail inventory:', error);
            throw new Error('Cannot fetch Gmail inventory');
        }
    }
}