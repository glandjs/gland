import { GlandFactory } from '@glandjs/core';
import { AppModule } from './app.module';
import { ExpressBroker } from '@glandjs/express';

async function bootstrap() {
  const app = await GlandFactory.create(AppModule);
  const express = app.connectTo(ExpressBroker);
  express.listen(3000);
}
void bootstrap();
