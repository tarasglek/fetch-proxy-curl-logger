/**
 * Type definition for curl command logger function
 */
type CurlLogger = (curlCommandParts: string[]) => void;

/**
 * Configuration options for fetch proxy curl logger
 */
interface FetchProxyCurlLoggerOptions {
  /** Custom logger function */
  logger?: CurlLogger;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

/**
 * Creates a fetch proxy that logs curl commands for each request
 * @param {FetchProxyCurlLoggerOptions} [options] - Configuration options
 * @returns Proxied fetch function
 */
const fetchProxyCurlLogger = (
  options: FetchProxyCurlLoggerOptions = {}
): ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) => {
  const {
    logger = (parts) => console.error(parts.join(' \\\n  ')),
    fetch: customFetch = fetch
  } = options;

  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    const method = init?.method || 'GET';
    const curlCmd: string[] = [`curl -X ${method} '${url}'`];
    
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        curlCmd.push(`-H '${key}: ${value}'`);
      });
    }

    if (init?.body) {
      if (typeof init.body !== 'string') {
        throw new Error(`Body must be a string, got ${typeof init.body}`);
      }
      curlCmd.push(`-d '${init.body.replace(/'/g, "'\\''")}'`);
    }

    logger(curlCmd);
    return customFetch(input, init);
  };
};

export { fetchProxyCurlLogger };
export type { CurlLogger, FetchProxyCurlLoggerOptions };
