import { expect } from 'chai';
import { IncomingMessage } from 'http';
import { TLSSocket } from 'tls';
import { Parser } from '../Parser';

describe('Parser', function () {
  describe('URI class', function () {
    it('should correctly extract params from the URL based on the given pattern', function () {
      const urlString = 'http://example.com/user/123/profile';
      const base = 'http://example.com';
      const pattern = '/user/:id/profile';

      const uri = new Parser.URI(urlString, base, pattern);
      const params = uri.params;

      expect(params).to.have.property('id', '123');
    });

    it('should correctly extract query parameters from the URL', function () {
      const urlString = 'http://example.com/search?q=nodejs&sort=asc';
      const base = 'http://example.com';
      const pattern = '/search';

      const uri = new Parser.URI(urlString, base, pattern);
      const queries = uri.queries;

      expect(queries).to.have.property('q', 'nodejs');
      expect(queries).to.have.property('sort', 'asc');
    });

    it('should return empty params when no params are defined in the pattern', function () {
      const urlString = 'http://example.com/about';
      const base = 'http://example.com';
      const pattern = '/about';

      const uri = new Parser.URI(urlString, base, pattern);
      const params = uri.params;

      expect(params).to.be.empty;
    });

    it('should return empty queries when no query parameters exist in the URL', function () {
      const urlString = 'http://example.com/about';
      const base = 'http://example.com';
      const pattern = '/about';

      const uri = new Parser.URI(urlString, base, pattern);
      const queries = uri.queries;

      expect(queries).to.be.empty;
    });
  });

  describe('Request function', function () {
    it('should return the correct request details for HTTP', async function () {
      const mockReq = {
        url: '/about',
        method: 'GET',
        headers: {
          host: 'example.com',
        },
        socket: {},
      } as IncomingMessage;

      const result = await Parser.Request(mockReq);
      expect(result).to.have.property('protocol', 'http');
      expect(result).to.have.property('method', 'GET');
      expect(result).to.have.property('host', 'example.com');
      expect(result).to.have.property('path', '/about');
      expect(result.base).to.equal('http://example.com');
    });

    it('should return the correct request details for HTTPS', async function () {
      const mockReq = {
        url: '/secure',
        method: 'POST',
        headers: {
          host: 'secure.com',
        },
        socket: TLSSocket,
      } as any;

      const result = await Parser.Request(mockReq);
      expect(result).to.have.property('protocol', 'http');
      expect(result).to.have.property('method', 'POST');
      expect(result).to.have.property('host', 'secure.com');
      expect(result).to.have.property('path', '/secure');
      expect(result.base).to.equal('http://secure.com');
    });

    it('should throw an error if the request URL is missing', async function () {
      const mockReq = {
        headers: {
          host: 'example.com',
        },
        socket: {},
      } as IncomingMessage;

      try {
        await Parser.Request(mockReq);
      } catch (error: any) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Request URL is missing.');
      }
    });

    it('should throw an error if the request header is missing', async function () {
      const mockReq = {
        url: '/about',
        socket: {},
      } as IncomingMessage;

      try {
        await Parser.Request(mockReq);
      } catch (error: any) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Request header is missing.');
      }
    });
  });
});
