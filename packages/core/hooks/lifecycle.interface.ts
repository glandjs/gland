export interface OnModuleInit {
  onModuleInit(): Promise<void> | void;
}
export interface OnModuleDestroy {
  onModuleDestroy(): Promise<void> | void;
}

export interface OnAppBootstrap {
  onAppBootstrap(): Promise<void> | void;
}
export interface OnAppShutdown {
  onAppShutdown(signal?: string): Promise<void> | void;
}
export interface OnChannelInit {
  onChannelInit(): Promise<void> | void;
}
