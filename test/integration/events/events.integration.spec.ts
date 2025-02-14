import { EmitClass, EmitMethod, Event, EventManager, EventRegistry, OnClass, OnMethod } from '@gland/events';
import { EVENTS_METADATA } from '@gland/events/constant';
import { EventPhase, EventType } from '@gland/common';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon, { SinonSpy } from 'sinon';
import exp from 'constants';
describe('@gland/events', () => {
  let sandbox: sinon.SinonSandbox;
  let eventManager: EventManager;
  let registry: EventRegistry;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    registry = EventRegistry.getInstance();
    eventManager = new EventManager();
  });

  afterEach(() => {
    sandbox.restore();
    registry['listeners'].clear();
  });

  describe('Core Event System', () => {
    it('should handle simple event publication/subscription', async () => {
      const spy = sandbox.spy();
      const eventData = { message: 'Test message' };

      const unsubscribe = eventManager.subscribe('app:ready', spy);
      await eventManager.publish('app:ready', eventData);

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].data).to.deep.equal(eventData);
      unsubscribe();
    });

    it('should handle event unsubscription', async () => {
      const spy = sandbox.spy();
      const unsubscribe = eventManager.subscribe('server:start', spy);

      unsubscribe();
      await eventManager.publish('server:start', {});

      expect(spy.notCalled).to.be.true;
    });
  });

  describe('Complex Event Processing', () => {
    it('should handle multi-phase event processing', async () => {
      const phases = [EventPhase.VALIDATION, EventPhase.PRE, EventPhase.MAIN, EventPhase.POST, EventPhase.AUDIT];

      const spies = phases.map(() => sandbox.spy());
      const callOrder: string[] = [];

      const phasePromises = phases.map(
        (phase, i) =>
          new Promise<void>((resolve) => {
            eventManager.subscribe(`${EventType.REQUEST_START}:${phase}`, async (event) => {
              spies[i]();
              callOrder.push(phase);
              await new Promise((res) => setTimeout(res, 20 * (phases.length - i)));
              resolve();
            });
          }),
      );

      await eventManager.publish(EventType.REQUEST_START, { id: 1 });

      await Promise.all(phasePromises);

      spies.forEach((spy, i) => {
        expect(spy.calledOnce, `Phase ${phases[i]} not called`).to.be.true;
      });

      expect(callOrder).to.deep.equal(phases);
    });

    it('should handle error phase transition', async () => {
      const errorSpy = sandbox.spy();
      eventManager.subscribe('route:matched:error', errorSpy);
      await eventManager.publish('route:matched', {});
      expect(errorSpy.calledOnce).to.be.true;
    });
    it('should execute retry logic', async () => {
      let attempt = 0;
      const retrySpy = sandbox.spy();
      eventManager.subscribe('server:restart:retry', () => {
        ++attempt;
        retrySpy();
      });
      eventManager.subscribe('server:restart:main', () => {
        ++attempt;
      });
      await eventManager.publish('server:restart', {});
      expect(retrySpy.callCount).to.equal(1);
      expect(attempt).to.equal(2);
    });
  });

  describe('Decorator Integration', () => {
    describe('@On Decorator', () => {
      describe('Method Decorator', () => {
        it('should register method as event handler', async () => {
          let called = false;
          class TestController {
            @OnMethod('server:start')
            handleServerStart(event: Event) {
              called = true;
              expect(event.data).to.deep.equal({ port: 3000 });
            }
          }
          await eventManager.publish('server:start', { port: 3000 });
          expect(called).to.be.true;
        });
        it('should handle async methods', async () => {
          let called = false;
          class TestController {
            @OnMethod('server:start')
            async handleServerStart(event: Event) {
              // simulate asynchronous processing
              await new Promise((resolve) => setTimeout(resolve, 10));
              called = true;
              expect(event.data).to.deep.equal({ port: 3000 });
            }
          }
          await eventManager.publish('server:start', { port: 3000 });
          expect(called).to.be.true;
        });
        it('should transform event with the transform option', async () => {
          let transformedCalled = false;
          class TestController {
            @OnMethod('server:start', {
              transform: (event: Event) => {
                // modify the event data
                return { ...event, data: { ...event.data, transformed: true } };
              },
            })
            handleServerStart(event: Event) {
              transformedCalled = true;
              expect(event.data).to.have.property('transformed', true);
            }
          }
          new TestController();
          await eventManager.publish('server:start', { port: 3000 });
          expect(transformedCalled).to.be.true;
        });
        it('should retry method if it fails and succeed after a retry', async () => {
          let callCount = 0;
          class TestController {
            @OnMethod('server:start', {
              retry: { max: 5, delay: 10 },
            })
            async handleServerStart(event: Event) {
              callCount++;
              if (callCount <= 5) {
                throw new Error('Simulated failure');
              }
              return 'Success';
            }
          }
          await eventManager.publish('server:start', { port: 3000 });
          expect(callCount).to.deep.equal(6);
        });
        it('should register method as event handler', async () => {
          class TestController {
            @OnMethod('server:start')
            handleServerStart(event: Event) {
              expect(event.data).to.deep.equal({ port: 3000 });
            }
          }
          await eventManager.publish('server:start', { port: 3000 });
        });
        it('should handle async methods', async () => {
          class TestController {
            @OnMethod('server:start')
            async handleServerStart(event: Event) {
              await new Promise((resolve) => setTimeout(resolve, 10));
              console.log('Server started:', event.data);
              expect(event.data).to.deep.equal({ port: 3000 });
            }
          }
          await eventManager.publish('server:start', { port: 3000 });
        });
        it('@On should register event handlers', async () => {
          class TestController {
            @OnMethod('websocket:message')
            handleMessage(event: Event) {
              expect(event.phase).to.deep.equal('main');
            }
          }
          await eventManager.publish('websocket:message', {});
        });
      });

      describe('Class Decorator', () => {
        it('should register all methods with @On decorator', async () => {
          @OnClass('request:start')
          class RequestHandler {
            @OnMethod('request:error', {})
            RequestError(event: Event) {
              expect(event.data).to.deep.equal({ req: { remove: { address: 1 } } });
            }

            @OnMethod('request:end')
            RequestEnd(event: Event) {
              expect(event.data).to.deep.equal({ id: 'txn-123' });
            }

            start(event: Event) {
              expect(event.data).to.deep.equal({ request: 'start' });
            }
            end(event: Event) {
              expect(event.data).to.deep.equal({ request: 'start' });
            }
          }
          await eventManager.publish('request:start', { request: 'start' });
          await eventManager.publish('request:error', { req: { remove: { address: 1 } } });
          await eventManager.publish('request:end', { id: 'txn-123' });
        });

        it('should handle class-level phase-specific events', async () => {
          @OnClass('request:start:pre')
          class RequestHandlers {
            @OnMethod('request:start:validation')
            validateRequest(event: Event) {
              expect(event.data).to.deep.equal({ headers: {} });
            }
          }
          await eventManager.publish('request:start:validation', { headers: {} });
        });
      });

      describe('Edge Cases', () => {
        it('should handle duplicate event registrations', async () => {
          class TestController {
            @OnMethod('server:start')
            @OnMethod('server:start') // Duplicate
            handleServerStart(event: Event) {
              console.log('Server started:', event.data);
            }
          }

          await eventManager.publish('server:start', { port: 3000 });
        });

        it('should throw error if EventManager not initialized', () => {
          // Simulate missing EventManager
          Reflect.deleteMetadata(EVENTS_METADATA.EVENT_MANAGER, EventManager);

          expect(() => {
            class TestController {
              @OnMethod('server:start')
              handleServerStart() {}
            }
          }).to.throw('EventManager must be initialized before using @OnEvent decorator');
        });
      });
    });
    describe('@Emit Decorator', () => {
      describe('@EmitMethod', () => {
        let publishSpy: SinonSpy;

        beforeEach(() => {
          sandbox = sinon.createSandbox();
          publishSpy = sandbox.spy(eventManager, 'publish');
          Reflect.defineMetadata('event:manager', eventManager, EventManager);
        });

        afterEach(() => {
          sandbox.restore();
        });

        it('should emit event with method return value', async () => {
          class UserService {
            @EmitMethod('user:created')
            createUser(user: { name: string }) {
              return { ...user, id: 1 };
            }
          }

          const user = { name: 'John' };
          await new UserService().createUser(user);

          expect(publishSpy.calledWith('user:created', { id: 1, name: 'John' })).to.be.true;
        });

        it('should handle retry logic with delayed emission', async () => {
          const clock = sandbox.useFakeTimers();

          class PaymentService {
            private attempts = 0;

            @EmitMethod('payment:processed', {
              retry: { max: 3, delay: 1000 },
            })
            processPayment() {
              this.attempts++;
              if (this.attempts < 3) throw new Error('Payment failed');
              return { status: 'success' };
            }
          }

          const service = new PaymentService();
          const promise = service.processPayment();

          await clock.tickAsync(3000);
          await promise;

          expect(publishSpy.callCount).to.equal(1);
          expect(publishSpy.calledWith('payment:processed', { status: 'success' })).to.be.true;
        });

        it('should emit error event after retry exhaustion', async () => {
          class OrderService {
            @EmitMethod('order:created', {
              retry: { max: 2, delay: 500 },
            })
            createOrder() {
              throw new Error('Inventory shortage');
            }
          }

          try {
            await new OrderService().createOrder();
          } catch (error) {
            expect(
              publishSpy.calledWith(
                'order:created:error',
                sinon.match({
                  error: sinon.match.instanceOf(Error),
                  args: [],
                }),
              ),
            ).to.be.true;
          }
        });
      });

      describe('@EmitClass', () => {
        let publishSpy: SinonSpy;

        beforeEach(() => {
          sandbox = sinon.createSandbox();
          publishSpy = sandbox.spy(eventManager, 'publish');
          Reflect.defineMetadata('event:manager', eventManager, EventManager);
        });

        afterEach(() => {
          sandbox.restore();
        });
        it('should emit events for all class methods', async () => {
          @EmitClass('user:activity')
          class UserController {
            updateProfile() {
              return 'updated';
            }
            changePassword() {
              return 'changed';
            }
          }

          const controller = new UserController();
          await controller.updateProfile();
          await controller.changePassword();

          expect(publishSpy.calledTwice).to.be.true;
          expect(publishSpy.alwaysCalledWith('user:activity', sinon.match.string)).to.be.true;
        });

        it('should preserve original method behavior', async () => {
          @EmitClass('data:operation')
          class DataService {
            async processData(input: number) {
              return input * 2;
            }
          }
          class DatabaseOn {
            @OnMethod('data:operation')
            async processData(event: Event) {
              expect(await event.data).to.deep.equal(10);
            }
          }

          const service = new DataService();
          const result = await service.processData(5);
          expect(result).to.equal(10);
        });
      });

      describe('Cross-Cutting Concerns', () => {
        let publishSpy: SinonSpy;

        beforeEach(() => {
          sandbox = sinon.createSandbox();
          publishSpy = sandbox.spy(eventManager, 'publish');
          Reflect.defineMetadata('event:manager', eventManager, EventManager);
        });

        afterEach(() => {
          sandbox.restore();
        });
        it('should maintain proper execution context', async () => {
          class ContextService {
            private count = 0;

            @EmitMethod('counter:updated')
            increment() {
              return ++this.count;
            }
          }

          const service = new ContextService();
          await service.increment();
          await service.increment();

          expect(publishSpy.calledTwice).to.be.true;
          expect(publishSpy.firstCall.args[1]).to.equal(1);
          expect(publishSpy.secondCall.args[1]).to.equal(2);
        });
      });
      it('@Emit should publish events after method execution', async () => {
        const emitSpy = sandbox.spy(eventManager, 'publish');

        class TestService {
          @EmitMethod('response:end')
          response(res: any) {
            return res;
          }
        }
        const res = { id: 1, name: 'Test' };
        await new TestService().response(res);
        expect(emitSpy.calledWith('response:end', res)).to.be.true;
      });
    });
  });

  describe('Event Strategies', () => {
    it('should execute immediate strategy correctly', async () => {
      const eventManager = new EventManager('broadcast');
      const spy1 = sandbox.spy();
      const spy2 = sandbox.spy();

      eventManager.subscribe('app:bootstrap', spy1);
      eventManager.subscribe('app:bootstrap', spy2);

      await eventManager.publish('app:bootstrap', {});

      expect(spy1.calledBefore(spy2)).to.be.true;
    });

    it('should process queue strategy in order', async () => {
      const eventManager = new EventManager('queue');

      const order: number[] = [];
      const durations = [50, 30, 70];

      durations.forEach((ms, i) => {
        eventManager.subscribe(EventType.WEBSOCKET_MESSAGE, async () => {
          await new Promise((resolve) => setTimeout(resolve, ms));
          order.push(i);
        });
      });

      await eventManager.publish(EventType.WEBSOCKET_MESSAGE, {});

      expect(order).to.deep.equal([0, 1, 2]);
    });
  });
});
