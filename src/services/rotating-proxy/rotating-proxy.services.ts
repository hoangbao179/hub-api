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
            // Gửi yêu cầu mua proxy
            // const buyResponse = await axios.post(siteBuyRotatingProxy);
            // if (!buyResponse.data || buyResponse.status !== 200) {
            //     throw new Error(`Failed to buy rotating proxy: ${buyResponse.statusText}`);
            // }

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
    const jsonArrayString = `[${responseString.replace(/}\s*{/g, '},{')}]`;
    try {
        const jsonArray = JSON.parse(jsonArrayString);

        const sortedData = jsonArray
            .filter((data) => data.status === 100 && data.keyxoay) 
            .map((data) => ({
                product: data.keyxoay,
                expired: data.expired,
            }))
            .sort((a, b) => {
                const timeA = convertToTimestamp(a.expired);
                const timeB = convertToTimestamp(b.expired);
                return timeB - timeA; 
            })
            .slice(0, quantity); 
        return sortedData.map(({ product }) => ({ product })); 
    } catch (error) {
        console.error("Error parsing response:", error.message);
    }

    return result;
}

function convertToTimestamp(expired: string): number {
    const [time, date] = expired.split(" "); // Tách "14:59 18-03-25" thành ["14:59", "18-03-25"]
    const [hours, minutes] = time.split(":").map(Number);
    const [day, month, year] = date.split("-").map(Number);
    return new Date(2000 + year, month - 1, day, hours, minutes).getTime();
}