import { Module } from '@glandjs/common';
import type { OnModuleInit } from '@glandjs/core';
import { Database } from './db.channel';

/** The data layer: every `db:*` event handler lives here. */
@Module({ channels: [Database] })
export class DataModule implements OnModuleInit {
  onModuleInit(): void {
    console.log('[DataModule] Initialized');
  }
}
