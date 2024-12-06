import axios from 'axios';
import { ProxyTypeMapping } from '../../enums/proxy.enum';
import { IProxyService } from './iproxy.service';

export class ProxyService implements IProxyService {
    private readonly BASE_URL = `${process.env.SITE_BUY_PROXY}/api/muaproxy.php`;

    async buyProxy(key: string, orderId: string, quantity: number): Promise<any> {
        const loaiproxy = ProxyTypeMapping[key];
        if (!loaiproxy) {
            throw new Error('Invalid orderId provided');
        }

        const params = {
            key: process.env.API_KEY_SITE_BUY_PROXY,
            loaiproxy,
            soluong: quantity,
            ngay: 30,
        };
        const fullUrl = `${this.BASE_URL}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&loaiproxy=${encodeURIComponent(loaiproxy)}&soluong=${encodeURIComponent(quantity)}&ngay=${encodeURIComponent(1)}`;
        try {
            const response = await axios.post(fullUrl);
            const proxyList =  processProxyResponse(response.data);
            return proxyList;
        } catch (error) {
            throw new Error(`Error calling proxy API: }`);
        }
    }

    getAmountInventory(): Promise<any> {
        return Promise.resolve({ sum: 130 });
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
