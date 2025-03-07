/**
 * Configuration options for adapter initialization
 */
export interface AdapterInitOptions {
  port?: number | string;
  hostname?: string;
  [key: string]: any;
}
