import type { Maybe } from '@medishn/toolkit';
import type { MatchResult, RadixNode, RouteParams } from './node';
import { PathUtils } from './utils';

export class NodeMatcher {
  constructor(private rootNode: RadixNode) {}

  match(method: string, path: string): Maybe<MatchResult> {
    const params = Object.create(null);
    const match = this.findMatch(this.rootNode, PathUtils.split(path), params);

    if (match) {
      const handler = match.getHandler(method);
      if (handler) {
        return { handler, params };
      }
    }

    return null;
  }

  private findMatch(node: RadixNode, segments: string[], params: RouteParams): Maybe<RadixNode> {
    let i = 0;

    while (i < segments.length) {
      const segment = segments[i];

      const staticChild = node.children[segment];
      if (staticChild) {
        node = staticChild;
        i++;
        continue;
      }

      if (node.parameter) {
        params[node.parameter.paramName] = segment;
        node = node.parameter;
        i++;
        continue;
      }

      if (node.wildcard) {
        params['*'] = segment;
        node = node.wildcard;
        i++;
        continue;
      }

      return null;
    }

    return node.hasHandlers() ? node : null;
  }
}
