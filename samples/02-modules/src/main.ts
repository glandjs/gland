import type { IOEvent } from '@glandjs/events';
import { GlandFactory } from '@glandjs/core';
import { AppModule } from './app.module';
import type { CatalogItem } from './modules/catalog/catalog.channel';
import type { PricedItem } from './modules/catalog/pricing.channel';
import type { User } from './modules/users/users.channel';

/**
 * The events this application declares.
 *
 * `IOEvent<Payload, Return>` is what makes `ctx.call` check both directions:
 * the payload you pass and the value you get back.
 */
interface AppEvents {
  'catalog:list': IOEvent<Record<string, never>, CatalogItem[]>;
  'catalog:find': IOEvent<string, CatalogItem | null>;
  'pricing:apply': IOEvent<CatalogItem, PricedItem>;
  'users:find': IOEvent<string, User | null>;
  'users:count': IOEvent<Record<string, never>, number>;
}

function section(title: string): void {
  console.log(`\n${title}\n${'-'.repeat(title.length)}`);
}

async function bootstrap(): Promise<void> {
  section('Bootstrap, in order');
  // The console output below interleaves with the lifecycle hooks, which is
  // the point: the order is the contract, not an implementation detail.
  const { app, shutdown } = await GlandFactory.create(AppModule, {
    processHooks: { signals: [] },
  });

  // `create()` resolves only after phase 5, so a context can call channels the
  // moment it returns. `createContext` wires the channel registry, which is
  // what `ctx.call` resolves names against — the same wiring the binder does
  // for an HTTP request, minus the transport.
  const ctx = app.createContext<AppEvents>();

  section('Transitive registration');
  // `pricing:apply` is reachable even though nothing above names PricingModule;
  // `CatalogModule` imported it. Both payloads and return values are checked,
  // because the context is typed with the application's event map.
  const item = await ctx.call('catalog:find', 'KBD-01');
  console.log(`  catalog:find('KBD-01')  -> ${JSON.stringify(item)}`);

  const priced = await ctx.call('pricing:apply', item as CatalogItem);
  console.log(`  pricing:apply(item)     -> finalPrice ${priced.finalPrice}`);

  section('Two namespaces, one suffix');
  // `catalog:find` and `users:find` share the suffix "find" and stay distinct,
  // because the namespace is part of the name. An earlier implementation
  // compared only the text after the first colon, and these two were
  // indistinguishable.
  const user = await ctx.call('users:find', 'u1');
  console.log(`  users:find('u1')        -> ${JSON.stringify(user)}`);

  section('An unknown event');
  // Throws, and lists what does exist. A misspelled name is a bug, and saying
  // so at the call site beats discovering it as a mysterious `undefined`.
  try {
    // The cast is only needed because the name is deliberately wrong; the
    // point of the event map is that a correct name needs none.
    await ctx.call('catalog:fin' as 'catalog:find', 'KBD-01');
  } catch (error) {
    console.log(`  ${(error as Error).name}: ${(error as Error).message.split('\n')[0]}`);
    console.log(`  listed: ${Object.keys(ctx.state.channel ?? {}).join(', ')}`);
  }

  await shutdown('SIGTERM');
  console.log('');
}

void bootstrap().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
