export type ParsedBody = {
  body: Record<string, any> | string | undefined | { [key: string]: any } | null;
  bodyRaw: Buffer | undefined;
  bodySize: number | string;
};
