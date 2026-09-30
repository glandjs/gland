import { Module } from '@glandjs/common';
import type { OnAppShutdown, OnModuleInit } from '@glandjs/core';
import { DataModule } from './common/data.module';
import { ProductModule } from './modules/product/product.module';

/**
 * The application's entry module.
 *
 * The only module named at the root; `ProductModule` and `DataModule` are
 * registered transitively, and the controllers and channels beneath them are
 * discovered from decorator metadata.
 */
@Module({
  imports: [DataModule, ProductModule],
})
export class AppModule implements OnModuleInit, OnAppShutdown {
  onModuleInit(): void {
    console.log('  [AppModule] Initialized');
  }

  onAppShutdown(signal?: string): void {
    console.log(`  [AppModule] Shutting down (${signal ?? 'no signal'})`);
  }
}
