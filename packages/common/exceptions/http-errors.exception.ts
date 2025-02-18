import { HttpStatus } from '../enums';
import { HttpException } from './http.exception';

// 4xx Client Errors
export class BadRequestException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.BAD_REQUEST, { detail, extensions });
  }
}

export class UnauthorizedException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.UNAUTHORIZED, { detail, extensions });
  }
}

export class PaymentRequiredException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.PAYMENT_REQUIRED, { detail, extensions });
  }
}

export class ForbiddenException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.FORBIDDEN, { detail, extensions });
  }
}

export class NotFoundException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.NOT_FOUND, { detail, extensions });
  }
}

export class MethodNotAllowedException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.METHOD_NOT_ALLOWED, { detail, extensions });
  }
}

export class NotAcceptableException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.NOT_ACCEPTABLE, { detail, extensions });
  }
}

export class ProxyAuthenticationRequiredException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.PROXY_AUTHENTICATION_REQUIRED, { detail, extensions });
  }
}

export class RequestTimeoutException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.REQUEST_TIMEOUT, { detail, extensions });
  }
}

export class ConflictException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.CONFLICT, { detail, extensions });
  }
}

export class GoneException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.GONE, { detail, extensions });
  }
}

export class LengthRequiredException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.LENGTH_REQUIRED, { detail, extensions });
  }
}

export class PreconditionFailedException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.PRECONDITION_FAILED, { detail, extensions });
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.PAYLOAD_TOO_LARGE, { detail, extensions });
  }
}

export class UriTooLongException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.URI_TOO_LONG, { detail, extensions });
  }
}

export class UnsupportedMediaTypeException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.UNSUPPORTED_MEDIA_TYPE, { detail, extensions });
  }
}

export class RangeNotSatisfiableException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE, { detail, extensions });
  }
}

export class ExpectationFailedException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.EXPECTATION_FAILED, { detail, extensions });
  }
}

export class ImATeapotException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.I_AM_A_TEAPOT, { detail, extensions });
  }
}

export class MisdirectedException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.MISDIRECTED, { detail, extensions });
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.UNPROCESSABLE_ENTITY, { detail, extensions });
  }
}

export class FailedDependencyException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.FAILED_DEPENDENCY, { detail, extensions });
  }
}

export class PreconditionRequiredException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.PRECONDITION_REQUIRED, { detail, extensions });
  }
}

export class TooManyRequestsException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.TOO_MANY_REQUESTS, { detail, extensions });
  }
}

// 5xx Server Errors
export class InternalServerErrorException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, { detail, extensions });
  }
}

export class NotImplementedException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.NOT_IMPLEMENTED, { detail, extensions });
  }
}

export class BadGatewayException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.BAD_GATEWAY, { detail, extensions });
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.SERVICE_UNAVAILABLE, { detail, extensions });
  }
}

export class GatewayTimeoutException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.GATEWAY_TIMEOUT, { detail, extensions });
  }
}

export class HttpVersionNotSupportedException extends HttpException {
  constructor(detail?: string, extensions?: Record<string, unknown>) {
    super(HttpStatus.HTTP_VERSION_NOT_SUPPORTED, { detail, extensions });
  }
}