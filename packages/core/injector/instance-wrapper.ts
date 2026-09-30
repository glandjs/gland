/**
 * Pairs an injection token with the instance built for it.
 *
 * The wrapper exists so the container can hold a provider that has *not* been
 * instantiated yet without confusing "not ready" with "not a provider" — which
 * is what a plain `instance | undefined` field cannot express.
 *
 * @typeParam T - the instance type produced by {@link InstanceWrapper.token}
 */
export class InstanceWrapper<T = any> {
  constructor(
    /** The token this instance was registered under. */
    public readonly token: Function | string | symbol,
    private readonly instance?: T,
  ) {}

  /**
   * Human-readable identifier, used in logs and error messages.
   *
   * For a string or symbol token this is the token itself; for a class it is
   * the class name.
   */
  get id(): string {
    if (typeof this.token === 'string') return this.token;
    if (typeof this.token === 'symbol') return this.token.description ?? this.token.toString();
    return this.token.name || 'anonymous';
  }

  /** Whether an instance has been built for this token. */
  get isResolved(): boolean {
    return this.instance !== undefined;
  }

  /**
   * Returns the built instance.
   *
   * Checks explicitly against `undefined` rather than testing truthiness, so a
   * legitimately falsy instance is not misreported as missing.
   *
   * @throws if the provider has not been instantiated yet
   */
  getInstance(): T {
    if (this.instance === undefined) {
      throw new Error(`Provider "${this.id}" has not been instantiated. It is registered but never resolved.`);
    }
    return this.instance;
  }

  /** Returns the built instance, or `undefined` when not yet resolved. */
  tryGetInstance(): T | undefined {
    return this.instance;
  }
}
