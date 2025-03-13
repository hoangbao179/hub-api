import axios from 'axios';
import { ProxyTypeMapping } from '../../enums/proxy.enum';
import { IProxyService } from './iproxy.service';
import { Lead } from 'models/proxy/proxy.buy';

export class StaticProxyService implements IStaticProxyService {
    private readonly BASE_URL = `${process.env.SITE_BUY_PROXY}/api/muaproxy.php`;

    async buyStaticProxy(key: string, orderId: string, quantity: number): Promise<any> {
        const loaiproxy = StaticProxyTypeMapping[key];
        if (!loaiproxy) {
            throw new Error('Invalid orderId provided');
        }

        const fullUrl = `${this.BASE_URL}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&loaiproxy=${encodeURIComponent(loaiproxy)}&soluong=${encodeURIComponent(quantity)}&ngay=${encodeURIComponent(1)}`;
        try {
            const response = await axios.post(fullUrl);
            const proxyList =  processProxyResponse(response.data);
            return proxyList;
        } catch (error) {
            throw new Error(`Error calling proxy API: }`);
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

function processProxyResponse(responseString: string): any[] {
    const result: any[] = [];
    const responseParts = responseString.split('}{').map((part, index, array) => {
        if (index === 0) {
            return part + '}'; 
        } else if (index === array.length - 1) {
            return '{' + part; 
        }
        return '{' + part + '}'; 
    });

    for (const part of responseParts) {
        try {
            const data = JSON.parse(part); 
            if (data.status === 200) {
                return result;
            }

            if (data.status === 100) {
                const { proxy } = data;
                const proxyParts = proxy.split(':');

                if (proxyParts.length === 4) {
                    const [ip, port, user, password] = proxyParts;
                    const product = `${ip}:${port}:${user}:${password}`; 
                    result.push({ product });
                } else {
                    throw new Error("Invalid proxy format.");
                }
            }
        } catch (error) {
            console.error("Error parsing response:", error.message);
        }
    }

    return result;
}
