import { METHOD_METADATA, PATH_METADATA } from '@glandjs/common';
import type { Constructor, Logger } from '@medishn/toolkit';
import type { ModulesContainer } from './container';
import { InstanceWrapper } from './instance-wrapper';
import { MetadataScanner } from './scanner';

/**
 * One HTTP route, resolved from a controller method.
 *
 * @typeParam T - the controller instance type
 */
export interface RouteMetadata<T = any> {
  /** Upper-case HTTP method from the `@Get()`/`@Post()`/… decorator. */
  method: string;
  /** Handler's own path, relative to the controller prefix (e.g. `':id'`). */
  route: string;
  controller: {
    /** Base prefix declared with `@Controller(...)`. */
    path: string;
    /** The singleton controller instance. */
    instance: T;
    /** Name of the handler method. */
    methodName: string;
    /** The unbound handler function. */
    target: Function;
  };
}

/**
 * One channel handler, resolved from a channel method.
 *
 * @typeParam T - the channel instance type
 */
export interface ChannelMetadata<T = any> {
  /** The singleton channel instance. */
  instance: T;
  /** The channel class. */
  token: Constructor<T>;
  /** Event name declared with `@On(...)`. */
  event: string;
  /** Namespace declared with `@Channel(...)`; `''` when none was given. */
  namespace: string;
  /** The unbound handler function. */
  target: Function;
}

/**
 * Walks every registered module and turns decorator metadata into concrete
 * route and channel descriptors.
 *
 * Discovery is metadata-driven only: nothing is inferred from naming
 * conventions, so a method is a route exactly when it carries a
 * `@Get()`-style decorator and nothing else.
 */
export class Explorer {
  private readonly metadataScanner = new MetadataScanner();
  private readonly logger?: Logger;

  constructor(
    private readonly modulesContainer: ModulesContainer,
    logger?: Logger,
  ) {
    this.logger = logger?.child('Explorer');
  }

  /**
   * Finds every route across every registered controller.
   *
   * Controllers are visited in module-registration order, and methods in
   * declaration order, so route binding is deterministic across runs.
   *
   * @returns one descriptor per decorated controller method
   */
  public exploreControllers<T extends object = any>(): RouteMetadata<T>[] {
    this.logger?.debug('Exploring controllers...');
    const result: RouteMetadata<T>[] = [];

    for (const [, moduleRef] of this.modulesContainer.entries()) {
      for (const [, wrapper] of moduleRef.controllers.entries()) {
        this.collectRoutes(wrapper, result);
      }
    }

    this.logger?.debug(`Found ${result.length} route(s)`);
    this.logger?.debug('- Done.');
    return result;
  }

  /**
   * Finds every channel handler across every registered channel.
   *
   * @returns one descriptor per method decorated with `@On(...)`
   */
  public exploreChannels<T extends object = any>(): ChannelMetadata<T>[] {
    this.logger?.debug('Exploring channels...');
    const result: ChannelMetadata<T>[] = [];

    for (const [, moduleRef] of this.modulesContainer.entries()) {
      for (const [, wrapper] of moduleRef.channels.entries()) {
        this.collectChannels(wrapper, result);
      }
    }

    this.logger?.debug(`Found ${result.length} channel handler(s)`);
    this.logger?.debug('- Done.');
    return result;
  }

  /** Extracts the routes declared by one controller class. */
  private collectRoutes<T>(wrapper: InstanceWrapper, result: RouteMetadata<T>[]): void {
    const instance = wrapper.getInstance();
    const controllerType = wrapper.token as Constructor;
    const prototype = Object.getPrototypeOf(instance);
    const controllerPath = Reflect.getMetadata(PATH_METADATA, controllerType) ?? '/';

    this.metadataScanner.scanFromPrototype(prototype, (methodName) => {
      const target = prototype[methodName];
      const method = Reflect.getMetadata(METHOD_METADATA, target);
      if (!method) return;

      const route = Reflect.getMetadata(PATH_METADATA, target) ?? '/';
      this.logger?.debug(`  ${String(method).toUpperCase()} ${controllerPath}${route} -> ${methodName}`);

      result.push({
        method: String(method),
        route,
        controller: { instance, target, methodName, path: controllerPath },
      });
    });
  }

  /** Extracts the handlers declared by one channel class. */
  private collectChannels<T>(wrapper: InstanceWrapper, result: ChannelMetadata<T>[]): void {
    const instance = wrapper.getInstance();
    const channelType = wrapper.token as Constructor;
    const prototype = Object.getPrototypeOf(instance);
    const namespace = Reflect.getMetadata(PATH_METADATA, channelType) ?? '';

    this.metadataScanner.scanFromPrototype(prototype, (methodName) => {
      const event = Reflect.getMetadata(METHOD_METADATA, prototype, methodName);
      if (!event) return;

      this.logger?.debug(`  ${namespace ? `${namespace}:` : ''}${event} -> ${methodName}`);
      result.push({
        instance,
        token: channelType,
        event,
        namespace,
        target: prototype[methodName],
      });
    });
  }
}
