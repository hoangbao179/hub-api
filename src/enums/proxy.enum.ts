export enum StaticProxyType {
    Viettel = 1,
    Fpt = 2,
    Vnpt = 3,
    US = 4,
}

export const StaticProxyTypeMapping: Record<string, string> = {
    "2b1701e2-f6d4-4a29-82f0-7dcb0c820f53": "Viettel",
    "90438f46-835c-4e24-be9f-6564760d3490": "Viettel",
    "8ada707f-50a6-4094-a273-a4e938353ead": "Viettel",
    "b34c3353-c41f-42fb-9ede-ce27b32cbc42": "Viettel",
    "0467677a-7ce0-4411-8cf3-330f8b857855": "FPT",
    "3c015121-6f5b-4c1b-9abe-4c18362dedd2": "FPT",
    "cac02a2b-8ef5-4052-ae7e-45bbe0ef5e23": "FPT",
    "238c3e13-a4df-41af-b760-aa70a63c0fb1": "FPT",
    "c238ce00-9123-4428-8990-46eee8e3d2ff": "VNPT",
    "5acc02b2-c068-4d70-9b3c-1af5bcbdb688": "VNPT",
    "aa8884d8-1592-4ff3-bb16-7f2e752dce9e": "US",
    "fb73eaf1-77aa-44eb-8a14-b0bd8fadacfc": "US",
    "bd9bcbab-0403-4806-bc31-4a809cfddb56": "DatacenterC" 
};

export const RotatingProxyTypeMapping: Record<string, string> = {
    "34e177eb-becc-47a4-aaba-7c9a54552411": "CHANGE_PROXY_1_DAY",
    "15f60b3d-6b52-45bd-8756-69ab56907379": "CHANGE_PROXY_1_DAY",
    "4a1d65a0-1bf3-4044-afda-75c715ff8022": "CHANGE_PROXY_1_WEEK",
    "8b4bf9d4-38e7-420f-8e58-703691e36e2d": "CHANGE_PROXY_VIP_1_DAY",
    "34823d9d-3732-48ed-82db-4c8fd6902f23": "CHANGE_PROXY_VIP_1_DAY",
    "af32e02a-594f-4681-8400-9603c84688da": "CHANGE_PROXY_VIP_1_WEEK",
};
