/**
 * Type definition for curl command logger function
 */
const DATA_FLAG = "-d '";
const CONTENT_LENGTH_HEADER = "-H 'Content-Length:";

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
      curlCmd.push(`${DATA_FLAG}${init.body.replace(/'/g, "'\\''")}'`);
    }

    logger(curlCmd);
    return customFetch(input, init);
  };
};

export { fetchProxyCurlLogger };
export type { CurlLogger, FetchProxyCurlLoggerOptions };

/**
 * Sample logger that pretty prints JSON bodies and headers while removing Content-Length
 */
export const prettyJsonLogger: CurlLogger = (curlCommandParts: string[]) => {
  let hasJsonBody = false;

  // First pass - detect and format JSON, detect if we have JSON content
  const jsonFormattedParts = curlCommandParts.map(part => {
    if (part.startsWith(DATA_FLAG)) {
      try {
        const jsonStr = part.slice(DATA_FLAG.length, -1);
        const parsed = JSON.parse(jsonStr);
        hasJsonBody = true;
        return `${DATA_FLAG}${JSON.stringify(parsed, null, 2)}'`;
      } catch {
        return part;
      }
    }
    return part;
  });

  // Second pass - only remove Content-Length if we found JSON
  const finalParts = hasJsonBody
    ? jsonFormattedParts.filter(part => !part.startsWith(CONTENT_LENGTH_HEADER))
    : jsonFormattedParts;

  console.error(finalParts.join(' \\\n  '));
};
