import axios from 'axios';
import { StaticProxyTypeMapping } from '../../enums/proxy.enum';
import { IStaticProxyService } from './istatic-proxy.service';
import { Lead } from 'models/static-proxy/static-proxy.buy';
import { IStaticProxy } from 'models/static-proxy/static-proxy.model';

export class StaticProxyService implements IStaticProxyService {
    private readonly BASE_URL = `${process.env.SITE_BUY_PROXY}/api/muaproxy.php`;
    private readonly BASE_URL_V6 = `${process.env.SITE_BUY_PROXY}/ipv6/apimuaipv6.php`;
    async buyStaticProxy(key: string, orderId: string, quantity: number): Promise<any> {
        const proxyType = StaticProxyTypeMapping[key];
        if (!proxyType) {
            throw new Error('Invalid orderId provided');
        }

        const fullUrl = `${this.BASE_URL}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&loaiproxy=${encodeURIComponent(proxyType)}&soluong=${encodeURIComponent(quantity)}&ngay=${encodeURIComponent(30)}`;
        try {
            const response = await axios.post(fullUrl);
            const proxyList =  processProxyResponse(response.data);
            return proxyList;
        } catch (error) {
            throw new Error(`Error calling proxy API: }`);
        }
    }

    async getAmountInventory(): Promise<any> {
        // const userInfoUrl = `${process.env.API_GET_INFO_USER}`;
    
        // try {
        //     const response = await axios.get<Lead>(userInfoUrl); 
        //     const data: Lead = response.data;
        //     const moneyOfUser = data.attributes?.find((attr) => attr.key === "tienweb");
    
        //     if (moneyOfUser && moneyOfUser.user_value) {
        //         const amount = parseFloat(moneyOfUser.user_value.replace(" VNĐ", "").replace(/\./g, ""));
        //         const quotient = Math.floor(amount / 14400);
        //         return Promise.resolve({ sum: quotient });
        //     }

        //     return Promise.resolve({ sum: 22 });
        // } catch (error) {
        //     console.error("API call error:", error);
        //     return Promise.resolve({ sum: 22 });
        // }
        return Promise.resolve({ sum: 70 });
    }


    async buyStaticProxySocks5(key: string, orderId: string, quantity: number): Promise<any> {
        const proxyType = StaticProxyTypeMapping[key];
        if (!proxyType) {
            throw new Error('Invalid orderId provided');
        }
        
        if(proxyType == "RANDOM"){

        }
        const fullUrl = `${this.BASE_URL}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&type=${encodeURIComponent('SOCKS5')}&loaiproxy=${encodeURIComponent(proxyType)}&soluong=${encodeURIComponent(quantity)}&ngay=${encodeURIComponent(1)}`;
        try {
            const response = await axios.post(fullUrl);
            const proxyList =  processProxyResponse(response.data);
            return proxyList;
        } catch (error) {
            throw new Error(`Error calling proxy API: }`);
        }
    }

    async getAmountInventorySocks5(): Promise<any> {
        return Promise.resolve({ sum: 70 });
    }


    async buyStaticProxyV6(key: string, orderId: string, quantity: number): Promise<any> {
        const proxyType = StaticProxyTypeMapping[key];
        if (!proxyType || proxyType !== "IPV6") {
            throw new Error('Invalid orderId provided');
        }

        const fullUrl = `${this.BASE_URL_V6}?key=${encodeURIComponent(process.env.API_KEY_SITE_BUY_PROXY)}&soluong=${encodeURIComponent(quantity)}&ngay=${encodeURIComponent(30)}`;
        try {
            const response = await axios.post(fullUrl);
            const proxyList =  processProxyResponseV6(response.data);
            return proxyList;
        } catch (error) {
            throw new Error(`Error calling proxy API: }`);
        }
    }

    getAmountInventoryV6(): Promise<any> {
        return Promise.resolve({ sum: 250 });
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


function processProxyResponseV6(data: string): { product: string }[] {
    // Kiểm tra nếu data không phải string hoặc rỗng
    if (typeof data !== "string" || !data.trim()) {
        throw new Error("Invalid proxy response data: data must be a non-empty string");
    }

    // Tách chuỗi thành các JSON object dựa trên dấu '}{'
    const jsonObjects = data
        .replace(/\}\{/g, "}|{") // Thêm dấu '|' giữa các object để dễ tách
        .split("|")
        .map((item) => item.trim());

    const result: { product: string }[] = [];

    for (const jsonStr of jsonObjects) {
        try {
            // Parse chuỗi JSON thành object
            const parsed = JSON.parse(jsonStr);
            
            // Kiểm tra status và proxy
            if (parsed.status !== 100 || !parsed.proxy) {
                throw new Error("Invalid proxy object data");
            }

            // Thêm proxy vào kết quả
            result.push({ product: parsed.proxy });
        } catch (error) {
            throw new Error(`Failed to parse proxy object: ${error.message}`);
        }
    }

    // Kiểm tra nếu không có proxy nào
    if (result.length === 0) {
        throw new Error("No valid proxy data found");
    }

    return result;
}