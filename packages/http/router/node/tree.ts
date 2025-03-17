import type { RouteAction } from '@gland/http/interface';
import { RadixNode, type MatchResult } from './node';
import type { Maybe } from '@medishn/toolkit';

export class RadixTree {
  private root: RadixNode;

  constructor() {
    this.root = new RadixNode();
  }

  add(method: string, path: string, action: RouteAction): void {
    this.root.addNode(method, path, action);
  }

  match(method: string, path: string): Maybe<MatchResult> {
    return this.root.match(method, path);
  }
}
