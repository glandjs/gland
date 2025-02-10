import { CorsOptions, CorsOptionsDelegate } from '@gland/common';
import { ViewsEnginesOptions } from '../interface/config.interface';

export type TrustProxyOption = boolean | number | 'loopback' | 'linklocal' | 'uniquelocal' | string | string[] | ((ip: string, distance: number) => boolean);
export type ViewsConfig = {
  directory: string | string[];
  engine?: ViewsEnginesOptions;
};
export type CorsServiceConfig<T> = boolean | CorsOptions | CorsOptionsDelegate<T>;
