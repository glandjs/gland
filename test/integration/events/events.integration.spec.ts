import { EventPhase, EventType } from '@gland/common';
import { Emit, Emits, Event, EventManager, EventRegistry, Listen, On } from '@gland/events';
import { EVENTS_METADATA } from '@gland/events/constant';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon, { SinonSpy } from 'sinon';
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

      const off = eventManager.on('app:ready', spy);
      await eventManager.emit('app:ready', eventData);

      expect(spy.calledOnce).to.be.true;
      expect(spy.firstCall.args[0].data).to.deep.equal(eventData);
      off();
    });

    it('should handle event unsubscription', async () => {
      const spy = sandbox.spy();
      const off = eventManager.on('server:start', spy);

      off();
      await eventManager.emit('server:start', {});

      expect(spy.notCalled).to.be.true;
    });
    describe('request() Method', () => {
      it('should handle successful request/response', async () => {
        eventManager.on('user:get', async (event) => {
          return {
            id: event.data.id,
            name: 'John Doe',
          };
        });

        const testId = crypto.randomUUID();
        const response = await eventManager.request('user:get', { id: testId });

        expect(response).to.deep.equal({
          id: testId,
          name: 'John Doe',
        });
      });
      it('should merge request and response data', async () => {
        eventManager.on('user:enhance', async (event) => {
          return {
            ...event.data,
            enhanced: true,
            timestamp: Date.now(),
          };
        });

        const requestData = { id: '123', action: 'create' };
        const response = await eventManager.request('user:enhance', requestData);

        expect(response).to.have.keys(['id', 'action', 'enhanced', 'timestamp']);

        expect(response.id).to.equal('123');
        expect(response.action).to.equal('create');
        expect(response.enhanced).to.be.true;

        expect(response.timestamp).to.be.a('number');
      });

      it('should handle multiple concurrent requests', async () => {
        eventManager.on('concurrent:test', async (event) => {
          return { requestId: event.data.id };
        });

        const requests = Promise.all([eventManager.request('concurrent:test', { id: 1 }), eventManager.request('concurrent:test', { id: 2 }), eventManager.request('concurrent:test', { id: 3 })]);

        const responses = await requests;
        expect(responses).to.deep.equal([{ requestId: 1 }, { requestId: 2 }, { requestId: 3 }]);
      });
    });

    describe('channel() Method', () => {
      it('should establish bidirectional communication', async () => {
        const channel = eventManager.channel('user:create');
        channel.respond(async (data) => {
          return { success: true, userId: data.userId };
        });

        const response = await channel.request({ userId: '123' });

        expect(response).to.deep.equal({ success: true, userId: '123' });
      });

      it('should handle channel errors', async () => {
        // Setup error channel
        const channel = eventManager.channel('error:channel');
        channel.respond(async () => {
          throw new Error('Channel error');
        });

        // Make request
        await channel.request({});
        eventManager.on('error:channel:error', (event) => {
          expect(event.data.error.message).to.deep.equal('Channel error');
        });
      });

      it('should support multiple channels', async () => {
        // Setup multiple channels
        const userChannel = eventManager.channel('user:operations');
        const authChannel = eventManager.channel('auth:operations');

        userChannel.respond(async (data) => ({ userId: data.id, operation: 'user' }));
        authChannel.respond(async (data) => ({ userId: data.id, operation: 'auth' }));

        // Make requests
        const [userResponse, authResponse] = await Promise.all([userChannel.request({ id: '123' }), authChannel.request({ id: '456' })]);

        // Verify responses
        expect(userResponse).to.deep.equal({ userId: '123', operation: 'user' });
        expect(authResponse).to.deep.equal({ userId: '456', operation: 'auth' });
      });
    });

    describe('Integration: Request + Channel', () => {
      it('should handle complex request/channel workflows', async () => {
        // Setup user service channel
        const userChannel = eventManager.channel('user:service');
        userChannel.respond(async (data) => {
          if (data.action === 'create') {
            return { id: '123', name: data.name };
          }
          throw new Error('Invalid action');
        });

        // Setup auth service channel
        const authChannel = eventManager.channel('auth:service');
        authChannel.respond(async (data) => {
          return { token: `token-for-${data.userId}` };
        });

        // Test workflow
        const user = await userChannel.request({ action: 'create', name: 'John' });
        const auth = await authChannel.request({ userId: user.id });

        expect(user).to.deep.equal({ id: '123', name: 'John' });
        expect(auth).to.deep.equal({ token: 'token-for-123' });
      });

      it('should handle error propagation across channels', async () => {
        const userChannel = eventManager.channel('user');
        userChannel.respond(async () => {
          throw new Error('User service error');
        });

        const authChannel = eventManager.channel('auth');
        authChannel.respond(async () => {
          throw new Error('Auth service error');
        });

        await Promise.all([userChannel.request({}), authChannel.request({})]);
        eventManager.on('auth:error', (event) => {
          expect(event.data.error.message).to.equal('User service error');
        });
        eventManager.on('user:error', (event) => {
          expect(event.data.error.message).to.equal('User service error');
        });
      });
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
            eventManager.on(`${EventType.REQUEST_START}:${phase}`, async (event) => {
              spies[i]();
              callOrder.push(phase);
              await new Promise((res) => setTimeout(res, 20 * (phases.length - i)));
              resolve();
            });
          }),
      );

      await eventManager.emit(EventType.REQUEST_START, { id: 1 });

      await Promise.all(phasePromises);

      spies.forEach((spy, i) => {
        expect(spy.calledOnce, `Phase ${phases[i]} not called`).to.be.true;
      });

      expect(callOrder).to.deep.equal(phases);
    });

    it('should handle error phase transition', async () => {
      const errorSpy = sandbox.spy();
      eventManager.on('route:matched:error', errorSpy);
      await eventManager.emit('route:matched', {});
      expect(errorSpy.calledOnce).to.be.true;
    });
    it('should execute retry logic', async () => {
      let attempt = 0;
      const retrySpy = sandbox.spy();
      eventManager.on('server:restart:retry', () => {
        ++attempt;
        retrySpy();
      });
      eventManager.on('server:restart:main', () => {
        ++attempt;
      });
      await eventManager.emit('server:restart', {});
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
            @On('server:start')
            handleServerStart(event: Event) {
              called = true;
              expect(event.data).to.deep.equal({ port: 3000 });
            }
          }
          await eventManager.emit('server:start', { port: 3000 });
          expect(called).to.be.true;
        });
        it('should handle async methods', async () => {
          let called = false;
          class TestController {
            @On('server:start')
            async handleServerStart(event: Event) {
              // simulate asynchronous processing
              await new Promise((resolve) => setTimeout(resolve, 10));
              called = true;
              expect(event.data).to.deep.equal({ port: 3000 });
            }
          }
          await eventManager.emit('server:start', { port: 3000 });
          expect(called).to.be.true;
        });
        it('should transform event with the transform option', async () => {
          let transformedCalled = false;
          class TestController {
            @On('server:start', {
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
          await eventManager.emit('server:start', { port: 3000 });
          expect(transformedCalled).to.be.true;
        });
        it('should retry method if it fails and succeed after a retry', async () => {
          let callCount = 0;
          class TestController {
            @On('server:start', {
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
          await eventManager.emit('server:start', { port: 3000 });
          expect(callCount).to.deep.equal(6);
        });
        it('should register method as event handler', async () => {
          class TestController {
            @On('server:start')
            handleServerStart(event: Event) {
              expect(event.data).to.deep.equal({ port: 3000 });
            }
          }
          await eventManager.emit('server:start', { port: 3000 });
        });
        it('should handle async methods', async () => {
          class TestController {
            @On('server:start')
            async handleServerStart(event: Event) {
              await new Promise((resolve) => setTimeout(resolve, 10));
              console.log('Server started:', event.data);
              expect(event.data).to.deep.equal({ port: 3000 });
            }
          }
          await eventManager.emit('server:start', { port: 3000 });
        });
        it('@On should register event handlers', async () => {
          class TestController {
            @On('websocket:message')
            handleMessage(event: Event) {
              expect(event.phase).to.deep.equal('main');
            }
          }
          await eventManager.emit('websocket:message', {});
        });
      });

      describe('Class Decorator', () => {
        it('should register all methods with @On decorator', async () => {
          @Listen('request:start')
          class RequestHandler {
            @On('request:error', {})
            RequestError(event: Event) {
              expect(event.data).to.deep.equal({ req: { remove: { address: 1 } } });
            }

            @On('request:end')
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
          await eventManager.emit('request:start', { request: 'start' });
          await eventManager.emit('request:error', { req: { remove: { address: 1 } } });
          await eventManager.emit('request:end', { id: 'txn-123' });
        });

        it('should handle class-level phase-specific events', async () => {
          @Listen('request:start:pre')
          class RequestHandlers {
            @On('request:start:validation')
            validateRequest(event: Event) {
              expect(event.data).to.deep.equal({ headers: {} });
            }
          }
          await eventManager.emit('request:start:validation', { headers: {} });
        });
      });

      describe('Edge Cases', () => {
        it('should handle duplicate event registrations', async () => {
          class TestController {
            @On('server:start')
            @On('server:start') // Duplicate
            handleServerStart(event: Event) {
              console.log('Server started:', event.data);
            }
          }

          await eventManager.emit('server:start', { port: 3000 });
        });

        it('should throw error if EventManager not initialized', () => {
          // Simulate missing EventManager
          Reflect.deleteMetadata(EVENTS_METADATA.EVENT_MANAGER, EventManager);

          expect(() => {
            class TestController {
              @On('server:start')
              handleServerStart() {}
            }
          }).to.throw('EventManager must be initialized before using @OnEvent decorator');
        });
      });
    });
    describe('@Emit Decorator', () => {
      describe('@Emit', () => {
        let publishSpy: SinonSpy;

        beforeEach(() => {
          sandbox = sinon.createSandbox();
          publishSpy = sandbox.spy(eventManager, 'emit');
          Reflect.defineMetadata('event:manager', eventManager, EventManager);
        });

        afterEach(() => {
          sandbox.restore();
        });

        it('should emit event with method return value', async () => {
          class UserService {
            @Emit('user:created')
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

            @Emit('payment:processed', {
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
            @Emit('order:created', {
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
          publishSpy = sandbox.spy(eventManager, 'emit');
          Reflect.defineMetadata('event:manager', eventManager, EventManager);
        });

        afterEach(() => {
          sandbox.restore();
        });
        it('should emit events for all class methods', async () => {
          @Emits('user:activity')
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
          @Emits('data:operation')
          class DataService {
            async processData(input: number) {
              return input * 2;
            }
          }
          class DatabaseOn {
            @On('data:operation')
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
          publishSpy = sandbox.spy(eventManager, 'emit');
          Reflect.defineMetadata('event:manager', eventManager, EventManager);
        });

        afterEach(() => {
          sandbox.restore();
        });
        it('should maintain proper execution context', async () => {
          class ContextService {
            private count = 0;

            @Emit('counter:updated')
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
        const emitSpy = sandbox.spy(eventManager, 'emit');

        class TestService {
          @Emit('response:end')
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

      eventManager.on('app:bootstrap', spy1);
      eventManager.on('app:bootstrap', spy2);

      await eventManager.emit('app:bootstrap', {});

      expect(spy1.calledBefore(spy2)).to.be.true;
    });

    it('should process queue strategy in order', async () => {
      const eventManager = new EventManager('queue');

      const order: number[] = [];
      const durations = [50, 30, 70];

      durations.forEach((ms, i) => {
        eventManager.on(EventType.WEBSOCKET_MESSAGE, async () => {
          await new Promise((resolve) => setTimeout(resolve, ms));
          order.push(i);
        });
      });

      await eventManager.emit(EventType.WEBSOCKET_MESSAGE, {});

      expect(order).to.deep.equal([0, 1, 2]);
    });
  });
});
