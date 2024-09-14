import { describe, it } from 'mocha';
import { expect } from 'chai';
import { performance } from 'perf_hooks';
import { WebServer } from '../../lib/core/server';
import { IncomingMessage, ServerResponse } from 'http';
import { Context, NxtFunction } from '../../lib/types';
import * as sinon from 'sinon';
describe('Web Server - Performance', () => {
  let webServer: WebServer;
  let port = 3001;

  beforeEach(() => {
    webServer = new WebServer();
  });

  afterEach((done) => {
    webServer.close(() => done());
  });
  it('should start the server within acceptable time', (done) => {
    const startTime = performance.now();
    webServer.listen(port, 'localhost', () => {
      const endTime = performance.now();
      const startupTime = endTime - startTime;
      console.log(`Server startup time: ${startupTime.toFixed(2)}ms`);
      expect(startupTime).to.be.below(500);
      done();
    });
  });
  it('should handle a large number of requests within a reasonable time frame', async () => {
    const numRequests = 1000;
    const startTime = performance.now();

    for (let i = 0; i < numRequests; i++) {
      const req = new IncomingMessage(null as any);
      const res = new ServerResponse(req);
      sinon.stub(req, 'method').value('GET');
      sinon.stub(req, 'url').value('/test');
      await webServer['lifecycle'](req, res);
    }

    const endTime = performance.now();
    const timeTaken = endTime - startTime;
    expect(timeTaken).to.be.below(5000, `Time taken: ${timeTaken}ms`);
  });

  it('should handle concurrent requests efficiently', async () => {
    const numConcurrentRequests = 100;
    const promises: Promise<void>[] = [];
    const startTime = performance.now();

    for (let i = 0; i < numConcurrentRequests; i++) {
      const req = new IncomingMessage(null as any);
      const res = new ServerResponse(req);

      sinon.stub(req, 'method').value('GET');
      sinon.stub(req, 'url').value('/concurrent-test');
      const lifecyclePromise = webServer['lifecycle'](req, res);
      promises.push(lifecyclePromise);
    }
    await Promise.all(promises);
    const endTime = performance.now();
    const timeTaken = endTime - startTime;
    expect(timeTaken).to.be.below(1000, `Concurrent request handling took too long: ${timeTaken}ms`);
  });
});
