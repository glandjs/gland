export class BodyParserError extends Error {
  public status: number;
  public type: string;

  constructor(message: string, status: number, type: string) {
    super(message);
    this.name = 'BodyParserError';
    this.status = status;
    this.type = type;
    Object.setPrototypeOf(this, BodyParserError.prototype);
  }

  static contentLengthExceeded(limit: number): BodyParserError {
    return new BodyParserError(`Request entity too large. Limit is ${limit} bytes.`, 413, 'entity.too.large');
  }

  static invalidJSON(): BodyParserError {
    return new BodyParserError('Invalid JSON. Could not parse JSON data.', 400, 'invalid.json');
  }

  static invalidURLEncoded(): BodyParserError {
    return new BodyParserError('Invalid URL encoded data. Could not parse form data.', 400, 'invalid.form');
  }

  static parameterLimitExceeded(limit: number): BodyParserError {
    return new BodyParserError(`Too many parameters. Limit is ${limit} parameters.`, 413, 'parameters.too.many');
  }

  static requestAborted(): BodyParserError {
    return new BodyParserError('Request aborted by client', 400, 'request.aborted');
  }
}
