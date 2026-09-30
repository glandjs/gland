import { GlandFactory } from '@glandjs/core';
import { ExpressBroker } from '@glandjs/express';
import { AppModule } from './app.module';

/**
 * Boots the sample application.
 *
 * `GlandFactory.create()` resolves only after binding completes, so `listen()`
 * on the next line cannot race route registration.
 */
async function bootstrap(): Promise<void> {
  const { app, shutdown } = await GlandFactory.create(AppModule);

  const express = app.connectTo(ExpressBroker);
  express.json();
  express.urlencoded({ extended: true });
  express.listen(3000);

  // Release application state, then the transport, then exit. Doing it in this
  // order means in-flight requests still have a live server to respond on.
  const stop = async (signal: string): Promise<void> => {
    console.log(`\nReceived ${signal}, shutting down…`);
    try {
      await shutdown(signal);
      await express.close();
      process.exit(0);
    } catch (error) {
      console.error('Shutdown failed:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('SIGINT', () => void stop('SIGINT'));
}

void bootstrap().catch((error) => {
  // A bootstrap failure throws rather than leaving the process half-initialised.
  console.error('Failed to start:', error);
  process.exit(1);
});
