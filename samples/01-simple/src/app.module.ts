import { Module } from '@glandjs/common';
import { ProductModule } from './modules/product/product.module';
import { Database } from './common/db.channel';
import type { OnAppBootstrap, OnAppShutdown, OnModuleDestroy, OnModuleInit } from '@glandjs/core/hooks';

@Module({
  imports: [ProductModule],
  channels: [Database],
})
export class AppModule implements OnModuleInit, OnModuleDestroy, OnAppBootstrap, OnAppShutdown {
  onModuleInit(): void {
    console.log('[AppModule] Module initialized');
  }

  onAppBootstrap(): void {
    console.log('[AppModule] Application has bootstrapped');
  }

  onAppShutdown(signal?: string): void {
    console.log(`[AppModule] Application is shutting down due to signal: ${signal}`);
  }

  onModuleDestroy(): void {
    console.log('[AppModule] Module is being destroyed');
  }
}
