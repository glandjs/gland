import { expect } from 'chai';
import sinon from 'sinon';
import { EventSystem } from '../../../dist/events/EventSystem';
import { CoreEventType } from '../../../dist/common/enums';
import { LifecycleEvents } from '../../../dist/common/interfaces';

describe('EventSystem', () => {
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = new EventSystem();
  });

  afterEach(() => {
    eventSystem.clear();
  });

  describe('on()', () => {
    it('should register a listener for a generic event', () => {
      const handler = sinon.spy();
      eventSystem.on(CoreEventType.Start, handler);

      eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);

      expect(handler.calledOnce).to.be.true;
    });

    it('should register a listener for a route event', () => {
      const handler = sinon.spy();
      const route = 'users/:id';

      eventSystem.on(CoreEventType.Route, route, handler);

      const context: LifecycleEvents['Route'] = {
        path: route,
        params: { id: '123' },
        method: 'GET',
        statusCode: 200,
      };

      eventSystem.emit(CoreEventType.Route, context);

      expect(handler.calledOnce).to.be.true;
    });

    it('should not call route event handler when route does not match', () => {
      const handler = sinon.spy();
      const route = 'users/:id';

      eventSystem.on(CoreEventType.Route, route, handler);

      expect(handler.called).to.be.false;
    });
  });

  describe('once()', () => {
    it('should register a one-time listener for a generic event', () => {
      const handler = sinon.spy();
      eventSystem.once(CoreEventType.Start, handler);
      const context: LifecycleEvents['Start'] = {
        timestamp: new Date(),
      };
      eventSystem.emit(CoreEventType.Start, context);
      eventSystem.emit(CoreEventType.Start, context); // This should not trigger the handler again

      expect(handler.calledOnce).to.be.true;
    });

    it('should register a one-time listener for a route event', () => {
      const handler = sinon.spy();
      const route = 'users/:id';

      eventSystem.once(CoreEventType.Route, route, handler);

      const context: LifecycleEvents['Route'] = {
        path: route,
        params: { id: '123' },
        method: 'GET',
        statusCode: 200,
      };

      eventSystem.emit(CoreEventType.Route, context);
      eventSystem.emit(CoreEventType.Route, context);

      expect(handler.calledOnce).to.be.true;
    });
  });

  describe('off()', () => {
    it('should remove a listener for a generic event', () => {
      const handler = sinon.spy();
      eventSystem.on(CoreEventType.Start, handler);

      eventSystem.off(CoreEventType.Start, handler);
      eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);

      expect(handler.called).to.be.false;
    });

    it('should remove a listener for a route event', () => {
      const handler = sinon.spy();
      const route = 'users/:id';

      eventSystem.on(CoreEventType.Route, route, handler);
      eventSystem.off(CoreEventType.Route, handler, route);

      const context = {
        route,
        params: { id: '123' },
        method: 'GET',
        statusCode: 200,
        timestamp: new Date(),
      };

      eventSystem.emit(CoreEventType.Route, context as LifecycleEvents['Route']);

      expect(handler.called).to.be.false;
    });
  });

  describe('clear()', () => {
    it('should clear all listeners for a specific event', () => {
      const handler = sinon.spy();
      eventSystem.on(CoreEventType.Start, handler);

      eventSystem.clear(CoreEventType.Start);
      eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);

      expect(handler.called).to.be.false;
    });

    it('should clear all listeners for all events', () => {
      const startHandler = sinon.spy();
      const stopHandler = sinon.spy();

      eventSystem.on(CoreEventType.Start, startHandler);
      eventSystem.on(CoreEventType.Stop, stopHandler);

      eventSystem.clear();

      eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);
      eventSystem.emit(CoreEventType.Stop, { timestamp: new Date() } as LifecycleEvents['Stop']);

      expect(startHandler.called).to.be.false;
      expect(stopHandler.called).to.be.false;
    });
  });

  describe('emit()', () => {
    it('should emit the correct event and trigger handlers', async () => {
      const handler = sinon.spy();

      eventSystem.on(CoreEventType.Start, handler);

      await eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);

      expect(handler.calledOnce).to.be.true;
    });

    it('should handle multiple listeners for the same event', async () => {
      const handler1 = sinon.spy();
      const handler2 = sinon.spy();

      eventSystem.on(CoreEventType.Start, handler1);
      eventSystem.on(CoreEventType.Start, handler2);

      await eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);

      expect(handler1.calledOnce).to.be.true;
      expect(handler2.calledOnce).to.be.true;
    });

    it('should handle an empty event without errors', async () => {
      const result = await eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);
      expect(result).to.be.undefined;
    });
  });

  describe('edge cases', () => {
    it('should handle emitting an event with no listeners', async () => {
      const result = await eventSystem.emit(CoreEventType.Error, { error: null } as LifecycleEvents['Error']);
      expect(result).to.be.undefined;
    });

    it('should handle registering a listener after emitting an event', async () => {
      const handler = sinon.spy();

      await eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);
      eventSystem.on(CoreEventType.Start, handler);

      await eventSystem.emit(CoreEventType.Start, { timestamp: new Date() } as LifecycleEvents['Start']);
      expect(handler.calledOnce).to.be.true;
    });
  });
});
