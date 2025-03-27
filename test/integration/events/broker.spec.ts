import 'mocha';

import { expect } from 'chai';
import sinon from 'sinon';
import { Broker } from '@gland/events';
describe('Events-Integration ', () => {
  let broker1: Broker;
  let broker2: Broker;
  let broker3: Broker;

  beforeEach(() => {
    broker1 = new Broker('1');
    broker2 = new Broker('2');
    broker3 = new Broker('3');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Basic Event Communication', () => {
    it('should emit and receive events between brokers', (done) => {
      const eventData = { message: 'Hello, World!' };

      broker2.on('test:event', (data) => {
        try {
          expect(data).to.deep.equal(eventData);
          done();
        } catch (error) {
          done(error);
        }
      });

      broker1.connectTo(broker2);
      broker1.emitTo('2', 'test:event', eventData);
    });

    it('should support multiple event listeners', () => {
      const listener1 = sinon.stub();
      const listener2 = sinon.stub();

      broker1.on('test:multi', listener1);
      broker1.on('test:multi', listener2);

      broker1.emit('test:multi', { data: 'test' });

      expect(listener1.calledOnce).to.be.true;
      expect(listener2.calledOnce).to.be.true;
    });
  });

  describe('Advanced Event Routing', () => {
    it('should broadcast events to multiple brokers', () => {
      const data = { data: 'broadcast test' };

      broker2.on('test:broadcast', (pyload) => {
        expect(pyload).deep.equal(data);
      });
      broker3.on('test:broadcast', (pyload) => {
        expect(pyload).deep.equal(data);
      });

      broker1.connectTo(broker2);
      broker1.connectTo(broker3);

      broker1.broadcastTo('test:broadcast', data);
    });

    it('should pipe events between brokers', () => {
      const listener = sinon.stub();

      broker2.on('target:event', listener);

      broker1.connectTo(broker2);
      broker1.pipeTo(broker2.id, 'source:event', 'target:event');

      broker1.emit('source:event', { data: 'piped event' });

      expect(listener.calledOnce).to.be.true;
    });
  });

  describe('Request-Response Pattern', () => {
    it('should handle request with first strategy', () => {
      const responder1 = sinon.stub().returns('Response 1');
      const responder2 = sinon.stub().returns('Response 2');

      broker2.respond('test:request', responder1);
      broker2.respond('test:request', responder2);

      const result = broker2.request('test:request', { data: 'test' }, 'first');

      expect(result).to.equal('Response 1');
      expect(responder1.calledOnce).to.be.true;
      expect(responder2.calledOnce).to.be.true;
    });

    it('should handle request with last strategy', () => {
      const responder1 = sinon.stub().returns('Response 1');
      const responder2 = sinon.stub().returns('Response 2');

      broker2.respond('test:request', responder1);
      broker2.respond('test:request', responder2);

      const result = broker2.request('test:request', { data: 'test' }, 'last');

      expect(result).to.equal('Response 2');
    });

    it('should handle request with all strategy', () => {
      const responder1 = sinon.stub().returns('Response 1');
      const responder2 = sinon.stub().returns('Response 2');

      broker2.respond('test:request', responder1);
      broker2.respond('test:request', responder2);

      const results = broker2.request('test:request', { data: 'test' }, 'all');

      expect(results).to.deep.equal(['Response 1', 'Response 2']);
    });
  });

  describe('Broker Connections', () => {
    it('should connect and disconnect brokers', () => {
      const disconnectFn = broker1.connectTo(broker2);

      expect(broker1['_connections'].has(broker2.id)).to.be.true;
      expect(broker2['_connections'].has(broker1.id)).to.be.true;

      disconnectFn();

      expect(broker1['_connections'].has(broker2.id)).to.be.false;
      expect(broker2['_connections'].has(broker1.id)).to.be.false;
    });

    it('should emit to a specific connected broker', () => {
      const listener = sinon.stub();

      broker1.connectTo(broker2);
      broker2.on('test:targeted', listener);

      const result = broker1.emitTo(broker2.id, 'test:targeted', { data: 'targeted' });

      expect(result).to.be.true;
      expect(listener.calledOnce).to.be.true;
    });

    it('should prevent connecting a broker to itself', () => {
      expect(() => broker1.connectTo(broker1)).to.throw('Cannot connect a broker to itself');
    });
  });

  describe('Event Options', () => {
    it('should support queueing events', (done) => {
      const listener = sinon.stub().returns(true);

      // No listeners initially
      broker1.emit('test:queued', { data: 'queued' }, { queue: true });

      // Add listener later
      setTimeout(() => {
        broker1.on('test:queued', listener, { queue: true });

        // Give some time for potential processing
        setTimeout(() => {
          expect(listener.calledOnce).to.be.true;
          done();
        }, 50);
      }, 50);
    });
  });
});
