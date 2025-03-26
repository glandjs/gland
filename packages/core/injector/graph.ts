export type NodeType = string;

export interface Node<T = any> {
  id: string;
  type: NodeType;
  metadata?: Record<string, any>;
  instance?: T;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cycle?: string[];
  path?: string[];
}

export class DependencyGraph<T = any> {
  private readonly nodes = new Map<string, Node<T>>();
  private readonly edges = new Map<string, Edge>();

  private readonly outgoingEdges = new Map<string, Set<string>>();

  public addNode(id: string, type: NodeType, metadata?: Record<string, any>, instance?: T): Node<T> {
    if (this.nodes.has(id)) {
      const existingNode = this.nodes.get(id)!;
      existingNode.type = type;
      existingNode.metadata = { ...existingNode.metadata, ...metadata };
      if (instance !== undefined) existingNode.instance = instance;
      return existingNode;
    }

    const node: Node<T> = {
      id,
      type,
      metadata,
      instance,
    };

    this.nodes.set(id, node);

    return node;
  }

  public getNode(id: string): Node<T> | undefined {
    return this.nodes.get(id);
  }

  public detectCycles(): CycleDetectionResult {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycleNodes: string[] = [];

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const result = this.hasCycle(nodeId, visited, recursionStack, cycleNodes);
        if (result) {
          return {
            hasCycle: true,
            cycle: Array.from(cycleNodes),
            path: this.findPathInCycle(cycleNodes),
          };
        }
      }
    }

    return { hasCycle: false };
  }

  private hasCycle(nodeId: string, visited: Set<string>, recursionStack: Set<string>, cycleNodes: string[]): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdgeIds = this.outgoingEdges.get(nodeId) || new Set();

    for (const edgeId of outgoingEdgeIds) {
      const edge = this.edges.get(edgeId)!;
      const targetId = edge.targetId;

      if (!visited.has(targetId)) {
        if (this.hasCycle(targetId, visited, recursionStack, cycleNodes)) {
          cycleNodes.unshift(targetId);
          return true;
        }
      } else if (recursionStack.has(targetId)) {
        cycleNodes.unshift(targetId);
        cycleNodes.unshift(nodeId);
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  private findPathInCycle(cycleNodes: string[]): string[] {
    if (cycleNodes.length < 2) {
      return cycleNodes;
    }

    const startNode = cycleNodes[0];
    const path: string[] = [startNode];
    let currentNode = startNode;

    while (true) {
      const outgoingEdgeIds = this.outgoingEdges.get(currentNode) || new Set();

      for (const edgeId of outgoingEdgeIds) {
        const edge = this.edges.get(edgeId)!;
        const targetId = edge.targetId;

        if (cycleNodes.includes(targetId)) {
          path.push(targetId);
          currentNode = targetId;

          if (targetId === startNode) {
            return path;
          }

          break;
        }
      }

      if (path.length > 1 && path[path.length - 1] === path[0]) {
        return path;
      }

      if (path.length >= cycleNodes.length) {
        return path;
      }
    }
  }
}
