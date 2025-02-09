import { Module } from '@gland/common';
import { ConfigService } from './config-service';
/**
 * ConfigModule provides configuration management across the application.
 */
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
