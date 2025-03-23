export enum StaticProxyType {
    Viettel = 1,
    Fpt = 2,
    Vnpt = 3,
    US = 4,
}

export const StaticProxyTypeMapping: Record<string, string> = {
    "2b1701e2-f6d4-4a29-82f0-7dcb0c820f53": "Viettel",
    "3c015121-6f5b-4c1b-9abe-4c18362dedd2": "FPT",
    "90438f46-835c-4e24-be9f-6564760d3490": "US",
    "c238ce00-9123-4428-8990-46eee8e3d2ff": "VNPT",
    "cac02a2b-8ef5-4052-ae7e-45bbe0ef5e23": "DatacenterB",
};

export const RotatingProxyTypeMapping: Record<string, string> = {
    "34e177eb-becc-47a4-aaba-7c9a54552411": "CHANGE_PROXY_1_DAY",
    "af32e02a-594f-4681-8400-9603c84688da": "CHANGE_PROXY_1_WEEK",
    "4a1d65a0-1bf3-4044-afda-75c715ff8022": "CHANGE_PROXY_1_MONTH",
    "4a1d65a0-1bf3-4044-afda-75c715ff8020": "CHANGE_PROXY_VIP_1_DAY",
    "4a1d65a0-1bf3-4044-afda-75c715ff8042": "CHANGE_PROXY_VIP_1_WEEK",
    "4a1d65a0-1bf3-4044-afda-45c715ff8022": "CHANGE_PROXY_VIP_1_MONTH",
};
