import { Controller } from '@glandjs/common';
import { GlandFactory } from '@glandjs/core';
import { AppModule, type AppEvents } from './app.module';
import { OrderController, type DemoContext } from './modules/orders/order.controller';

function section(title: string): void {
  console.log(`\n${title}\n${'-'.repeat(title.length)}`);
}

async function bootstrap(): Promise<void> {
  const { app, shutdown } = await GlandFactory.create(AppModule, { processHooks: { signals: [] } });

  /**
   * Stands in for the request an HTTP adapter would have parsed.
   *
   * `createContext` wires the channel registry exactly as the binder does for a
   * real request; only the transport-specific parts are added here.
   */
  const request = (params: Record<string, string> = {}, body?: Record<string, unknown>): DemoContext => Object.assign(app.createContext<AppEvents>(), { params, body }) as DemoContext;

  const controller = new OrderController();

  section('POST /orders');
  // The controller calls `orders:place`, then emits to `audit:record`. Two
  // channels that have not heard of each other.
  const placed = await controller.place(
    request(
      {},
      {
        customer: 'Ada Lovelace',
        items: [{ sku: 'KBD-01', quantity: 1, unitPrice: 140 }],
      },
    ),
  );
  console.log(`  order placed            -> ${placed.order.id} for ${placed.order.customer}`);

  section('GET /orders/:id/price');
  const result = await controller.price(request({ id: placed.order.id }));
  if ('priced' in result) {
    console.log(`  subtotal ${result.priced.subtotal}  discount ${result.priced.discount}  total ${result.priced.total}`);
    console.log(`  over the threshold?     -> ${result.priced.discounted}`);
  }

  section('Two channels, one controller');
  const ok = await controller.reserve(request({ sku: 'KBD-01' }, { quantity: 1 }));
  console.log(`  reserve 1x KBD-01       -> ${ok.reserved}`);

  const tooMany = await controller.reserve(request({ sku: 'MON-27' }, { quantity: 99 }));
  console.log(`  reserve 99x MON-27      -> ${tooMany.reserved} (${tooMany.reason})`);

  // A second call proves the reservation actually moved the stock, rather than
  // the handler simply reporting success.
  const after = await app.createContext<AppEvents>().call('inventory:check', 'MON-27');
  console.log(`  MON-27 after the failure-> ${after.available} left`);

  section('What the audit channel saw');
  // No order code references the audit module, yet every action landed here.
  const entries = await app.createContext<AppEvents>().call('audit:entries', undefined as never);
  for (const entry of entries) {
    console.log(`  ${entry.action.padEnd(14)} ${entry.detail}`);
  }

  section('The cost of names in strings');
  // A typo is a runtime error rather than a compile error. In exchange, the
  // audit module could be deleted without touching a line of the order code.
  try {
    await app.createContext<AppEvents>().call('audit:recd' as 'audit:entries', undefined as never);
  } catch (error) {
    console.log(`  ${(error as Error).message.split('\n')[0]}`);
    const valid = Object.keys(app.createContext<AppEvents>().state.channel ?? {});
    console.log(`  valid: ${valid.slice(0, 3).join(', ')}… (${valid.length} total)`);
  }

  await shutdown();
  console.log('');
}

void bootstrap().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
