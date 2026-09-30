import { Context, GlandFactory } from '@glandjs/core';
import { AppModule } from './app.module';
import { ConsoleBroker, type ConsoleBrokerClass } from './console-broker';

/**
 * Boots an application and attaches the sample adapter.
 *
 * The point of this sample is what the framework *does not* contain: there is
 * no HTTP here, no router, no transport. The core published its routes, and
 * `ConsoleBroker` picked them up.
 */
async function bootstrap(): Promise<void> {
  const { app, shutdown } = await GlandFactory.create(AppModule);

  // `connectTo` takes a class, not an instance. `ConsoleBrokerClass` carries
  // the type parameters, so `console_` is inferred as `ConsoleApplication`.
  const console_ = app.connectTo(ConsoleBroker as unknown as ConsoleBrokerClass, { name: 'console' });

  // The adapter attached after bootstrap, yet it has the full route table:
  // the binder keeps a log of every route it published and replays it to a
  // late subscriber. Without that, an adapter connecting here would come up
  // empty — which is the normal order, since adapters need the application
  // handle in order to configure themselves.
  console.log('\n  Routes discovered\n');
  for (const line of console_.describe()) {
    console.log(`    ${line}`);
  }

  const greeting = console_.match('GET', '/greet/:name');
  if (greeting) {
    // A real context, wired to the application's channels the same way an HTTP
    // request would be. Only the transport-specific parts — params, method,
    // body — are missing, and this adapter has none.
    const ctx = app.createContext() as Context<any> & { params: { name: string } };
    ctx.params = { name: 'World' };

    const result = await greeting.handler(ctx);
    console.log(`\n  Invoked /greet/:name  ->  ${JSON.stringify(result)}\n`);
  }

  const stop = async (signal: string): Promise<void> => {
    await shutdown(signal);
    process.exit(0);
  };
  process.on('SIGTERM', () => void stop('SIGTERM'));
  process.on('SIGINT', () => void stop('SIGINT'));
}

void bootstrap().catch((error) => {
  // Bootstrap failures throw rather than leaving the process half-initialised.
  console.error('Failed to start:', error);
  process.exit(1);
});
