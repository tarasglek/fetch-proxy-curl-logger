/**
 * Type definition for curl command logger function
 */
const DATA_FLAG = "-d '";
const CONTENT_LENGTH_HEADER = "-H 'Content-Length:";

function wrapAsCurlData(data: string): string {
  return `${DATA_FLAG}${data.replace(/'/g, "'\\''")}'`;
}

function unwrapCurlData(part: string): string | undefined {
  if (!part.startsWith(DATA_FLAG)) {
    return undefined;
  }
  return part.slice(DATA_FLAG.length, -1);
}

export type CurlLogger = (curlCommandParts: string[]) => void;

/**
 * Configuration options for fetch proxy curl logger
 */
export interface FetchProxyCurlLoggerOptions {
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
export function fetchProxyCurlLogger(
  options: FetchProxyCurlLoggerOptions = {}
): ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
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
      curlCmd.push(wrapAsCurlData(init.body));
    }

    logger(curlCmd);
    return customFetch(input, init);
  };
};

/**
 * Sample logger that pretty prints JSON bodies and headers while removing Content-Length
 */
export function prettyJsonLogger(curlCommandParts: string[]): void {
  let hasJsonBody = false;

  const jsonFormattedParts = curlCommandParts.map(part => {
    const data = unwrapCurlData(part);
    if (data !== undefined) {
      try {
        const parsed = JSON.parse(data);
        hasJsonBody = true;
        return wrapAsCurlData(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.error(e.stack);
        return part;
      }
    }
    return part;
  });

  const finalParts = hasJsonBody
    ? jsonFormattedParts.filter(part => !part.startsWith(CONTENT_LENGTH_HEADER))
    : jsonFormattedParts;

  console.error(finalParts.join(' \\\n  '));
}
