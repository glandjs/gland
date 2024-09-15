import { expect } from 'chai';
import { describe, it } from 'mocha';
import { METHODS } from 'http';
import { ServerUtils } from '../../../lib/helper';
import { Gland, MidsFn } from '../../../lib/types';

describe('ServerUtils', () => {
  describe('getMethod()', () => {
    it('should return a lower-cased array of HTTP methods', () => {
      const result = ServerUtils.getMethod();
      const expected = METHODS.map((method) => method.toLowerCase());
      expect(result).to.deep.equal(expected);
    });

    it('should return an empty array if METHODS is empty', () => {
      const methodsBackup = [...METHODS]; // Backup original METHODS
      (METHODS as any) = []; // Empty METHODS for testing

      const result = ServerUtils.getMethod();
      expect(result).to.be.an('array').that.is.empty;

      METHODS.splice(0, METHODS.length, ...methodsBackup); // Restore METHODS
    });
  });

  describe('Tools', () => {
    describe('logMsg()', () => {
      it('should return correct message when path is provided', () => {
        const opts: Gland.ListenOptions = {
          path: '/test-path',
        };
        const result = ServerUtils.Tools['logMsg'](opts);
        expect(result).to.equal('Server is running at /test-path');
      });

      it('should return correct message when host and port are provided', () => {
        const opts: Gland.ListenOptions = {
          host: 'localhost',
          port: 3000,
        };
        const result = ServerUtils.Tools['logMsg'](opts);
        expect(result).to.equal('Server is running at http://localhost:3000');
      });
    });

    describe('listener()', () => {
      it('should call the listeningListener with options', () => {
        let called = false;
        const opts: Gland.ListenOptions = {
          host: 'localhost',
          port: 3000,
        };
        const listener = ServerUtils.Tools.listener(opts, () => {
          called = true;
        });

        listener();
        expect(called).to.be.true;
      });

      it('should not throw an error if no listeningListener is provided', () => {
        const opts: Gland.ListenOptions = {
          host: 'localhost',
          port: 3000,
        };
        const listener = ServerUtils.Tools.listener(opts);

        expect(() => listener()).to.not.throw();
      });
    });

    describe('log()', () => {
      it('should log correct message', () => {
        const originalLog = console.log;
        let loggedMessage = '';
        console.log = (message: string) => {
          loggedMessage = message;
        };

        const opts: Gland.ListenOptions = {
          host: 'localhost',
          port: 3000,
        };
        ServerUtils.Tools.log(opts);

        expect(loggedMessage).to.include('Server is running at http://localhost:3000');
        console.log = originalLog;
      });
    });
  });

  describe('normalize()', () => {
    it('should return an array if middleware is an array', () => {
      const middleware: MidsFn[] = [() => {}, () => {}];
      const result = ServerUtils.normalize(middleware);
      expect(result).to.deep.equal(middleware);
    });

    it('should return an array containing the middleware if it is not an array', () => {
      const middleware: MidsFn = () => {};
      const result = ServerUtils.normalize(middleware);
      expect(result).to.deep.equal([middleware]);
    });
  });
});
