import { EventQueue } from './queue';
export * from './circular-deque';
export * from './queue';
const queue = new EventQueue();
console.time('stress-test');

for (let i = 0; i < 1e6; i++) {
  queue.enqueue({
    type: 'log',
    correlationId: 'test',
    data: { index: i },
  });
}
console.timeEnd('stress-test');
