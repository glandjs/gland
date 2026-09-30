/**
 * The two ways a container can fail, and the decorator that prevents one of
 * them.
 *
 * `emitDecoratorMetadata` is only emitted for classes that carry a decorator.
 * A plain class therefore reaches the container with no knowledge of what its
 * constructor wants, and the container hands over `undefined` for every
 * parameter — silently, and only when that path is first exercised.
 */

import { Inject, Injectable, forwardRef } from '@glandjs/common';

/** An interface, which erases to `Object` at runtime. */
export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

/** A string token, for a value that is configuration rather than a class. */
export const FEATURE_FLAGS = 'featureFlags';

/** A symbol token, when a string could collide with a real package name. */
export const CLOCK = Symbol('clock');

/** A symbol token for the logger, so it cannot collide with any package name. */
export const LOGGER = Symbol('logger');

/**
 * The right way: a decorated class the container can read.
 *
 * The decorator carries no logic. Its presence is the declaration that this
 * class wants its constructor resolved, and that declaration is what makes the
 * compiler emit `design:paramtypes`.
 */
@Injectable()
export class UserService {
  constructor(
    // Both parameters need @Inject. `Logger` is an interface, so it erases to
    // `Object`; `Record<string, boolean>` is an index signature, which erases
    // the same way. Without the tokens the container would hand over a bare
    // `{}` and the failure would surface as `this.logger.info is not a
    // function` — far from the cause.
    @Inject(LOGGER) private readonly logger: Logger,
    @Inject(FEATURE_FLAGS) private readonly flags: Record<string, boolean>,
  ) {}

  greet(name: string): string {
    if (!this.flags.greetings) return '';

    this.logger.info(`Greeting ${name}`);
    const prefix = this.flags.formal ? 'Good day' : 'Hello';
    return `${prefix}, ${name}.`;
  }
}

/**
 * Also fine: a plain class with no constructor parameters.
 *
 * Nothing to resolve, so nothing to declare. A leaf dependency.
 */
export class SystemClock {
  now(): number {
    return Date.now();
  }
}

/**
 * An interface parameter needs `@Inject`, because its type is gone at runtime.
 *
 * Without it the container would build a bare `{}` and hand that over, and the
 * failure would surface as `this.logger.info is not a function` — far from the
 * real cause.
 */
@Injectable()
export class ReportService {
  constructor(
    @Inject(CLOCK) private readonly clock: SystemClock,
    @Inject(FEATURE_FLAGS) private readonly flags: Record<string, boolean>,
  ) {}

  shouldPublish(): boolean {
    return this.flags.reports === true;
  }

  stamp(): string {
    return new Date(this.clock.now()).toISOString();
  }
}

/**
 * `forwardRef` defers a *token lookup*, which solves one specific problem: a
 * decorator argument is evaluated when the class is defined, so referencing a
 * class declared further down the file hits the temporal dead zone.
 */
@Injectable()
export class Cache {
  private readonly entries = new Map<string, unknown>();

  constructor(@Inject(forwardRef(() => UserService)) private readonly users: UserService) {}

  get(key: string): unknown {
    return this.entries.get(key);
  }

  set(key: string, value: unknown): void {
    this.entries.set(key, value);
  }
}

/**
 * What happens without the decorator.
 *
 * `design:paramtypes` is never written for an undecorated class, so the
 * container has nothing to go on. It refuses rather than constructing the
 * class with a row of `undefined`s.
 *
 * ```ts
 * // Remove @Injectable() from UserService and resolve it:
 * //
 * // UnresolvableDependencyError: Cannot resolve constructor parameter #0 of
 * // "UserService".
 * //   The constructor takes arguments but no "design:paramtypes" metadata was
 * //   emitted for it.
 * //   TypeScript only emits that metadata for decorated classes: add
 * //   @Injectable() …
 * // ```
 */
export class Undecorated {
  constructor(readonly dependency: unknown) {}
}
