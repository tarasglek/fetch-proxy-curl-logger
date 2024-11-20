/**
 * Type definition for curl command logger function
 */
type CurlLogger = (curlCommandParts: string[]) => void;

/**
 * Creates a fetch proxy that logs curl commands for each request
 * @param {CurlLogger} [logger] - Optional custom logger function
 * @returns {(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>}
 * Proxied fetch function
 */
const fetchProxyCurlLogger = (
  logger: CurlLogger = (parts) => console.error(parts.join(" \\\n  ")),
) => {
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    const method = init?.method || "GET";
    const curlCmd: string[] = [`curl -X ${method} '${url}'`];

    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        curlCmd.push(`-H '${key}: ${value}'`);
      });
    }

    if (init?.body) {
      if (typeof init.body !== "string") {
        throw new Error(`Body must be a string, got ${typeof init.body}`);
      }
      curlCmd.push(`-d '${init.body.replace(/'/g, "'\\''")}'`);
    }

    logger(curlCmd);
    return fetch(input, init);
  };
};

export { fetchProxyCurlLogger };
export type { CurlLogger };
