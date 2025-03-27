import { EventQueue } from '@glandjs/events/queue';
import { expect } from 'chai';
import sinon from 'sinon';

describe('Events-Queue', () => {
  describe('Constructor', () => {
    it('should create an event queue with default max size', () => {
      const queue = new EventQueue();
      const queueAny = queue as any;
      expect(queueAny.deque.buffer.length).to.equal(1024);
    });

    it('should create an event queue with custom max size', () => {
      const queue = new EventQueue(500);
      const queueAny = queue as any;
      expect(queueAny.deque.buffer.length).to.equal(512);
    });
  });

  describe('Enqueue Behavior', () => {
    let queue: EventQueue;

    beforeEach(() => {
      queue = new EventQueue(16);
    });

    it('should enqueue events', () => {
      const queueAny = queue as any;

      queue.enqueue('event1');
      queue.enqueue('event2');

      expect(queueAny.deque.size).to.equal(2);
    });
  });

  describe('Process Method', () => {
    let queue: EventQueue;
    let processingStub: sinon.SinonStub;

    beforeEach(() => {
      queue = new EventQueue(16);
      processingStub = sinon.stub().resolves();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should process events in batches', async () => {
      for (let i = 0; i < 10; i++) {
        queue.enqueue(`event${i}`);
      }

      await queue.process(async (event) => {
        processingStub(event);
      });

      expect(processingStub.callCount).to.equal(10);
    });

    it('should handle async event processing', async () => {
      const events = ['quick', 'slow1', 'slow2'];
      events.forEach((event) => queue.enqueue(event));

      const delayedProcessing = (event: string): Promise<void> => {
        if (event.startsWith('slow')) {
          return new Promise((resolve) => setTimeout(resolve, 100));
        }
        return Promise.resolve();
      };

      const startTime = Date.now();
      await queue.process(delayedProcessing);
      const processingTime = Date.now() - startTime;

      expect(processingTime).to.be.lessThan(500);
    });

    it('should handle processing errors', async () => {
      queue.enqueue('event1');
      queue.enqueue('event2');

      const errorStub = sinon.stub().throws(new Error('Processing error'));

      try {
        await queue.process(async () => {
          errorStub();
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Processing error');
        expect(errorStub.calledOnce).to.be.true;
      }
    });
  });

  describe('Clear Method', () => {
    it('should clear all events from the queue', () => {
      const queue = new EventQueue(16);
      const queueAny = queue as any;

      for (let i = 0; i < 10; i++) {
        queue.enqueue(`event${i}`);
      }

      queue.clear();

      expect(queueAny.deque.isEmpty()).to.be.true;
      expect(queueAny.deque.size).to.equal(0);
    });
  });

  describe('Edge Cases', () => {
    let queue: EventQueue;

    beforeEach(() => {
      queue = new EventQueue(16);
    });

    it('should handle processing empty queue', async () => {
      const processingStub = sinon.stub().resolves();

      await queue.process(async (event) => {
        processingStub(event);
      });

      expect(processingStub.called).to.be.false;
    });

    it('should handle very large number of events', async () => {
      for (let i = 0; i < 10000; i++) {
        queue.enqueue(`event${i}`);
      }

      const processingStub = sinon.stub().resolves();

      await queue.process(async (event) => {
        processingStub(event);
      });
      expect(processingStub.callCount).to.equal(10000);
    });
  });

  describe('Performance Tests', () => {
    it('should process events efficiently', async function () {
      this.timeout(5000);

      const queue = new EventQueue(1024);
      const totalEvents = 10000;

      for (let i = 0; i < totalEvents; i++) {
        queue.enqueue(`event${i}`);
      }

      const startTime = Date.now();

      const processingStub = sinon.stub().resolves();
      await queue.process(async (event) => {
        processingStub(event);
      });

      const processingTime = Date.now() - startTime;

      expect(processingStub.callCount).to.equal(totalEvents);
      expect(processingTime).to.be.lessThan(1024);
    });
  });
});
