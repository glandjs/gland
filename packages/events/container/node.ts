import { Logger, type Callback } from '@medishn/toolkit';
import { BitVector } from './bit-vector';
import { EventQueue } from '../queue';
import { Emitter } from './emitter';
type EventPart = string;

const PATH_SEPARATOR = ':';
interface Node {
  id: number;
  children: Map<EventPart, Node>;
  parent: Node | null;
  part: EventPart;
}

export class EventNode {
  private readonly logger = new Logger({
    context: 'Gland:Events',
  });

  private root: Node;
  private nodes: Node[] = [];
  private listeners: Map<number, Set<Callback>> = new Map();
  private nodesBitVector: BitVector;
  private nextNodeId = 1;
  private readonly _queues = new Map<string, EventQueue>();
  private readonly _emitter: Emitter;

  constructor(initialCapacity = 1024) {
    this.nodesBitVector = new BitVector(initialCapacity);

    this.root = {
      id: 0,
      children: new Map(),
      parent: null,
      part: '',
    };

    this.nodes[0] = this.root;
    this._emitter = new Emitter();
  }

  public on(event: string, listener: Callback): void {
    this.insert(event, listener);
    queueMicrotask(() => {
      const matchingTypes = this.getEventsByPrefix(event.split('*')[0]);
      for (const type of matchingTypes) {
        const queue = this._queues.get(type);
        if (queue) {
          this.logger.info(`Processing queued events for pattern "${event}" matching "${type}"`);
          queue.process(async (event) => {
            this.emit(event);
          });
        }
      }
    });
  }

  public once(eventType: string, listener: Callback): void {
    const onceWrapper = (...args: any[]) => {
      this.remove(eventType, onceWrapper);
      listener(...args);
    };
    this.insert(eventType, onceWrapper);
  }

  public off(event: string, listener: Callback): boolean {
    const isOff = this.remove(event, listener);
    queueMicrotask(() => this._cleanupQueue(event));
    return isOff;
  }

  public emit(event: string, ...args: any[]): boolean {
    const nodeId = this.resolveNodeId(event);

    if (nodeId === -1) {
      if (this.hasListeners(event)) {
        this.logger.warn(`No active listeners for "${event}", but previous listeners existed. Not queuing.`);
        return false;
      }
      this.logger.warn(`No listeners for "${event}", queueing event.`);
      this._queueEvent(event);
      return false;
    }

    const nodeListeners = this.listeners.get(nodeId);
    if (!nodeListeners || nodeListeners.size === 0) return false;
    this._emitter.execute(nodeListeners, ...args);
    return true;
  }

  private insert(eventType: string, listener: Callback): void {
    const nodeId = this.getOrCreateNodeId(eventType);

    let nodeListeners = this.listeners.get(nodeId);
    if (!nodeListeners) {
      nodeListeners = new Set();
      this.listeners.set(nodeId, nodeListeners);
      this.nodesBitVector.set(nodeId);
    }

    nodeListeners.add(listener);
  }

  private remove(eventType: string, listener: Callback): boolean {
    const nodeId = this.resolveNodeId(eventType);
    if (nodeId === -1) return false;

    const nodeListeners = this.listeners.get(nodeId);
    if (!nodeListeners) return false;

    const result = nodeListeners.delete(listener);

    if (result && nodeListeners.size === 0) {
      this.listeners.delete(nodeId);
      this.nodesBitVector.clear(nodeId);

      const node = this.nodes[nodeId];
      this.cleanupEmptyBranch(node);
    }

    return result;
  }

  public getListeners(event: string): Callback[] {
    const nodeId = this.resolveNodeId(event);
    if (nodeId === -1) return [];

    const nodeListeners = this.listeners.get(nodeId);
    return nodeListeners ? Array.from(nodeListeners) : [];
  }

  public hasListeners(eventType: string): boolean {
    const nodeId = this.resolveNodeId(eventType);
    if (nodeId === -1) return false;

    return this.nodesBitVector.get(nodeId);
  }

  public getEventsByPrefix(prefix: string): string[] {
    const results: string[] = [];
    if (prefix === '') {
      if (this.nodesBitVector.get(this.root.id)) {
        results.push('');
      }

      this.collectEventTypes(this.root, '', results);
      return results;
    }

    const nodeId = this.resolveNodeId(prefix);
    if (nodeId === -1) return [];

    const node = this.nodes[nodeId];

    if (this.nodesBitVector.get(node.id)) {
      results.push(prefix);
    }

    this.collectEventTypes(node, prefix, results);

    return results;
  }

  public removeAllListeners(eventType?: string): void {
    if (!eventType) {
      this.listeners.clear();

      for (let i = 0; i <= this.nextNodeId; i++) {
        this.nodesBitVector.clear(i);
      }
      return;
    }

    const nodeId = this.resolveNodeId(eventType);
    if (nodeId === -1) return;

    this.listeners.delete(nodeId);
    this.nodesBitVector.clear(nodeId);

    const node = this.nodes[nodeId];
    this.cleanupEmptyBranch(node);
  }

  private getOrCreateNodeId(path: string): number {
    const parts = path.split(PATH_SEPARATOR);
    let node = this.root;

    for (const part of parts) {
      let child = node.children.get(part);

      if (!child) {
        const nodeId = this.nextNodeId++;
        child = {
          id: nodeId,
          part,
          parent: node,
          children: new Map(),
        };
        this.nodes[nodeId] = child;
        node.children.set(part, child);
      }

      node = child;
    }

    return node.id;
  }

  private resolveNodeId(path: string): number {
    const parts = path.split(PATH_SEPARATOR);
    let node = this.root;

    for (const part of parts) {
      const child = node.children.get(part);
      if (!child) return -1;
      node = child;
    }
    return node.id;
  }

  private cleanupEmptyBranch(startNode: Node): void {
    let node: Node | null = startNode;

    while (node && node !== this.root) {
      const parent = node.parent;
      if (!parent) break;

      const hasListeners = this.nodesBitVector.get(node.id);

      if (!hasListeners && node.children.size === 0) {
        parent.children.delete(node.part);
      } else {
        break;
      }

      node = parent;
    }
  }

  private collectEventTypes(node: Node, basePath: string, results: string[]): void {
    for (const [childPart, childNode] of node.children) {
      const childPath = basePath === '' ? childPart : basePath + PATH_SEPARATOR + childPart;

      if (this.nodesBitVector.get(childNode.id)) {
        results.push(childPath);
      }

      this.collectEventTypes(childNode, childPath, results);
    }
  }

  private _queueEvent(event: string): void {
    const queue = this._getOrCreateQueue(event);

    queue.enqueue(event);
  }

  private _getOrCreateQueue(type: string): EventQueue {
    if (!this._queues.has(type)) {
      this._queues.set(type, new EventQueue());
    }
    return this._queues.get(type) as EventQueue;
  }
  private _cleanupQueue(event: string): void {
    if (!this.hasListeners(event)) {
      const queue = this._queues.get(event);
      if (queue) {
        this.logger.info(`Cleaning up queue for "${event}"`);
        queue.clear();
        this._queues.delete(event);
      }
    }
  }
}
