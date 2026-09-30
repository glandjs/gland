import { Inject, Injectable } from '@glandjs/common';
import { CircularDependencyError, Container, UnresolvableDependencyError } from '@glandjs/core';
import { AppModule } from './app.module';
import { Cache, ReportService, SystemClock, Undecorated, UserService, CLOCK, FEATURE_FLAGS, LOGGER } from './providers/services';

/** Prints a heading, so the output reads as a sequence of demonstrations. */
function section(title: string): void {
  console.log(`\n${title}\n${'-'.repeat(title.length)}`);
}

/** A minimal implementation of the `Logger` interface, bound by token. */
const logger = {
  info: (message: string) => console.log(`    [log] ${message}`),
  error: (message: string) => console.error(`    [log] ${message}`),
};

async function bootstrap(): Promise<void> {
  const container = new Container();
  await container.register(AppModule);

  // Three values the container cannot build: a clock, a configuration object,
  // and a third-party interface implementation. `bind` is the public form of
  // putting a value in the instance map.
  container.bind(CLOCK, new SystemClock());
  container.bind(FEATURE_FLAGS, { greetings: true, formal: true, reports: true });
  container.bind(LOGGER, logger);

  section('1. A decorated provider, built by type');
  // `UserService` declares two parameters the container cannot infer from a
  // class: a logger interface and a config string. Both need @Inject.
  const users = container.resolve(UserService);
  console.log(`  greet('Ada')            -> "${users.greet('Ada')}"`);

  section('2. Singletons');
  // Resolved twice, same instance. One map, one rule for filling it.
  console.log(`  same instance?          -> ${users === container.resolve(UserService)}`);

  section('3. A provider behind a symbol token');
  const reports = container.resolve(ReportService);
  console.log(`  shouldPublish()         -> ${reports.shouldPublish()}`);
  console.log(`  stamp()                 -> ${reports.stamp()}`);

  section('4. forwardRef');
  // The decorator argument names a class declared later in its own file; the
  // thunk defers the lookup until the container resolves the parameter.
  const cache = container.resolve(Cache);
  cache.set('greeting', 'cached value');
  console.log(`  cache.get('greeting')   -> "${cache.get('greeting')}"`);

  section('5. Failure: no decorator, so no metadata');
  try {
    container.resolve(Undecorated);
  } catch (error) {
    console.log(`  ${(error as Error).name}`);
    console.log(
      `  ${String((error as Error).message)
        .split('\n')
        .slice(0, 2)
        .join('\n  ')}`,
    );
  }

  section('6. Failure: a token that was never bound');
  // A string token no provider claims. The container says so, rather than
  // handing over `undefined` and failing further away.
  @Injectable()
  class MissingLogger {
    constructor(@Inject('neverBound') readonly logger: unknown) {}
  }
  try {
    container.resolve(MissingLogger);
  } catch (error) {
    console.log(`  ${(error as Error).name}`);
    console.log(`  ${(error as Error).message.split('\n')[0]}`);
  }

  section('7. Failure: a cycle');
  // Both classes want the other's *instance*, so no lookup order satisfies
  // them. A third provider holding the shared state is the way out.
  const Left: any = class Left {
    constructor(readonly right: unknown) {}
  };
  const Right: any = class Right {
    constructor(readonly left: unknown) {}
  };
  Reflect.defineMetadata('design:paramtypes', [Right], Left);
  Reflect.defineMetadata('design:paramtypes', [Left], Right);
  try {
    container.resolve(Left);
  } catch (error) {
    console.log(`  ${(error as Error).name}`);
    console.log(
      `  ${String((error as Error).message)
        .split('\n')
        .slice(0, 3)
        .join('\n  ')}`,
    );
  }

  console.log(`\n  Error types:            ${[CircularDependencyError.name, UnresolvableDependencyError.name].join(', ')}`);
  console.log('  Recovery:               extract the shared state, or inject a factory\n');
}

void bootstrap().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
