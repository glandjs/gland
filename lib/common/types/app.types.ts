export type ParsedBody = {
  body: Record<string, any> | { [key: string]: any } | null;
  bodyRaw: Buffer | null;
  bodySize: number | string;
};
