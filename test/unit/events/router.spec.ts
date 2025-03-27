import { expect } from 'chai';
import sinon from 'sinon';
import { EventRouter } from '@gland/events/container';

describe('Events-Router', () => {
  let eventRouter: EventRouter;

  beforeEach(() => {
    eventRouter = new EventRouter();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('on Method', () => {
    it('should add listeners to the event tree', () => {
      const listener = sinon.stub();
      eventRouter.on('test:event', listener);

      const listeners = eventRouter.getListeners('test:event');
      expect(listeners).to.include(listener);
    });

    it('should handle multiple listeners for the same event', () => {
      const listener1 = sinon.stub();
      const listener2 = sinon.stub();

      eventRouter.on('test:event', listener1);
      eventRouter.on('test:event', listener2);

      const listeners = eventRouter.getListeners('test:event');
      expect(listeners).to.have.lengthOf(2);
      expect(listeners).to.include(listener1);
      expect(listeners).to.include(listener2);
    });
  });

  describe('once Method', () => {
    it('should remove listener after first invocation', () => {
      eventRouter.once('test:event', (data) => {});

      eventRouter.emit('test:event', 'arg1');
      try {
        eventRouter.emit('test:event', 'arg2'); // return errror
      } catch (error) {}

      const listeners = eventRouter.getListeners('test:event');
      expect(listeners).to.have.lengthOf(0);
    });
  });

  describe('off Method', () => {
    it('should remove specific listener', () => {
      const listener1 = sinon.stub();
      const listener2 = sinon.stub();

      eventRouter.on('test:event', listener1);
      eventRouter.on('test:event', listener2);

      eventRouter.off('test:event', listener1);

      const listeners = eventRouter.getListeners('test:event');
      expect(listeners).to.have.lengthOf(1);
      expect(listeners).to.include(listener2);
      expect(listeners).to.not.include(listener1);
    });

    it('should remove all listeners for an event', () => {
      const listener1 = sinon.stub();
      const listener2 = sinon.stub();

      eventRouter.on('test:event', listener1);
      eventRouter.on('test:event', listener2);

      eventRouter.off('test:event');

      const listeners = eventRouter.getListeners('test:event');
      expect(listeners).to.have.lengthOf(0);
    });
  });

  describe('emit Method', () => {
    it('should invoke all listeners for an event', () => {
      const listener1 = sinon.stub();
      const listener2 = sinon.stub();

      eventRouter.on('test:event', listener1);
      eventRouter.on('test:event', listener2);

      eventRouter.emit('test:event', 'arg1');

      expect(listener1.calledOnceWith('arg1')).to.be.true;
      expect(listener2.calledOnceWith('arg1')).to.be.true;
    });
  });

  describe('Wildcard', () => {
    it('should retrieve events by prefix', () => {
      const listener = sinon.stub();
      eventRouter.on('user:created', listener);
      eventRouter.on('user:updated', listener);
      eventRouter.on('order:placed', listener);

      const events = eventRouter.getEventsByPrefix('user');

      expect(events).to.have.lengthOf(2);
      expect(events).to.include('user:created');
      expect(events).to.include('user:updated');
    });
    it('should support wildcard event matching', () => {
      const listener = sinon.stub();

      eventRouter.on('user:*', listener);

      eventRouter.emit('user:created', listener);
      eventRouter.emit('user:updated', listener);

      expect(listener.calledTwice).to.be.true;
    });
    it('should handle multiple wildcard patterns', () => {
      const listener = sinon.stub();

      eventRouter.on('*:created', listener);

      eventRouter.emit('user:created', listener);
      eventRouter.emit('order:created', listener);

      expect(listener.calledTwice).to.be.true;
    });
  });

  describe('Stress', () => {
    it('should handle a large number of event listeners', function () {
      this.timeout(5000);

      const listenerCount = 10000;
      const listeners = new Array(listenerCount).fill(0).map(() => sinon.stub());

      listeners.forEach((listener, index) => {
        eventRouter.on(`stress:event:${index}`, listener);
      });

      listeners.forEach((listener, index) => {
        eventRouter.emit(`stress:event:${index}`, listener);
      });

      listeners.forEach((listener) => {
        expect(listener.calledOnce).to.be.true;
      });
    });
  });

  describe('Cleanup and Removal', () => {
    it('should remove all listeners', () => {
      eventRouter.on('test:event1', () => {});
      eventRouter.on('test:event2', () => {});

      eventRouter.removeAllListeners();

      const events = eventRouter.getEventsByPrefix('test');
      expect(events).to.have.lengthOf(0);
    });

    it('should remove listeners for a specific event', () => {
      eventRouter.on('test:event1', () => {});
      eventRouter.on('test:event2', () => {});

      eventRouter.removeAllListeners('test:event1');

      const events = eventRouter.getEventsByPrefix('test');
      expect(events).to.have.lengthOf(1);
      expect(events).to.include('test:event2');
    });
  });
});
