import { GlandFactory } from '@glandjs/core';
import { AppModule } from './app.module';
import { ProductController, type DemoContext } from './modules/product/product.controller';
import type { EventTypes } from './shared/events.interface';

function section(title: string): void {
  console.log(`\n${title}\n${'-'.repeat(title.length)}`);
}

async function bootstrap(): Promise<void> {
  const { app, shutdown } = await GlandFactory.create(AppModule, { processHooks: { signals: [] } });

  // Stands in for a request an HTTP adapter would have parsed. `createContext`
  // wires the channel registry the same way the binder does.
  const request = (params: Record<string, string> = {}, body?: Record<string, unknown>): DemoContext => Object.assign(app.createContext<EventTypes>(), { params, body }) as DemoContext;

  const controller = new ProductController();

  section('POST /products');
  const created = await controller.create(request({}, { name: 'Widget', price: 9.99, stock: 3 }));
  console.log(`  created                  -> ${JSON.stringify(created)}`);

  section('GET /products');
  const { products } = await controller.list(request());
  console.log(`  listed                   -> ${products.length} product(s)`);

  section('GET /products/:id');
  const found = await controller.find(request({ id: 'p1' }));
  console.log(`  found                    -> ${JSON.stringify(found)}`);

  section('Validation and 404');
  const invalid = await controller.create(request({}, { name: 'No price' }));
  console.log(`  missing price            -> ${JSON.stringify(invalid)}`);

  const missing = await controller.find(request({ id: 'nope' }));
  console.log(`  unknown id               -> ${JSON.stringify(missing)}`);

  // The analytics channel logged "Product p1 viewed" during the `find` above —
  // reached with `emit`, so the return value was discarded.
  await shutdown();
  console.log('');
}

void bootstrap().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
