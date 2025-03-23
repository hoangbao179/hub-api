import axios from 'axios';
import { IRotatingProxyService } from './irotating-proxy.services';
import { RotatingProxyTypeMapping } from '../../enums/proxy.enum';
import { PackageProxy, PeriodPrice, ProxyRotatingModel, } from 'models/rotating-proxy/proxy-rotating.model';

export class RotatingProxyService implements IRotatingProxyService {
    private readonly apiKey = `${process.env.API_KEY_PROXY_ROTATING}`;
    private readonly urlBuy = `${process.env.URL_BUY_PROXY_ROTATING}`;
    private readonly urlGetPackage = `${process.env.URL_GET_PACKAGE_ROTATING_PROXY}`;
    async buyRotatingProxy(key: string, orderId: string, quantity: number): Promise<any> {
        const proxyType = RotatingProxyTypeMapping[key];
        if (!proxyType) {
            throw new Error('Invalid orderId provided');
        }

        let packageProxy = await this.getPeriodPriceByCode(proxyType);
        try {
            const requestData = {
                quantity: quantity,
                numberOfPeriods: packageProxy.priority,
                packageId: packageProxy.periodPrice.packageId,
                packagePeriodId: packageProxy.periodPrice.id
            };

            const headers = {
                'api-token': this.apiKey,
                'Content-Type': 'application/json'
            };
            const response = await axios.post(this.urlBuy, requestData, { headers });

            return formatProxyResponse(response);
        } catch (error: any) {
            console.error('Error in buyRotatingProxy:', error.message);
            throw error;
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
        Promise.resolve({ sum: 22 });
    }

    async getInfoProxy(key: string, region?: string): Promise<ProxyRotatingModel | { success: boolean; message: string; error?: any }> {
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
            } else {
                return { success: false, message: 'Failed to fetch proxy data' };
            }
        } catch (error) {
            return { success: false, message: 'Error fetching proxy data', error };
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