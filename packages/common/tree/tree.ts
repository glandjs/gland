import { CharCode, Flags, NodeType, UniversalNode } from './node';
import { PathUtils } from './path.utils';
export type TreeMode = 'event' | 'route';
export class Tree<T> {
  public readonly root: UniversalNode<T>;
  private readonly path: PathUtils;

  constructor(mode: TreeMode) {
    this.root = new UniversalNode<T>(0);
    this.path = new PathUtils(mode);
  }

  insert(path: string, value: T): void {
    const segments = this.path.split(path);
    let currentNode = this.root;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const isLastSegment = i === segments.length - 1;
      const isDynamicSegment = this.isDynamicSegment(segment);

      let childNode: UniversalNode<T> | undefined;
      const nodeType: NodeType = isDynamicSegment ? 1 : 0;

      const nodeDict = nodeType === 0 ? currentNode.static : currentNode.dynamic;

      childNode = nodeDict[segment];

      if (!childNode) {
        childNode = currentNode.addChild(segment, nodeType);
      }

      if (isLastSegment) {
        childNode.value = value;
        childNode.addFlag(Flags.IS_ENDPOINT);
      }

      currentNode = childNode;
    }
  }

  match(path: string): { value: T | null; params: Record<string, string> } {
    const segments = this.path.split(path);
    let currentNode: UniversalNode<T> | null = this.root;
    const params: Record<string, string> = {};

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      let matchedNode = currentNode!.static[segment];

      if (!matchedNode) {
        for (const [dynSegment, dynNode] of Object.entries(currentNode!.dynamic)) {
          if (dynNode?.hasFlag(Flags.HAS_COLON)) {
            params[dynSegment.slice(1)] = segment;
            matchedNode = dynNode;
            break;
          } else if (dynNode?.hasFlag(Flags.HAS_WILDCARD)) {
            params['*'] = segment;
            matchedNode = dynNode;
            break;
          }
        }
      }

      if (!matchedNode) {
        return { value: null, params: {} };
      }

      currentNode = matchedNode;

      if (i === segments.length - 1 && currentNode!.hasFlag(Flags.IS_ENDPOINT)) {
        return { value: currentNode!.value, params };
      }
    }

    return { value: null, params: {} };
  }

  remove(path: string): boolean {
    const segments = this.path.split(path);
    const pathStack: UniversalNode<T>[] = [this.root];
    let currentNode = this.root;

    for (const segment of segments) {
      let childNode: UniversalNode<T> | undefined;

      childNode = currentNode.static[segment];

      if (!childNode) {
        for (const [dynSegment, dynNode] of Object.entries(currentNode.dynamic)) {
          if (dynNode?.hasFlag(Flags.HAS_COLON) || dynNode?.hasFlag(Flags.HAS_WILDCARD)) {
            childNode = dynNode;
            break;
          }
        }
      }
      pathStack.push(childNode);
      currentNode = childNode;
    }

    if (!currentNode?.hasFlag(Flags.IS_ENDPOINT)) return false;

    currentNode.removeFlag(Flags.IS_ENDPOINT);
    currentNode.value = null;

    for (let i = pathStack.length - 1; i > 0; i--) {
      const node = pathStack[i];
      const parent = pathStack[i - 1];

      if (Object.keys(node.static).length > 0 || Object.keys(node.dynamic).length > 0 || node.value !== null) break;

      if (node.type === NodeType.STATIC) {
        delete parent.static[segments[i - 1]];
      } else {
        delete parent.dynamic[segments[i - 1]];
      }

      if (node?.hasFlag(Flags.HAS_COLON)) {
        parent.removeFlag(Flags.HAS_COLON);
      }
      if (node?.hasFlag(Flags.HAS_WILDCARD)) {
        parent.removeFlag(Flags.HAS_WILDCARD);
      }
    }

    return true;
  }

  private isDynamicSegment(segment: string): boolean {
    const firstChar = segment.charCodeAt(0);
    return firstChar === CharCode.COLON || firstChar === CharCode.WILDCARD;
  }
}
