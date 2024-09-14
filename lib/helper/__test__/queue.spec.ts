import { expect } from 'chai';
import { Queue, Task } from '../queue';

describe('Queue', () => {
  let queue: Queue;

  beforeEach(() => {
    queue = new Queue({ concurrency: 2 });
  });

  it('should process tasks according to the specified concurrency', (done) => {
    let completedTasks = 0;

    const task: Task = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate async task
      completedTasks++;
    };

    queue.enqueue(task);
    queue.enqueue(task);
    queue.enqueue(task);
    queue.enqueue(task);

    // Ensure the queue runs 2 tasks concurrently
    setTimeout(() => {
      expect(completedTasks).to.equal(2); // After 600ms, only 2 tasks should be completed
      done();
    }, 600);
  });

  it('should process all tasks eventually', (done) => {
    let completedTasks = 0;

    const task: Task = async () => {
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate async task
      completedTasks++;
    };

    queue.enqueue(task);
    queue.enqueue(task);
    queue.enqueue(task);
    setTimeout(() => {
      expect(completedTasks).to.equal(3);
      done();
    }, 1000);
  });
  it('should handle task failures gracefully', (done) => {
    let completedTasks = 0;
    let errorLogged = false;

    // Override console.error to check for error logging
    const originalError = console.error;
    console.error = () => {
      errorLogged = true;
    };

    const failingTask: Task = async () => {
      throw new Error('Task failed');
    };
    const successfulTask: Task = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async task
      completedTasks++;
    };

    queue.enqueue(failingTask);
    queue.enqueue(successfulTask);

    // Wait for both tasks (including the failed one) to complete
    setTimeout(() => {
      expect(completedTasks).to.equal(1); // Only one task should complete
      expect(errorLogged).to.be.true; // Error should have been logged for the failed task

      // Restore original console.error
      console.error = originalError;
      done();
    }, 300);
  });
});
