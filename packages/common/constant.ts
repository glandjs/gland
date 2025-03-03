export const FILTER_EXCEPTIONS = 'exception:filter';

export const encodeURI = (value: unknown) => encodeURIComponent(String(value));
export const decodeURI = (value: string): string => decodeURIComponent(value);

export const MAXIMUM_CACHE_SIZE = 1_000;

export const PATH_METADATA = 'path';
export const METHOD_METADATA = 'method';

export const MODULE_METADATA = '__module__';
export const EVENT_NAMESPACE = 'event:namespace';
