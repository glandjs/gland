export interface DependencyNode<T = any> {
  id: string;
  type: 'module' | 'controller' | 'channel';
  metadata?: Record<string, any>;
  instance?: T;
  parentId?: string;
  children: string[];
  exports: string[];
}

export class DependencyGraph<T = any> {
  private readonly nodes = new Map<string, DependencyNode<T>>();

  public addNode(id: string, type: 'module' | 'controller' | 'channel', parentId?: string, metadata?: Record<string, any>, instance?: T): DependencyNode<T> {
    if (this.nodes.has(id)) {
      const existingNode = this.nodes.get(id)!;
      existingNode.type = type;
      existingNode.metadata = { ...existingNode.metadata, ...metadata };

      if (instance !== undefined) {
        existingNode.instance = instance;
      }

      if (parentId && !existingNode.parentId) {
        existingNode.parentId = parentId;

        const parentNode = this.getNode(parentId);
        if (parentNode) {
          parentNode.children.push(id);
        }
      }

      return existingNode;
    }

    const node: DependencyNode<T> = {
      id,
      type,
      metadata,
      instance,
      parentId,
      children: [],
      exports: [],
    };

    this.nodes.set(id, node);

    if (parentId) {
      const parentNode = this.getNode(parentId);
      if (parentNode) {
        parentNode.children.push(id);
      }
    }

    return node;
  }
  public getNode(id: string): DependencyNode<T> | undefined {
    return this.nodes.get(id);
  }

  public markAsExported(id: string, moduleId: string): void {
    const node = this.getNode(moduleId);
    if (node) {
      if (!node.exports.includes(id)) {
        node.exports.push(id);
      }
    }
  }
}
