import { Module } from '@glandjs/common';
import type { OnAppBootstrap, OnModuleDestroy, OnModuleInit } from '@glandjs/core';
import { AnalyticsChannel } from './analytics.channel';
import { ProductController } from './product.controller';

/**
 * The product feature: its routes and its event handlers.
 *
 * Everything under `imports` is registered transitively, so the root module
 * only needs to name this one.
 */
@Module({
  controllers: [ProductController],
  channels: [AnalyticsChannel],
})
export class ProductModule implements OnModuleInit, OnModuleDestroy, OnAppBootstrap {
  onModuleInit(): void {
    console.log('[ProductModule] Initialized');
  }

  onAppBootstrap(): void {
    console.log('[ProductModule] Application bootstrapped');
  }

  onModuleDestroy(): void {
    console.log('[ProductModule] Destroyed');
  }
}
