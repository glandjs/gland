// 0: normal -> for event -> static for route
// 1: un-normal -> for event is wildcard, for route is wildcard and param
export enum NodeType {
  STATIC = 0,
  DYNAMIC = 1,
}

export enum CharCode {
  COLON = 58, // :
  WILDCARD = 42, // *
}

export enum Flags {
  NONE = 0,
  HAS_COLON = 1 << 0, // 1
  HAS_WILDCARD = 1 << 1, // 2
  IS_ENDPOINT = 1 << 2, // 4

  IS_DYNAMIC = 1 << 3, // 8
}
export class UniversalNode<T> {
  public static: { [segment: string]: UniversalNode<T> } = Object.create(null);
  public dynamic: { [segment: string]: UniversalNode<T> } = Object.create(null);
  public flags: Flags = Flags.NONE;
  public value: T | null = null;

  constructor(public type: NodeType = 0) {}
  hasFlag(flag: Flags): boolean {
    return (this.flags & flag) === flag;
  }

  addFlag(flag: Flags): void {
    this.flags |= flag;
  }
  removeFlag(flag: Flags): void {
    this.flags &= ~flag;
  }
  addChild(segment: string, type: NodeType): UniversalNode<T> {
    const node = new UniversalNode<T>(type);
    if (type === 0) {
      this.static[segment] = node;
    } else {
      this.dynamic[segment] = node;
      this.addFlag(Flags.IS_DYNAMIC);

      if (segment.charCodeAt(0) === CharCode.COLON) {
        node.addFlag(Flags.HAS_COLON);
      } else if (segment.charCodeAt(0) === CharCode.WILDCARD) {
        node.addFlag(Flags.HAS_WILDCARD);
      }
    }
    return node;
  }
}
