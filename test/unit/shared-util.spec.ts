import { expect } from 'chai';
import { ChannelRegistryBuilder, buildChannelEventName, buildPublicEventName, combineRoutePath, isDynamicModule, normalizePath } from '@glandjs/common';

describe('common/utils/shared', () => {
  describe('normalizePath', () => {
    const cases: Array<[string | undefined, string]> = [
      [undefined, '/'],
      ['', '/'],
      ['/', '/'],
      ['products', '/products'],
      ['/products', '/products'],
      ['products/', '/products'],
      ['/products/', '/products'],
      // The previous implementation only collapsed duplicate slashes on the
      // absolute branch, so these are the regression cases.
      ['api//v1//', '/api/v1'],
      ['/api//v1//', '/api/v1'],
      ['a///b', '/a/b'],
      ['/a///b/', '/a/b'],
    ];

    for (const [input, expected] of cases) {
      it(`normalizes ${JSON.stringify(input)} to "${expected}"`, () => {
        expect(normalizePath(input)).to.equal(expected);
      });
    }

    it('is idempotent', () => {
      for (const [input] of cases) {
        expect(normalizePath(normalizePath(input))).to.equal(normalizePath(input));
      }
    });
  });

  describe('combineRoutePath', () => {
    const cases: Array<[string | undefined, string | undefined, string]> = [
      ['/products', ':id', '/products/:id'],
      ['products', ':id', '/products/:id'],
      ['/products/', '/:id', '/products/:id'],
      ['/products', '/', '/products'],
      ['/', '/', '/'],
      ['/', '/health', '/health'],
      [undefined, '/health', '/health'],
      ['/api/v1', '/', '/api/v1'],
    ];

    for (const [base, handler, expected] of cases) {
      it(`combines ${JSON.stringify(base)} + ${JSON.stringify(handler)} into "${expected}"`, () => {
        expect(combineRoutePath(base, handler)).to.equal(expected);
      });
    }
  });

  describe('channel event names', () => {
    it('builds a namespaced broker event', () => {
      expect(buildChannelEventName('db', 'product:create')).to.equal('gland:define:channel:db:product:create');
    });

    it('omits the namespace segment when there is no namespace', () => {
      expect(buildChannelEventName('', 'ping')).to.equal('gland:define:channel:ping');
      expect(buildChannelEventName(undefined, 'ping')).to.equal('gland:define:channel:ping');
    });

    it('never leaks the string "undefined" into an event name', () => {
      expect(buildChannelEventName(undefined, 'ping')).not.to.contain('undefined');
      expect(buildChannelEventName('', 'ping')).not.to.contain('undefined');
      expect(buildPublicEventName(undefined, 'ping')).not.to.contain('undefined');
    });

    it('builds the public name applications address', () => {
      expect(buildPublicEventName('db', 'product:create')).to.equal('db:product:create');
      expect(buildPublicEventName('', 'ping')).to.equal('ping');
    });
  });

  describe('ChannelRegistryBuilder', () => {
    it('maps public names to broker events', () => {
      const builder = new ChannelRegistryBuilder();
      builder.add('db', 'product:create', 'Database');
      builder.add('db', 'product:find', 'Database');

      const registry = builder.freeze();
      expect(registry['db:product:create']).to.equal('gland:define:channel:db:product:create');
      expect(registry['db:product:find']).to.equal('gland:define:channel:db:product:find');
    });

    it('keeps same-suffix events in different namespaces unambiguous', () => {
      // The regression this design exists to prevent: resolution used to
      // compare only the segment after the first colon, so `db:create` and
      // `cache:create` were indistinguishable and whichever channel was
      // discovered first silently answered for both.
      const builder = new ChannelRegistryBuilder();
      builder.add('db', 'create', 'Database');
      builder.add('cache', 'create', 'Cache');

      const registry = builder.freeze();
      expect(registry['db:create']).to.equal('gland:define:channel:db:create');
      expect(registry['cache:create']).to.equal('gland:define:channel:cache:create');
      expect(builder.all()).to.have.lengthOf(2);
    });

    it('rejects a genuinely duplicated public name', () => {
      const builder = new ChannelRegistryBuilder();
      builder.add('db', 'create', 'Database');

      expect(() => builder.add('db', 'create', 'OtherDatabase')).to.throw(/Duplicate channel event "db:create"/);
    });

    it('rejects a duplicate even when the owners are the same class', () => {
      const builder = new ChannelRegistryBuilder();
      builder.add('', 'ping', 'Health');
      expect(() => builder.add('', 'ping', 'Health')).to.throw(/Duplicate channel event "ping"/);
    });

    it('names both owners in the duplicate error', () => {
      const builder = new ChannelRegistryBuilder();
      builder.add('db', 'create', 'Database');
      try {
        builder.add('db', 'create', 'Cache');
        expect.fail('should have thrown');
      } catch (error) {
        expect((error as Error).message).to.contain('Database');
        expect((error as Error).message).to.contain('Cache');
      }
    });

    it('returns a frozen registry with no prototype', () => {
      const builder = new ChannelRegistryBuilder();
      builder.add('db', 'create', 'Database');
      const registry = builder.freeze();

      expect(Object.isFrozen(registry)).to.be.true;
      expect(registry['toString']).to.be.undefined;
    });
  });

  describe('isDynamicModule', () => {
    it('detects dynamic modules', () => {
      class M {}
      expect(isDynamicModule({ module: M, controllers: [] })).to.be.true;
    });

    it('rejects plain classes and nullish values', () => {
      class M {}
      expect(isDynamicModule(M)).to.be.false;
      expect(isDynamicModule(undefined)).to.be.false;
      expect(isDynamicModule(null)).to.be.false;
      expect(isDynamicModule('nope')).to.be.false;
    });
  });
});
