import { Module } from '@glandjs/common';
import { ProductController } from './product.controller';
import { ProductChannel } from './product.channel';
import type { OnModuleDestroy, OnModuleInit } from '@glandjs/core';
@Module({
  controllers: [ProductController],
  channels: [ProductChannel],
})
export class ProductModule implements OnModuleInit, OnModuleDestroy {
  onModuleInit(): void {
    console.log('[ProductModule] Module initialized');
  }
  onModuleDestroy(): void {
    console.log('[ProductModule] Module destroyed');
  }
}
