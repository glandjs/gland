import { GlandFactory } from '@glandjs/core';
import { AppModule } from './app.module';
import { ExpressBroker } from '@glandjs/express';
import type { EventTypes } from './shared/events.interface';
async function bootstrap() {
  const app = await GlandFactory.create(AppModule);
  const express = app.connectTo(ExpressBroker<EventTypes>);
  express.json();
  express.urlencoded({ extended: true });
  express.listen(3000);
}
void bootstrap();
