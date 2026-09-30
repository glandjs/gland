import { expect } from 'chai';
import { Logger } from '@medishn/toolkit';
import { Channel, Injectable, Module as GlandModule, On } from '@glandjs/common';
import { ApplicationLifecycle, Container, LifecycleScanner, ProcessHooks } from '@glandjs/core';

describe('core/hooks/LifecycleScanner', () => {
  /** Registers a throwaway graph and returns its module container. */
  async function containerFor(controllers: any[] = [], channels: any[] = [], moduleClass?: any) {
    @GlandModule({ controllers, channels })
    class Root {}
    const container = new Container();
    await container.register(moduleClass ?? Root);
    return container.moduleContainer;
  }

  it('discovers providers implementing any hook', async () => {
    class WithInit {
      onModuleInit() {}
    }
    class Plain {}

    const scanner = new LifecycleScanner(await containerFor([WithInit, Plain]));
    scanner.scanForHooks();

    // A provider with no hook is not tracked at all.
    expect(scanner['participants'].get('Root')?.size).to.equal(1);
  });

  it('runs onModuleInit on the module instance built by the container', async () => {
    const calls: string[] = [];

    @GlandModule({})
    class Root {
      readonly tag = 'from-container';
      onModuleInit() {
        calls.push(this.tag);
      }
    }

    const scanner = new LifecycleScanner(await containerFor([], [], Root));
    scanner.scanForHooks();
    await scanner.onModuleInit();

    // Previously the scanner called `new module.metatype()` and the hook ran
    // against a throwaway object with no injected dependencies.
    expect(calls).to.deep.equal(['from-container']);
  });

  it('awaits asynchronous hooks before continuing', async () => {
    const order: string[] = [];

    class Slow {
      async onModuleInit() {
        await new Promise((r) => setTimeout(r, 10));
        order.push('slow');
      }
    }
    @GlandModule({ controllers: [Slow] })
    class Root {}

    const scanner = new LifecycleScanner(await containerFor([Slow], [], Root));
    scanner.scanForHooks();
    await scanner.onModuleInit();

    expect(order).to.deep.equal(['slow']);
  });

  it('logs and skips a hook that throws, without aborting the phase', async () => {
    const ran: string[] = [];

    class Boom {
      onModuleInit() {
        throw new Error('boom');
      }
    }
    class Fine {
      onModuleInit() {
        ran.push('fine');
      }
    }

    const scanner = new LifecycleScanner(await containerFor([Boom, Fine]));
    scanner.scanForHooks();
    await scanner.onModuleInit();

    expect(ran).to.deep.equal(['fine']);
  });

  it('survives a rejected async hook', async () => {
    const ran: string[] = [];

    class Rejects {
      async onModuleInit() {
        throw new Error('async boom');
      }
    }
    class Fine {
      onModuleInit() {
        ran.push('fine');
      }
    }

    const scanner = new LifecycleScanner(await containerFor([Rejects, Fine]));
    scanner.scanForHooks();
    await scanner.onModuleInit();

    expect(ran).to.deep.equal(['fine']);
  });

  it('forwards the shutdown signal to onAppShutdown', async () => {
    const seen: Array<string | undefined> = [];

    class Closer {
      onAppShutdown(signal?: string) {
        seen.push(signal);
      }
    }

    const scanner = new LifecycleScanner(await containerFor([Closer]));
    scanner.scanForHooks();
    await scanner.onAppShutdown('SIGTERM');

    expect(seen).to.deep.equal(['SIGTERM']);
  });

  it('is idempotent when scanned twice', async () => {
    class P {
      onModuleInit() {}
    }
    const scanner = new LifecycleScanner(await containerFor([P]));

    scanner.scanForHooks();
    const first = scanner['participants'].get('Root')?.size;
    scanner.scanForHooks();

    expect(scanner['participants'].get('Root')?.size).to.equal(first);
  });

  it('finds hooks on channels as well as controllers', async () => {
    const seen: string[] = [];

    @Channel('db')
    class Database {
      onChannelInit() {
        seen.push('channel');
      }
      @On('ping')
      ping() {
        return 'pong';
      }
    }

    const scanner = new LifecycleScanner(await containerFor([], [Database]));
    scanner.scanForHooks();
    await scanner.onChannelInit();

    expect(seen).to.deep.equal(['channel']);
  });

  it('does not invoke a hook the provider does not implement', async () => {
    class OnlyInit {
      onModuleInit() {}
    }
    const scanner = new LifecycleScanner(await containerFor([OnlyInit]));
    scanner.scanForHooks();

    // Would throw if the scanner called a missing method.
    await scanner.onAppBootstrap();
    await scanner.onChannelInit();
  });
});

describe('core/hooks/ProcessHooks', () => {
  it('registers signal handlers and removes them again', () => {
    const before = process.listenerCount('SIGTERM');
    const hooks = new ProcessHooks(undefined, { signals: ['SIGTERM'] });

    hooks.install(() => {});
    expect(process.listenerCount('SIGTERM')).to.equal(before + 1);

    hooks.dispose();
    expect(process.listenerCount('SIGTERM')).to.equal(before);
  });

  it('does not register the same handler twice', () => {
    const hooks = new ProcessHooks(undefined, { signals: ['SIGINT'] });
    const before = process.listenerCount('SIGINT');

    hooks.install(() => {});
    hooks.install(() => {});
    expect(process.listenerCount('SIGINT')).to.equal(before + 1);

    hooks.dispose();
  });

  it('reports errors without terminating the process', () => {
    const hooks = new ProcessHooks(undefined, { reportErrors: true });
    const beforeRejection = process.listenerCount('unhandledRejection');
    const beforeException = process.listenerCount('uncaughtException');

    hooks.install(() => {});

    // The old handler called process.exit(1) on any rejection, so a stray
    // promise anywhere in an application killed the server.
    expect(process.listenerCount('unhandledRejection')).to.equal(beforeRejection + 1);
    expect(process.listenerCount('uncaughtException')).to.equal(beforeException + 1);

    hooks.dispose();
  });

  it('can skip error reporting entirely', () => {
    const hooks = new ProcessHooks(undefined, { reportErrors: false });
    const before = process.listenerCount('unhandledRejection');

    hooks.install(() => {});
    expect(process.listenerCount('unhandledRejection')).to.equal(before);

    hooks.dispose();
  });

  it('disposing twice is safe', () => {
    const hooks = new ProcessHooks(undefined, { signals: ['SIGHUP'] });
    hooks.install(() => {});
    hooks.dispose();
    expect(() => hooks.dispose()).not.to.throw();
  });
});

describe('core/application/ApplicationLifecycle', () => {
  /** Builds a lifecycle over a fresh container, with process hooks disabled. */
  async function lifecycleFor(controllers: any[] = [], channels: any[] = []) {
    @Injectable()
    class Noop {}
    @GlandModule({ controllers: [...controllers, Noop] })
    class Root {}

    const container = new Container();
    await container.register(Root);

    return new ApplicationLifecycle(container.moduleContainer, undefined, { signals: [] });
  }

  it('runs phases in order', async () => {
    const order: string[] = [];

    class Tracked {
      onModuleInit() {
        order.push('init');
      }
      onChannelInit() {
        order.push('channelInit');
      }
      onAppBootstrap() {
        order.push('bootstrap');
      }
      onAppShutdown() {
        order.push('shutdown');
      }
      onModuleDestroy() {
        order.push('destroy');
      }
    }

    const lifecycle = await lifecycleFor([Tracked]);
    await lifecycle.init();
    await lifecycle.initChannels();
    await lifecycle.bootstrap();
    await lifecycle.shutdown();

    expect(order).to.deep.equal(['init', 'channelInit', 'bootstrap', 'shutdown', 'destroy']);
  });

  it('runs bootstrap only once', async () => {
    let count = 0;
    class Once {
      onAppBootstrap() {
        count++;
      }
    }

    const lifecycle = await lifecycleFor([Once]);
    await lifecycle.init();
    await lifecycle.bootstrap();
    await lifecycle.bootstrap();

    expect(count).to.equal(1);
  });

  it('runs shutdown only once', async () => {
    let count = 0;
    class Once {
      onAppShutdown() {
        count++;
      }
    }

    const lifecycle = await lifecycleFor([Once]);
    await lifecycle.init();
    await lifecycle.shutdown('SIGTERM');
    await lifecycle.shutdown('SIGINT');

    expect(count).to.equal(1);
  });

  it('does not rethrow from shutdown', async () => {
    class Explodes {
      async onAppShutdown() {
        throw new Error('shutdown failed');
      }
    }

    const lifecycle = await lifecycleFor([Explodes]);
    await lifecycle.init();

    // Shutdown runs on a signal path, where an escaping error would skip the
    // remaining hooks.
    await expect(lifecycle.shutdown()).to.eventually.be.undefined;
  });

  it('installs no process handlers without a logger', async () => {
    // Reporting errors needs a destination; with no logger there is nowhere
    // to report, so no handler is installed.
    const before = process.listenerCount('unhandledRejection');

    const lifecycle = await lifecycleFor();
    await lifecycle.init();
    await lifecycle.shutdown();

    expect(process.listenerCount('unhandledRejection')).to.equal(before);
  });

  it('registers signal handlers only when a logger is supplied', async () => {
    const before = process.listenerCount('SIGTERM');
    const container = new Container();
    await container.register(class Root {});

    const lifecycle = new ApplicationLifecycle(container.moduleContainer, new Logger({ context: 'test' }), { signals: ['SIGTERM'] });
    expect(process.listenerCount('SIGTERM')).to.equal(before + 1);

    // dispose happens on shutdown, so the handler does not outlive the test.
    await lifecycle.shutdown();
    expect(process.listenerCount('SIGTERM')).to.equal(before);
  });
});
