import { Injectable } from '@glandjs/common';
import type { OnModuleInit } from '@glandjs/core';

export interface Greeting {
  text: string;
  shouted: boolean;
}

/**
 * A service the container can build on its own.
 *
 * `@Injectable()` is not decoration here. TypeScript only writes
 * `design:paramtypes` for decorated classes, so without the decorator a
 * constructor's parameters reach the container as `undefined` — silently, and
 * only at the moment the service is first resolved.
 */
@Injectable()
export class Greeter implements OnModuleInit {
  onModuleInit(): void {
    console.log('[Greeter] Ready');
  }

  greet(name: string): Greeting {
    return { text: `Hello, ${name}.`, shouted: false };
  }
}

/**
 * A second service, shown to make a point about scope.
 *
 * Everything the container builds is a singleton: two modules asking for the
 * same class get the same instance, because there is one instance map and one
 * rule for filling it. There is no request scope, because the DI layer has no
 * notion of a request.
 */
@Injectable()
export class TimeService {
  readonly startedAt = Date.now();

  elapsedMs(): number {
    return Date.now() - this.startedAt;
  }
}
