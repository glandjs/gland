import { ProtocolType } from '@gland/common/types';
import { AdapterInitOptions } from './adapter-options.interface';

export interface Adapter<T extends ProtocolType = ProtocolType> {
  get protocol(): T;
  init(options?: AdapterInitOptions): Promise<void> | void;
  listen(port: number | string, hostname?: string): void;
  shutdown(): Promise<void>;
}
