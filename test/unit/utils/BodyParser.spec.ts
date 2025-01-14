import { afterEach, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';
import { expect } from 'chai';
import { IncomingMessage } from 'http';
import { BodyParser } from '../../../lib/utils/BodyParser';

describe('Body Parser', () => {
  let request: sinon.SinonStubbedInstance<IncomingMessage>;
  let bodyParser: BodyParser;
  let onStub: sinon.SinonStub;

  beforeEach(() => {
    request = sinon.createStubInstance(IncomingMessage);
    onStub = sinon.stub();
    request.on = onStub as any;
    bodyParser = new BodyParser(request, { encoding: 'utf-8', limit: 50 });
  });

  afterEach(() => {
    sinon.restore();
  });
  const simulateRequest = (body: Buffer, contentType: string) => {
    request.headers['content-type'] = contentType;
    onStub.callsFake((event, callback) => {
      if (event === 'data') callback(body);
      if (event === 'end') callback();
      return request;
    });
  };
  describe('JSON Parsing', () => {
    it('should parse JSON body correctly', async () => {
      const body = JSON.stringify({ key: 'value' });
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'application/json');

      const result = await bodyParser.parse();

      expect(result.body).to.deep.equal({ key: 'value' });
      expect(result.bodySize).to.equal(buffer.length);
      expect(result.bodyRaw.toString('utf-8')).to.equal(body);
    });
    it('should throw an error for malformed JSON', async () => {
      const body = '{"key": "value"';
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'application/json');
      try {
        await bodyParser.parse();
      } catch (error: any) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('Error parsing body');
      }
    });
  });
  describe('URL-encoded Parsing', () => {
    it('should parse valid URL-encoded body', async () => {
      const body = 'key1=value1&key2=value2';
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'application/x-www-form-urlencoded');
      const result = await bodyParser.parse();
      expect(result.body).to.deep.equal({ key1: 'value1', key2: 'value2' });
      expect(result.bodySize).to.equal(buffer.length);
    });

    it('should handle empty URL-encoded body gracefully', async () => {
      const body = '';
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'application/x-www-form-urlencoded');
      const result = await bodyParser.parse();
      expect(result.body).to.deep.equal({});
      expect(result.bodySize).to.equal(buffer.length);
    });
  });
  describe('Plain Text Parsing', () => {
    it('should parse plain text body correctly', async () => {
      const body = 'Hello, world!';
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'text/plain');
      const result = await bodyParser.parse();
      expect(result.body).to.equal(body);
      expect(result.bodySize).to.equal(buffer.length);
    });

    it('should handle long plain text body', async () => {
      const body = 'a'.repeat(45);
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'text/plain');

      const result = await bodyParser.parse();
      expect(result.body).to.equal(body);
      expect(result.bodySize).to.equal(buffer.length);
    });
  });
  describe('html Parsing', () => {
    it('should parse HTML body correctly', async () => {
      const body = '<html><body>Hello</body></html>';
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'text/html');

      const result = await bodyParser.parse();

      expect(result.body).to.equal(body);
      expect(result.bodySize).to.equal(buffer.length);
    });
  });
  describe('Binary Data Parsing', () => {
    it('should parse binary data for images', async () => {
      const body = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
      simulateRequest(body, 'image/jpeg');
      const result = await bodyParser.parse();
      expect(result.bodyRaw).to.deep.equal(body);
      expect(result.bodySize).to.equal(body.length);
    });
    it('should handle binary data (image/jpeg) correctly', async () => {
      const body = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header
      simulateRequest(body, 'image/jpeg');

      const result = await bodyParser.parse();

      expect(result.body).to.deep.equal(body);
      expect(result.bodyRaw).to.deep.equal(body);
      expect(result.bodySize).to.equal(body.length);
    });
  });
  describe('Error Handling', () => {
    it('should handle request stream errors', async () => {
      onStub.callsFake((event, callback) => {
        if (event === 'error') callback(new Error('Stream error'));
        return request;
      });

      try {
        await bodyParser.parse();
      } catch (error: any) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Request error: Stream error');
      }
    });
    it('should handle unsupported content type gracefully', async () => {
      const body = '<unsupported>data</unsupported>';
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'application/unsupported');

      const result = await bodyParser.parse();

      expect(result.body).to.equal(body);
      expect(result.bodySize).to.equal(buffer.length);
    });

    it('should handle empty body correctly', async () => {
      const buffer = Buffer.from('', 'utf-8');
      simulateRequest(buffer, 'text/plain');

      const result = await bodyParser.parse();

      expect(result.body).to.equal('');
      expect(result.bodySize).to.equal(0);
    });

    it('should reject if body exceeds limit', async () => {
      const body = 'a'.repeat(2048); // 2KB
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'text/plain');

      try {
        await bodyParser.parse();
      } catch (error: any) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Body size exceeds the limit of 50 bytes');
      }
    });

    it('should reject invalid JSON body gracefully', async () => {
      const body = '{ invalid json }';
      const buffer = Buffer.from(body, 'utf-8');
      simulateRequest(buffer, 'application/json');

      try {
        await bodyParser.parse();
      } catch (error: any) {
        expect(error).to.be.an('error');
        expect(error.message).to.contain('Error parsing body');
      }
    });
  });
});
