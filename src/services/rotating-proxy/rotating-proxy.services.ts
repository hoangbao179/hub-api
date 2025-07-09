import axios from 'axios';
import { IRotatingProxyService } from './irotating-proxy.services';
import { RotatingProxyTypeMapping } from '../../enums/proxy.enum';
import { PackageProxy, PeriodPrice, ProxyRotatingModel, } from 'models/rotating-proxy/proxy-rotating.model';
import { PurchaseNotifierInterface } from '../notification/inotifyPurchase';
import { PurchaseNotifier } from '../notification/notifyPurchase';

export class RotatingProxyService implements IRotatingProxyService {
    private readonly apiKey = `${process.env.API_KEY_PROXY_ROTATING}`;
    private readonly urlBuy = `${process.env.URL_BUY_PROXY_ROTATING}`;
    private readonly urlGetPackage = `${process.env.URL_GET_PACKAGE_ROTATING_PROXY}`;
    private readonly notifier: PurchaseNotifierInterface;
    
    constructor() {
        this.notifier = new PurchaseNotifier();
    }

    async buyRotatingProxy(key: string, orderId: string, quantity: number): Promise<any> {
        if( quantity > 9){
            return Array(quantity).fill({ product: `Đơn hàng: ${orderId} đang order hơn 10 key, liên hệ shop hoặc tele: hateno17 để cấp key` });
        }
        const proxyType = RotatingProxyTypeMapping[key];
        if (!proxyType) {
            throw new Error('Invalid orderId provided');
        }

        let packageProxy = await this.getPeriodPriceByCode(proxyType);
        try {
            const requestData = {
                quantity: quantity,
                numberOfPeriods: 1,
                packageId: packageProxy.periodPrice.packageId,
                packagePeriodId: packageProxy.periodPrice.id
            };

            const headers = {
                'api-token': this.apiKey,
                'Content-Type': 'application/json'
            };
            const response = await axios.post(this.urlBuy, requestData, { headers });
            // Gửi thông báo sau 30 giây, không chờ
                // setTimeout(() => {
                //     this.notifier.notifyPurchase().catch(err => console.error('Lỗi gửi thông báo:', err));
                // }, 30000);
            return formatProxyResponse(response.data);
        } catch (error: any) {
             return Array(quantity).fill({ product: `Mã đơn hàng: ${orderId} call api đang lỗi, liên hệ chủ shop để nhận sản phẩm và hỗ trợ` });
        }
    }

    async fetchPackages(): Promise<PackageProxy[]> {
        try {
            const response = await axios.get<{ data: PackageProxy[] }>(this.urlGetPackage);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching packages:', error);
            throw new Error('Cannot fetch packages');
        }
    }

    async getPeriodPriceByCode(code: string): Promise<{ periodPrice: PeriodPrice, priority: number } | null> {
        try {
            const packages = await this.fetchPackages();
            for (const pkg of packages) {
                const periodPrice = pkg.periodPrices.find(pp => pp.code === code);
                if (periodPrice) {
                    return { periodPrice, priority: pkg.priority };
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching period price by code:', error);
            return null;
        }
    }

    async getAmountInventory(): Promise<any> {
        return Promise.resolve({ sum: 458 });
    }

    async getInfoProxy(key: string, region?: string): Promise<ProxyRotatingModel | { error: string }> {
        try {
            let apiUrl = `${process.env.URL_GET_DATA_ROTATING_PROXY}=${key}`;
            if (region) apiUrl += `&region=${region}`;

            const response = await axios.get(apiUrl);

            if (response.data.success) {
                const rawData = response.data.data;

                const proxyData: ProxyRotatingModel = {
                    realIpAddress: rawData.realIpAddress,
                    http: rawData.http,
                    socks5: rawData.socks5,
                    nextRequestAt: new Date(rawData.nextRequestAt),
                    httpPort: rawData.httpPort,
                    socks5Port: rawData.socks5Port,
                    host: rawData.host,
                    location: rawData.location,
                    expirationAt: new Date(rawData.expirationAt),
                    ttl: rawData.ttl,
                    ttc: rawData.ttc,
                };

                return proxyData;
            }
        } catch (error: any) {
            return {
                error: error.response?.data.message || "Proxy của bạn chưa đến thời gian đổi",
            }; 
        }
    }
}

function formatProxyResponse(apiResponse) {
    if (!apiResponse || !apiResponse.data) {
        return [];
    }
    return apiResponse.data.map(item => ({
        product: item.value || 'Unknown Product',
    }));
}

function randomRotatingProxy() {
  const prefix = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Random A-Z
  const hexPart = [...Array(32)].map(() =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return prefix + hexPart;
}

function generateProxies(quantity) {
  return Array.from({ length: quantity }, () => ({
    product: randomRotatingProxy()
  }));
}