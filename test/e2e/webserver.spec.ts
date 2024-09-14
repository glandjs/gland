import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import http, { Server } from 'http';
import { WebServer } from '../../lib/core/server';
import { Context, NxtFunction } from '../../lib/types';

function start(server: WebServer, port: number, url: string) {
  return new Promise((resolve, reject) => {
    server.use(url, async (ctx: Context, next: NxtFunction) => {
      ctx.write('Middleware OK\n');
      await next(); 
    });
    server.all(url, async (ctx) => {
      ctx.write(JSON.stringify({ message: 'Route OK' }));
      ctx.end();
    });

    server.init(port, 'localhost', () => {
      resolve(null);
    });
  });
}

describe('WebServer E2E Test', function () {
  this.timeout(5000);
  let server: WebServer;
  let port: number = 3000;

  beforeEach(() => {
    server = new WebServer();
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should handle middleware and return expected response', (done) => {
    start(server, port, '/middleware-test');
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/middleware-test',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        expect(res.statusCode).to.equal(200);
        expect(data.split('\n')[0]).to.equal('Middleware OK');
        done();
      });
    });

    req.on('error', (e) => {
      done(e);
    });

    req.end();
  });

  it('should handle routes and return JSON response after middleware', (done) => {
    start(server, port, '/route-test').then(() => {
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/route-test',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          expect(res.statusCode).to.equal(200);
          const parsedResponse = JSON.parse(data.split('\n')[1]); 
          expect(parsedResponse).to.deep.equal({ message: 'Route OK' });
          done();
        });
      });

      req.on('error', (e) => {
        done(e);
      });

      req.end();
    });
  });
});
