export interface ModuleConfig {
  path: string;
  routes: string[];
  cache?: boolean;
  watch?: boolean;
}
export interface AppConfig {
  port?: number;
  watch?: boolean;
  hostname?: string;
}
