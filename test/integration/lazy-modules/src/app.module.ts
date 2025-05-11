import { Module } from '@glandjs/common';
import { GlobalModule } from './global.module';

@Module({
  imports: [GlobalModule],
})
export class AppModule {}
