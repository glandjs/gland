import { Channel, Controller, Module, On } from '@glandjs/common';
import type { Context } from '@glandjs/core';

/**
 * Stands in for `@Get()` from `@glandjs/http`, which this sample avoids
 * depending on. The decorator writes the same two metadata keys the HTTP
 * package does, which is all the explorer reads.
 */
function Get(path = '/'): MethodDecorator {
  return (target: object, key: string | symbol) => {
    // The metadata key is defined on the method *function*, not the prototype.
    // That is the same contract `@glandjs/http` uses, and the explorer reads
    // nothing else.
    const method = (target as Record<string, (...args: unknown[]) => unknown>)[key as string];
    Reflect.defineMetadata('path', path, method);
    Reflect.defineMetadata('method', 'GET', method);
  };
}

@Channel('greeter')
class GreeterChannel {
  @On('greet')
  greet(payload: { name: string }): { text: string; shouted: boolean } {
    return { text: `Hello, ${payload.name}.`, shouted: false };
  }
}

@Controller('greet')
class GreetController {
  @Get(':name')
  async greet(ctx: Context<any> & { params: { name: string } }) {
    // `params` is adapter-level: a real HTTP context exposes it, and the
    // framework's own `Context` does not, because it knows nothing about
    // routing. Intersecting the type here is what an app does to name it.
    return ctx.call('greeter:greet', { name: ctx.params.name });
  }
}

@Module({ controllers: [GreetController], channels: [GreeterChannel] })
class AppModule {}

export { AppModule, Get };
