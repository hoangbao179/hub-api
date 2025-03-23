export interface PeriodPrice {
    createdBy: string;
    createdAt: number;
    lastModifiedBy: string;
    lastModifiedAt: number;
    id: string;
    packageId: string;
    quantity: number;
    period: string;
    name: string;
    code: string;
    description: string;
    price: number;
    referencePrice: number;
    status: string;
    deleted: boolean;
    version: number;
    unitPrice: number;
    unitReferencePrice: number;
  }
  
export interface PackageProxy {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  ttl: number;
  ttc: number;
  allowUnlimitedUse: boolean;
  allowUnlimitedChange: boolean;
  allowUnlimitedBandwidth: boolean;
  allowSocks5: boolean;
  referencePrice: number;
  addressType: string;
  priority: number;
  minUnitPrice: number;
  maxUnitPrice: number;
  minUnitReferencePrice: number;
  maxUnitReferencePrice: number;
  periodPrices: PeriodPrice[];
}

export interface ProxyRotatingModel {
  realIpAddress: string;
  http: string;
  socks5: string;
  nextRequestAt: Date;
  httpPort: number;
  socks5Port: number;
  host: string;
  location: string;
  expirationAt: Date;
  ttl: number;
  ttc: number;
}
export interface ProxyRotatingError {
  success: boolean;
  code: number;
  message: string;
  timestamp: Date;
  status: string;
  error: string;
}