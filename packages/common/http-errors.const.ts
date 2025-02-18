import { HttpStatus } from './enums';

/**
 * @publicApi
 */
export const HTTP_ERRORS = {
  // 1xx Informational
  CONTINUE: {
    status: HttpStatus.CONTINUE,
    message: 'Continue',
    description: 'Server has received the request headers and client should proceed to send the request body',
  },
  SWITCHING_PROTOCOLS: {
    status: HttpStatus.SWITCHING_PROTOCOLS,
    message: 'Switching Protocols',
    description: 'Server is switching protocols as requested by the client',
  },
  PROCESSING: {
    status: HttpStatus.PROCESSING,
    message: 'Processing',
    description: 'Server has received and is processing the request, but no response is available yet',
  },
  EARLY_HINTS: {
    status: HttpStatus.EARLY_HINTS,
    message: 'Early Hints',
    description: 'Used to return some response headers before final HTTP message',
  },

  // 2xx Success
  OK: {
    status: HttpStatus.OK,
    message: 'OK',
    description: 'Standard success response for HTTP requests',
  },
  CREATED: {
    status: HttpStatus.CREATED,
    message: 'Created',
    description: 'New resource has been successfully created',
  },
  ACCEPTED: {
    status: HttpStatus.ACCEPTED,
    message: 'Accepted',
    description: 'Request has been accepted for processing, but processing is not complete',
  },
  NON_AUTHORITATIVE_INFORMATION: {
    status: HttpStatus.NON_AUTHORITATIVE_INFORMATION,
    message: 'Non-Authoritative Information',
    description: 'Returned metadata is from a transformed or third-party copy',
  },
  NO_CONTENT: {
    status: HttpStatus.NO_CONTENT,
    message: 'No Content',
    description: 'Request succeeded but no additional content to send',
  },
  RESET_CONTENT: {
    status: HttpStatus.RESET_CONTENT,
    message: 'Reset Content',
    description: 'Client should reset the document view that caused the request',
  },
  PARTIAL_CONTENT: {
    status: HttpStatus.PARTIAL_CONTENT,
    message: 'Partial Content',
    description: 'Server is delivering partial content (byte serving)',
  },

  // 3xx Redirection
  MULTIPLE_CHOICES: {
    status: HttpStatus.MULTIPLE_CHOICES,
    message: 'Multiple Choices',
    description: 'Multiple options available for the resource',
  },

  MOVED_PERMANENTLY: {
    status: HttpStatus.MOVED_PERMANENTLY,
    message: 'Moved Permanently',
    description: 'Resource has been permanently moved to a new URI',
  },
  FOUND: {
    status: HttpStatus.FOUND,
    message: 'Found',
    description: 'Resource temporarily moved to a different URI',
  },
  SEE_OTHER: {
    status: HttpStatus.SEE_OTHER,
    message: 'See Other',
    description: 'Response can be found under a different URI (GET)',
  },
  NOT_MODIFIED: {
    status: HttpStatus.NOT_MODIFIED,
    message: 'Not Modified',
    description: 'Cached content is still valid and should be used',
  },
  TEMPORARY_REDIRECT: {
    status: HttpStatus.TEMPORARY_REDIRECT,
    message: 'Temporary Redirect',
    description: 'Temporary redirection using same HTTP method',
  },
  PERMANENT_REDIRECT: {
    status: HttpStatus.PERMANENT_REDIRECT,
    message: 'Permanent Redirect',
    description: 'Permanent redirection using same HTTP method',
  },

  // 4xx Client Errors
  BAD_REQUEST: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Bad Request',
    description: 'Request contains invalid syntax or cannot be fulfilled',
  },
  UNAUTHORIZED: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Unauthorized',
    description: 'Authentication is required and has failed or not been provided',
  },
  PAYMENT_REQUIRED: {
    status: HttpStatus.PAYMENT_REQUIRED,
    message: 'Payment Required',
    description: 'Reserved for future use (original purpose deprecated)',
  },
  FORBIDDEN: {
    status: HttpStatus.FORBIDDEN,
    message: 'Forbidden',
    description: 'Server understands request but refuses to authorize it',
  },
  NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Not Found',
    description: 'Requested resource could not be found',
  },
  METHOD_NOT_ALLOWED: {
    status: HttpStatus.METHOD_NOT_ALLOWED,
    message: 'Method Not Allowed',
    description: 'Request method is not supported for the requested resource',
  },
  NOT_ACCEPTABLE: {
    status: HttpStatus.NOT_ACCEPTABLE,
    message: 'Not Acceptable',
    description: 'No content format available that matches Accept headers',
  },
  PROXY_AUTHENTICATION_REQUIRED: {
    status: HttpStatus.PROXY_AUTHENTICATION_REQUIRED,
    message: 'Proxy Authentication Required',
    description: 'Client must first authenticate with the proxy',
  },
  REQUEST_TIMEOUT: {
    status: HttpStatus.REQUEST_TIMEOUT,
    message: 'Request Timeout',
    description: 'Server timed out waiting for the request',
  },
  CONFLICT: {
    status: HttpStatus.CONFLICT,
    message: 'Conflict',
    description: 'Request conflicts with current state of the resource',
  },
  GONE: {
    status: HttpStatus.GONE,
    message: 'Gone',
    description: 'Resource is no longer available and will not be available again',
  },
  LENGTH_REQUIRED: {
    status: HttpStatus.LENGTH_REQUIRED,
    message: 'Length Required',
    description: 'Request did not specify the Content-Length header',
  },
  PRECONDITION_FAILED: {
    status: HttpStatus.PRECONDITION_FAILED,
    message: 'Precondition Failed',
    description: 'One or more request preconditions evaluated to false',
  },
  PAYLOAD_TOO_LARGE: {
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    message: 'Payload Too Large',
    description: 'Request entity exceeds server-defined limits',
  },
  URI_TOO_LONG: {
    status: HttpStatus.URI_TOO_LONG,
    message: 'URI Too Long',
    description: 'Request URI exceeds server-defined length limit',
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    message: 'Unsupported Media Type',
    description: 'Media format not supported by server for requested method',
  },
  REQUESTED_RANGE_NOT_SATISFIABLE: {
    status: HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
    message: 'Range Not Satisfiable',
    description: 'Cannot satisfy the Range request header field',
  },
  EXPECTATION_FAILED: {
    status: HttpStatus.EXPECTATION_FAILED,
    message: 'Expectation Failed',
    description: 'Expect request-header field cannot be met by the server',
  },
  I_AM_A_TEAPOT: {
    status: HttpStatus.I_AM_A_TEAPOT,
    message: "I'm a teapot",
    description: "RFC 2324 April Fools' joke status code",
  },
  MISDIRECTED: {
    status: HttpStatus.MISDIRECTED,
    message: 'Misdirected Request',
    description: 'Request was sent to a server unable to respond',
  },
  UNPROCESSABLE_ENTITY: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Unprocessable Entity',
    description: 'Request semantic errors preventing server processing',
  },
  FAILED_DEPENDENCY: {
    status: HttpStatus.FAILED_DEPENDENCY,
    message: 'Failed Dependency',
    description: 'Request failed due to failure of a previous request',
  },
  PRECONDITION_REQUIRED: {
    status: HttpStatus.PRECONDITION_REQUIRED,
    message: 'Precondition Required',
    description: 'Origin server requires the request to be conditional',
  },
  TOO_MANY_REQUESTS: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'Too Many Requests',
    description: 'Rate limit exceeded or too many requests in given timeframe',
  },

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal Server Error',
    description: 'Generic server error when no more specific message is suitable',
  },
  NOT_IMPLEMENTED: {
    status: HttpStatus.NOT_IMPLEMENTED,
    message: 'Not Implemented',
    description: 'Server does not support the functionality required',
  },
  BAD_GATEWAY: {
    status: HttpStatus.BAD_GATEWAY,
    message: 'Bad Gateway',
    description: 'Invalid response received from upstream server',
  },
  SERVICE_UNAVAILABLE: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'Service Unavailable',
    description: 'Server is temporarily unavailable (overloaded or maintenance)',
  },
  HTTP_VERSION_NOT_SUPPORTED: {
    status: HttpStatus.HTTP_VERSION_NOT_SUPPORTED,
    message: 'HTTP Version Not Supported',
    description: 'Server does not support the HTTP protocol version used',
  },
};
