import axios from 'axios';
import { IRotatingProxyService } from './irotating-proxy.services';
import { RotatingProxyTypeMapping } from '../../enums/proxy.enum';
import { Lead } from '../../models/static-proxy/static-proxy.buy';

export class RotatingProxyService implements IRotatingProxyService {
    async buyRotatingProxy(key: string, orderId: string, quantity: number): Promise<any> {
        const baseUrl = RotatingProxyTypeMapping[key];
        if (!baseUrl) {
            throw new Error('Invalid orderId provided');
        }
        const siteBuyRotatingProxy = `${baseUrl}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&soluong=${encodeURIComponent(quantity)}&thoigian=${encodeURIComponent(1)}`;
        const siteLoadKeyRotatingProxy = `${process.env.SITE_GET_KEY_ROTATING_URL}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}`
        try {
            //Gửi yêu cầu mua proxy
            const buyResponse = await axios.post(siteBuyRotatingProxy);
            if (!buyResponse.data || buyResponse.status !== 200) {
                throw new Error(`Failed to buy rotating proxy: ${buyResponse.statusText}`);
            }

            // Lấy danh sách key proxy
            const keyResponse = await axios.get(siteLoadKeyRotatingProxy);
            if (!keyResponse.data || keyResponse.status !== 200) {
                throw new Error(`Failed to fetch proxy keys: ${keyResponse.statusText}`);
            }

            // Xử lý danh sách proxy
            const proxyList = processProxyResponse(keyResponse.data, quantity);

            return proxyList;
        } catch (error: any) {
            console.error(`Error fetching rotating proxy: ${error.message}`);
            throw new Error(`Error calling proxy API: ${error.message}`);
        }
    }

    async getAmountInventory(): Promise<any> {
        const userInfoUrl = `${process.env.API_GET_INFO_USER}`;
    
        try {
            const response = await axios.get<Lead>(userInfoUrl); 
            const data: Lead = response.data;
            const moneyOfUser = data.attributes?.find((attr) => attr.key === "tienweb");
    
            if (moneyOfUser && moneyOfUser.user_value) {
                const amount = parseFloat(moneyOfUser.user_value.replace(" VNĐ", "").replace(/\./g, ""));
                const quotient = Math.floor(amount / 14400);
                return Promise.resolve({ sum: quotient });
            }

            return Promise.resolve({ sum: 22 });
        } catch (error) {
            console.error("API call error:", error);
            return Promise.resolve({ sum: 22 });
        }
    }

}

function processProxyResponse(responseString: string, quantity: number): any[] {
    const result: any[] = [];

    // Chuyển các JSON riêng lẻ thành một mảng JSON hợp lệ
    const jsonArrayString = `[${responseString.replace(/}\s*{/g, '},{')}]`;

    try {
        const jsonArray = JSON.parse(jsonArrayString); 

        for (const data of jsonArray) {
            if (data.status === 200) {
                return result; 
            }

            if (data.status === 100 && data.keyxoay) {
                result.push({ product: data.keyxoay }); 
            }

            if (result.length >= quantity) {
                break; 
            }
        }
    } catch (error) {
        console.error("Error parsing response:", error.message);
    }

    return result;
}
