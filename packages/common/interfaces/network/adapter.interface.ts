import { ProtocolType } from '../../types';
import { AdapterInitOptions } from './adapter-options.interface';

export interface Adapter<T extends ProtocolType = ProtocolType> {
  get protocol(): T;
  init(options?: AdapterInitOptions): Promise<void> | void;
  shutdown(): Promise<void>;
}
