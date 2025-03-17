import { RouteAction } from '../../interface';
import { Maybe, type Dictionary } from '@medishn/toolkit';
import { NodeAdder } from './adder';
import { NodeMatcher } from './matcher';
export enum NodeType {
  STATIC,
  PARAMETER,
  WILDCARD,
}
export type RouteParams = Record<string, string>;
export type MatchResult = {
  handler: RouteAction;
  params: RouteParams;
};

export class RadixNode {
  public handlers: Dictionary<RouteAction> = Object.create(null);
  public children: Dictionary<RadixNode> = Object.create(null);

  public parameter: Maybe<RadixNode> = null;
  public wildcard: Maybe<RadixNode> = null;
  constructor(public prefix: string = '', public type: NodeType = NodeType.STATIC, public paramName: string = '') {}

  addNode(method: string, path: string, action: RouteAction): void {
    new NodeAdder(this).addNode(method, path, action);
  }

  match(method: string, path: string): Maybe<MatchResult> {
    return new NodeMatcher(this).match(method, path);
  }

  hasHandlers(): boolean {
    return Object.keys(this.handlers).length > 0;
  }

  addHandler(method: string, handler: RouteAction): void {
    this.handlers[method] = handler;
  }

  getHandler(method: string): Maybe<RouteAction> {
    const handler = this.handlers[method];
    if (handler) return handler;

    return this.handlers['all'];
  }
}
