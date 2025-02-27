export interface BodyParser {
  /**
   * Body size limit in bytes
   * @default 1mb Default 1MB
   */
  limit: number;

  /**
   * Encoding for parsing the request body
   * @default 'utf-8'
   */
  encoding?: string;

  /**
   * JSON parsing options
   */
  json?: {
    /**
     * Only parse objects and arrays
     * @default true
     */
    strict?: boolean;

    /**
     * Function to be used by JSON.parse
     */
    reviver?: (key: string, value: any) => any;
  };

  /**
   * URL-encoded parsing options
   */
  urlencoded?: {
    /**
     * Parse extended syntax with the qs module
     * @default true
     */
    extended?: boolean;
  };
}
