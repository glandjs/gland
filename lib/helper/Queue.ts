type Task = () => Promise<void>;

export interface QueueOptions {
  maxConcurrent: number;
  cacheSize?: number;
}

export class Queue {
  private queue: Task[] = [];
  private running = 0;
  private maxConcurrent: number;
  private cache: Set<string> = new Set();
  private cacheSize: number;

  constructor(options: QueueOptions) {
    this.maxConcurrent = options.maxConcurrent;
    this.cacheSize = options.cacheSize || 1000;
  }

  async add(task: Task, taskId: string) {
    if (this.cache.has(taskId)) {
      return;
    }

    this.queue.push(() => this.executeTask(task, taskId));
    this.process();
  }

  private async executeTask(task: Task, taskId: string) {
    this.cache.add(taskId);
    if (this.cache.size > this.cacheSize) {
      const firstKey = this.cache.values().next().value;
      this.cache.delete(firstKey!);
    }
    await task();
  }

  private async process() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      this.running++;
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } finally {
          this.running--;
        }
      }
    }
  }
}
