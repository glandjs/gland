export type TrustProxyOption = boolean | number | string | string[] | ((ip: string, distance: number) => boolean);
