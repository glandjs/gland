import { Module } from '@glandjs/common';
import type { OnAppBootstrap, OnAppShutdown, OnModuleDestroy, OnModuleInit } from '@glandjs/core';
import { CatalogChannel } from './modules/catalog/catalog.channel';
import { PricingChannel } from './modules/catalog/pricing.channel';
import { UsersModule } from './modules/users/users.channel';

/**
 * A module nested inside `CatalogModule`.
 *
 * It is named only by its parent, and reaches the graph through the import
 * chain — which is how registration stays transitive.
 */
@Module({ channels: [PricingChannel] })
class PricingModule {}

/**
 * The catalogue feature.
 *
 * Imports `PricingModule`, so the root never mentions it, and the pricing
 * channel becomes reachable as `pricing:apply`.
 */
@Module({
  imports: [PricingModule],
  channels: [CatalogChannel],
})
class CatalogModule {
  onModuleInit(): void {
    // Phase 2: every provider constructed, nothing bound yet.
    console.log('  [CatalogModule] onModuleInit');
  }

  onAppBootstrap(): void {
    // Phase 5: routes and channels bound; `create()` is about to resolve.
    console.log('  [CatalogModule] onAppBootstrap');
  }

  onModuleDestroy(): void {
    // Shutdown, after onAppShutdown.
    console.log('  [CatalogModule] onModuleDestroy');
  }
}

/**
 * The application's entry module.
 *
 * Two features, named once. Everything below them — the pricing module, both
 * channels — is registered transitively.
 */
@Module({
  imports: [CatalogModule, UsersModule],
})
export class AppModule implements OnModuleInit, OnAppShutdown {
  onModuleInit(): void {
    console.log('  [AppModule] onModuleInit');
  }

  onAppShutdown(signal?: string): void {
    console.log(`  [AppModule] onAppShutdown (${signal ?? 'no signal'})`);
  }
}
