export enum EventPhase {
  PRE = 'pre',

  MAIN = 'main',

  POST = 'post',

  ERROR = 'error',

  ROLLBACK = 'rollback',

  FALLBACK = 'fallback',

  RETRY = 'retry',

  AUDIT = 'audit',

  NOTIFY = 'notify',

  VALIDATION = 'validation',
}
