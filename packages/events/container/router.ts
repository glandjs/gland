import { Logger, type Callback } from '@medishn/toolkit';
import type { EventQueue } from '../queue';
import { Tree } from '@gland/common';
import { QueueUtils } from './queue-utils';
import { Flags, NodeType, type UniversalNode } from '@gland/common/tree/node';
export type QueeuType = Map<string, EventQueue>;
export class EventRouter {
  private readonly _queues: QueeuType = new Map();

  private readonly _queueUtils: QueueUtils;
  private readonly logger = new Logger({
    context: 'Gland:Events',
  });

  private _tree = new Tree<any>('event');

  constructor() {
    this._queueUtils = new QueueUtils(this._queues);
  }
  public on(event: string, listener: Callback): void {
    const existing = this._tree.match(event).value || [];
    this._tree.insert(event, [...existing, listener]);

    queueMicrotask(() => {
      const events = this.getEventsByPrefix(event.split('*')[0]);
      for (const event of events) {
        const queue = this._queues.get(event);
        if (queue) {
          this.logger.info(`Processing queued events for pattern "${event}" matching "${event}"`);
          queue.process(async (event) => {
            this.emit(event);
          });
          this._queues.delete(event);
        }
      }
    });
  }

  public once(event: string, listener: Callback): void {
    const wrappedListener = (...args: any[]) => {
      this.off(event, wrappedListener);
      listener(...args);
    };
    this._tree.insert(event, wrappedListener);
  }

  public off(event: string, listener?: Callback): void {
    const result = this._tree.match(event);
    if (!result.value) return;

    const listeners = result.value;
    const newListeners = listener ? listeners.filter((l) => l !== listener) : [];

    if (newListeners.length > 0) {
      this._tree.insert(event, newListeners);
    } else {
      this._tree.remove(event);
    }
    if (!this.hasListeners(event)) {
      this._queueUtils.cleanup(event);
    }
  }

  public emit(event: string, ...args: any[]): void {
    const { value: listeners, params } = this._tree.match(event);

    if (!listeners || listeners.length === 0) {
      this._queueUtils.queueEvent(event);
      this.logger.warn(`No listeners for "${event}", event queued.`);
      return;
    }
    listeners.forEach((listener) => {
      listener(...args, params);
    });
  }
  public getListeners(event: string): Callback[] {
    const result = this._tree.match(event);
    return result.value || [];
  }

  public hasListeners(event: string): boolean {
    const result = this._tree.match(event);
    return !!result.value && result.value.length > 0;
  }
  public removeAllListeners(event?: string): void {
    if (event) {
      this._tree.remove(event);
    } else {
      this._tree = new Tree<Callback[]>('event');
    }
  }

  public getEventsByPrefix(prefix: string): string[] {
    const segments = this._tree['path'].split(prefix);
    let node = this._tree['root'];
    const results: string[] = [];

    for (const segment of segments) {
      node = node.static[segment] || Object.values(node.dynamic)[0];
      if (!node) break;
    }

    this.collectEventPaths(node, prefix, results);
    return results;
  }
  private collectEventPaths(node: UniversalNode<Callback[]>, currentPath: string, results: string[]): void {
    if (node.hasFlag(Flags.IS_ENDPOINT)) {
      results.push(currentPath);
    }

    for (const [segment, child] of Object.entries(node.static)) {
      this.collectEventPaths(child, `${currentPath}:${segment}`, results);
    }

    for (const [segment, child] of Object.entries(node.dynamic)) {
      const segmentPath = child.type === NodeType.DYNAMIC ? `:${segment}` : `*`;
      this.collectEventPaths(child, `${currentPath}:${segmentPath}`, results);
    }
  }
}
