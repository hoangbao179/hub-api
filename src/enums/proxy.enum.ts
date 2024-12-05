export enum ProxyType {
    Viettel = 1,
    Fpt = 2,
    Vnpt = 3
}

export const ProxyTypeMapping: Record<number, string> = {
    [ProxyType.Viettel]: "Viettel",
    [ProxyType.Fpt]: "Fpt",
    [ProxyType.Vnpt]: "VNPT"
};
