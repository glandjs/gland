export interface EventChannel<D, R> {
  emit<T>(data: T);
  request(data: D);
  respond(handler: (data: D) => Promise<R> | R): () => void;
}
