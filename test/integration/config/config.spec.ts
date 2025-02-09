import { ConfigService } from '@gland/config/config-service';
import { Environment } from '@gland/common';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ConfigOptions } from '@gland/config/interface/config.interface';
import { defaultConfig } from '@gland/config/config.default';

describe('@gland/config Integration Tests', () => {
  describe('Default Configuration', () => {
    it('should apply default values when empty config is provided', () => {
      const configOptions: ConfigOptions = {};
      const config = defaultConfig(configOptions);

      // Core settings
      expect(config.core!.env).to.equal(Environment.DEVELOPMENT);
      expect(config.core!.trustProxy).to.exist;
      expect(config.core!.caching).to.deep.equal({ ttl: 3600000 });
      expect(config.core!.cookies).to.deep.include({
        httpOnly: true,
        maxAge: 86400 * 1000,
        path: '/',
        sameSite: 'Lax',
      });
      // Check secure flag based on NODE_ENV
      if (process.env.NODE_ENV === 'production') {
        expect(config.core!.cookies!.secure).to.be.true;
      } else {
        expect(config.core!.cookies!.secure).to.be.false;
      }
      expect(config.core!.proxy).to.be.false;
      expect(config.core!.proxyIpHeader).to.equal('X-Forwarded-For');
      expect(config.core!.proxyTrustCount).to.equal(1);
      expect(config.core!.views).to.deep.equal({
        directory: ['/views'],
        engine: {
          engine: 'ejs',
          cacheTemplates: true,
        },
      });

      // Settings
      expect(config.settings!.etag).to.equal('strong');
      expect(config.settings!.poweredBy).to.equal('Gland');
      expect(config.settings!.subdomainOffset).to.equal(2);
      expect(config.settings!.maxIpsCount).to.equal(5);
      expect(config.settings!.cors).to.deep.equal({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        exposedHeaders: ['Authorization', 'Content-Length'],
        maxAge: 86400,
        optionsSuccessStatus: 204,
        preflightContinue: false,
      });
    });
  });

  describe('Custom Configuration Overrides', () => {
    it('should override default values with user provided configuration', () => {
      const customConfig: ConfigOptions = {
        core: {
          env: Environment.PRODUCTION,
          trustProxy: 'loopback',
          caching: { ttl: 1000 },
          cookies: {
            domain: 'example.com',
            httpOnly: false,
            maxAge: 5000,
            path: '/custom',
            sameSite: 'Strict',
            secure: true,
          },
          proxy: true,
          proxyIpHeader: 'Custom-Header',
          proxyTrustCount: 3,
          views: {
            directory: ['/customViews'],
            engine: { engine: 'pug', cacheTemplates: false },
          },
        },
        settings: {
          etag: 'weak',
          poweredBy: false,
          subdomainOffset: 4,
          maxIpsCount: 10,
          cors: {
            origin: 'https://example.com',
            methods: ['GET', 'POST'],
            allowedHeaders: ['X-Custom-Header'],
            credentials: false,
            exposedHeaders: ['X-Another-Header'],
            maxAge: 3600,
            optionsSuccessStatus: 200,
            preflightContinue: true,
          },
        },
      };

      const config = defaultConfig(customConfig);

      // Core settings overrides
      expect(config.core!.env).to.equal(Environment.PRODUCTION);
      expect(config.core!.trustProxy).to.equal('loopback');
      expect(config.core!.caching).to.deep.equal({ ttl: 1000 });
      expect(config.core!.cookies).to.deep.equal({
        domain: 'example.com',
        httpOnly: false,
        maxAge: 5000,
        path: '/custom',
        sameSite: 'Strict',
        secure: true,
      });
      expect(config.core!.proxy).to.be.true;
      expect(config.core!.proxyIpHeader).to.equal('Custom-Header');
      expect(config.core!.proxyTrustCount).to.equal(3);
      expect(config.core!.views).to.deep.equal({
        directory: ['/customViews'],
        engine: { engine: 'pug', cacheTemplates: false },
      });

      // Settings overrides
      expect(config.settings!.etag).to.equal('weak');
      expect(config.settings!.poweredBy).to.equal(false);
      expect(config.settings!.subdomainOffset).to.equal(4);
      expect(config.settings!.maxIpsCount).to.equal(10);
      expect(config.settings!.cors).to.deep.equal({
        origin: 'https://example.com',
        methods: ['GET', 'POST'],
        allowedHeaders: ['X-Custom-Header'],
        credentials: false,
        exposedHeaders: ['X-Another-Header'],
        maxAge: 3600,
        optionsSuccessStatus: 200,
        preflightContinue: true,
      });
    });
  });

  describe('ConfigService Integration', () => {
    it('should expose configuration values via getters', () => {
      const customConfig: ConfigOptions = {
        core: { env: Environment.PRODUCTION, trustProxy: 'loopback' },
        settings: { etag: 'weak', subdomainOffset: 4 },
      };
      const configService = new ConfigService(customConfig);
      expect(configService.core!.env).to.equal(Environment.PRODUCTION);
      expect(configService.settings!.etag).to.equal('weak');
      expect(configService.get('env')).to.equal(Environment.PRODUCTION);
      expect(configService.get('etag')).to.equal('weak');
    });
  });

  describe('TrustProxyEvaluator Integration', () => {
    it('should trust loopback addresses when trustProxy is set to "loopback"', () => {
      const customConfig: ConfigOptions = { core: { trustProxy: 'loopback' } };
      const configService = new ConfigService(customConfig);
      const evaluator = configService.proxyEvaluator;
      expect(evaluator.isTrusted('127.0.0.1', 1)).to.be.true;
      expect(evaluator.isTrusted('::1', 1)).to.be.true;
      expect(evaluator.isTrusted('192.168.1.1', 1)).to.be.false;
    });

    it('should trust if numeric trustProxy setting is provided', () => {
      const customConfig: ConfigOptions = { core: { trustProxy: 2 } };
      const configService = new ConfigService(customConfig);
      const evaluator = configService.proxyEvaluator;
      expect(evaluator.isTrusted('any-ip', 1)).to.be.true;
      expect(evaluator.isTrusted('any-ip', 3)).to.be.false;
    });

    it('should trust based on an array of trusted IPs', () => {
      const customConfig: ConfigOptions = { core: { trustProxy: ['192.168.0.1', '10.0.0.1'] } };
      const configService = new ConfigService(customConfig);
      const evaluator = configService.proxyEvaluator;
      expect(evaluator.isTrusted('192.168.0.1', 1)).to.be.true;
      expect(evaluator.isTrusted('10.0.0.1', 1)).to.be.true;
      expect(evaluator.isTrusted('127.0.0.1', 1)).to.be.false;
    });

    it('should evaluate trust proxy using a custom function', () => {
      const customFunction = (ip: string, distance: number) => ip === '8.8.8.8' && distance <= 1;
      const customConfig: ConfigOptions = { core: { trustProxy: customFunction } };
      const configService = new ConfigService(customConfig);
      const evaluator = configService.proxyEvaluator;
      expect(evaluator.isTrusted('8.8.8.8', 1)).to.be.true;
      expect(evaluator.isTrusted('8.8.8.8', 2)).to.be.false;
      expect(evaluator.isTrusted('127.0.0.1', 1)).to.be.false;
    });
  });

  describe('CORS Configuration', () => {
    it('should use default CORS settings when none are provided', () => {
      const config = defaultConfig({});
      expect(config.settings!.cors).to.deep.equal({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        exposedHeaders: ['Authorization', 'Content-Length'],
        maxAge: 86400,
        optionsSuccessStatus: 204,
        preflightContinue: false,
      });
    });

    it('should override default CORS settings with custom values', () => {
      const customConfig: ConfigOptions = {
        settings: {
          cors: {
            origin: 'https://example.com',
            methods: ['GET', 'POST'],
            allowedHeaders: ['X-Custom-Header'],
            credentials: false,
            exposedHeaders: ['X-Another-Header'],
            maxAge: 3600,
            optionsSuccessStatus: 200,
            preflightContinue: true,
          },
        },
      };
      const config = defaultConfig(customConfig);
      expect(config.settings!.cors).to.deep.equal({
        origin: 'https://example.com',
        methods: ['GET', 'POST'],
        allowedHeaders: ['X-Custom-Header'],
        credentials: false,
        exposedHeaders: ['X-Another-Header'],
        maxAge: 3600,
        optionsSuccessStatus: 200,
        preflightContinue: true,
      });
    });
  });

  describe('Cookie and Views Configuration', () => {
    it('should use default cookie and views settings if not provided', () => {
      const config = defaultConfig({});
      expect(config.core!.cookies).to.deep.equal({
        domain: undefined,
        httpOnly: true,
        maxAge: 86400 * 1000,
        path: '/',
        sameSite: 'Lax',
        secure: process.env.NODE_ENV === 'production',
      });
      expect(config.core!.views).to.deep.equal({
        directory: ['/views'],
        engine: {
          engine: 'ejs',
          cacheTemplates: true,
        },
      });
    });

    it('should override default cookie and views settings with custom values', () => {
      const customConfig: ConfigOptions = {
        core: {
          cookies: {
            domain: 'example.com',
            httpOnly: false,
            maxAge: 5000,
            path: '/custom',
            sameSite: 'Strict',
            secure: true,
          },
          views: {
            directory: ['/customViews'],
            engine: {
              engine: 'pug',
              cacheTemplates: false,
            },
          },
        },
      };
      const config = defaultConfig(customConfig);
      expect(config.core!.cookies).to.deep.equal({
        domain: 'example.com',
        httpOnly: false,
        maxAge: 5000,
        path: '/custom',
        sameSite: 'Strict',
        secure: true,
      });
      expect(config.core!.views).to.deep.equal({
        directory: ['/customViews'],
        engine: {
          engine: 'pug',
          cacheTemplates: false,
        },
      });
    });
  });
});
