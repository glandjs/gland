import 'mocha';
import { expect } from 'chai';
import { CircularDeque } from '@glandjs/events/queue';
describe('Events-Queue-CircularDeque', () => {
  describe('Basic Operations', () => {
    let deque: CircularDeque<number>;

    beforeEach(() => {
      deque = new CircularDeque<number>(8);
    });

    it('should start empty', () => {
      expect(deque.isEmpty()).to.be.true;
      expect(deque.size).to.equal(0);
    });

    it('should add first element correctly', () => {
      deque.addFirst(42);
      expect(deque.size).to.equal(1);
      expect(deque.loadItem(deque.head)).to.equal(42);
    });

    it('should remove last element correctly', () => {
      deque.addFirst(42);
      const removed = deque.removeLast();
      expect(removed).to.equal(42);
      expect(deque.isEmpty()).to.be.true;
    });
  });

  describe('Capacity and Resizing', () => {
    it('should resize when approaching 75% capacity', () => {
      const deque = new CircularDeque<number>(8);

      for (let i = 0; i < 6; i++) {
        deque.addFirst(i);
      }
      expect(deque.buffer.length).to.equal(8);
      expect(deque.size).to.equal(6);
    });

    it('should handle multiple resizes', () => {
      const deque = new CircularDeque<number>(8);

      for (let i = 0; i < 50; i++) {
        deque.addFirst(i);
      }

      expect(deque.size).to.equal(50);
      expect(deque.buffer.length).to.be.at.least(64);
    });
  });

  describe('Mixed Type Handling', () => {
    let deque: CircularDeque<any>;

    beforeEach(() => {
      deque = new CircularDeque<any>(8);
    });

    it('should store and retrieve numbers', () => {
      deque.addFirst(42);
      expect(deque.loadItem(deque.head)).to.equal(42);
    });

    it('should store and retrieve strings', () => {
      deque.addFirst('hello');
      expect(deque.loadItem(deque.head)).to.equal('hello');
    });

    it('should store and retrieve objects', () => {
      const obj = { key: 'value' };
      deque.addFirst(obj);
      expect(deque.loadItem(deque.head)).to.deep.equal(obj);
    });

    it('should throw error for unsupported types', () => {
      expect(() => {
        deque.addFirst(undefined);
      }).to.throw('Unsupported type');

      expect(() => {
        deque.addFirst(Symbol('test'));
      }).to.throw('Unsupported type');
    });
  });

  describe('Edge Cases', () => {
    let deque: CircularDeque<number | string | object>;

    beforeEach(() => {
      deque = new CircularDeque<number>(8);
    });

    it('should handle removing from empty deque', () => {
      const removed = deque.removeLast();
      expect(removed).to.be.undefined;
    });

    it('should wrap around correctly', () => {
      for (let i = 0; i < 6; i++) {
        deque.addFirst(i);
      }

      for (let i = 0; i < 3; i++) {
        deque.removeLast();
      }

      for (let i = 0; i < 4; i++) {
        deque.addFirst(i + 100);
      }

      expect(deque.size).to.equal(7);
    });

    it('should clear deque completely', () => {
      deque.addFirst(1);
      deque.addFirst('test');
      deque.addFirst({ key: 'value' });

      deque.clear();

      expect(deque.isEmpty()).to.be.true;
      expect(deque.size).to.equal(0);
      expect(deque.head).to.equal(0);
      expect(deque.tail).to.equal(0);
    });
  });

  describe('Performance and Limit Tests', () => {
    it('should handle large number of operations', () => {
      const deque = new CircularDeque<number>(8);
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        deque.addFirst(i);
        if (i % 2 === 0) {
          deque.removeLast();
        }
      }

      expect(deque.size).to.be.lessThan(iterations);
    });
  });
});
