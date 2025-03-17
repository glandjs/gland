import type { RouteAction } from '@gland/http/interface';
import { NodeType, RadixNode } from './node';
import { PathUtils, SegmentAnalyzer } from './utils';

export class NodeAdder {
  constructor(private rootNode: RadixNode) {}

  addNode(method: string, path: string, handler: RouteAction): void {
    const segments = PathUtils.split(path);
    let current = this.rootNode;

    for (const segment of segments) {
      current = this.processSegment(current, segment);
    }

    current.addHandler(method, handler);
  }

  private processSegment(current: RadixNode, segment: string): RadixNode {
    const analyzer = new SegmentAnalyzer(segment);

    if (analyzer.isParameter()) {
      return this.handleParameter(current, analyzer);
    }

    if (analyzer.isWildcard()) {
      return this.handleWildcard(current);
    }

    return this.handleStaticSegment(current, segment);
  }
  private handleStaticSegment(current: RadixNode, segment: string): RadixNode {
    for (const prefix of Object.keys(current.children)) {
      const commonPrefixLength = PathUtils.findCommonPrefixLength(segment, prefix);

      if (commonPrefixLength > 0) {
        if (commonPrefixLength < prefix.length) {
          const remainingPrefix = prefix.slice(commonPrefixLength);
          const commonPrefix = prefix.slice(0, commonPrefixLength);

          const intermediateNode = new RadixNode(commonPrefix, NodeType.STATIC);
          const existingNode = current.children[prefix];
          existingNode.prefix = remainingPrefix;

          delete current.children[prefix];
          current.children[commonPrefix] = intermediateNode;
          intermediateNode.children[remainingPrefix] = existingNode;

          current = intermediateNode;
        } else {
          current = current.children[prefix];
        }

        if (commonPrefixLength < segment.length) {
          const remainingSegment = segment.slice(commonPrefixLength);
          const childNode = current.children[remainingSegment] || new RadixNode(remainingSegment, NodeType.STATIC);
          current.children[remainingSegment] = childNode;
          current = childNode;
        }

        return current;
      }
    }

    const newNode = new RadixNode(segment, NodeType.STATIC);
    current.children[segment] = newNode;
    return newNode;
  }

  private handleParameter(current: RadixNode, analyzer: SegmentAnalyzer): RadixNode {
    const paramName = analyzer.extractParameterName();
    if (!current.parameter) {
      current.parameter = new RadixNode('', NodeType.PARAMETER, paramName);
    }
    return current.parameter;
  }

  private handleWildcard(current: RadixNode): RadixNode {
    if (!current.wildcard) {
      current.wildcard = new RadixNode('*', NodeType.WILDCARD);
    }
    return current.wildcard;
  }
}
