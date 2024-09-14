export type Task = (...args: any[]) => Promise<any> | void;

interface QueueOptions {
  concurrency?: number;
}
export class Queue {
  private tasks: Task[] = [];
  private concurrency: number;
  private activeCount: number = 0;

  constructor(options?: QueueOptions) {
    this.concurrency = options?.concurrency ?? 1;
  }

  public enqueue(task: Task): void {
    this.tasks.push(task);
    this.processQueue();
  }
  private async processQueue(): Promise<void> {
    if (this.activeCount >= this.concurrency || this.tasks.length === 0) {
      return;
    }
    this.activeCount++;
    const task = this.tasks.shift()!;

    try {
      await task();
    } catch (error) {
      console.error('Task execution failed:', error);
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }
  public size(): number {
    return this.tasks.length;
  }
  public clear(): void {
    this.tasks = [];
  }
}
