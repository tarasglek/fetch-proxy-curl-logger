/**
 * Type definition for curl command logger function
 */
const DATA_FLAG = "-d '";
const CONTENT_LENGTH_HEADER = "-H 'Content-Length:";
const AUTH_HEADER = "-H 'Authorization:";
const contentLengthRegex = new RegExp(`^${CONTENT_LENGTH_HEADER}`, "i");
const authHeaderRegex = new RegExp(`^${AUTH_HEADER}`, "i");
const BEARER_PREFIX = "Bearer ";

/**
 * Wraps data for use in a curl command by escaping single quotes and adding -d flag
 * @param data - The string data to be wrapped
 * @returns The data wrapped in curl's -d flag syntax with proper escaping
 */
function wrapAsCurlData(data: string): string {
  return `${DATA_FLAG}${data.replace(/'/g, "'\\''")}'`;
}

/**
 * Extracts data from a curl command's -d parameter by removing the flag and unescaping
 * @param part - A part of the curl command that might contain -d data
 * @returns The unwrapped data string if part starts with -d flag, undefined otherwise
 */
function unwrapCurlData(part: string): string | undefined {
  if (!part.startsWith(DATA_FLAG)) {
    return undefined;
  }
  // Remove the DATA_FLAG prefix and trailing quote, then unescape single quotes
  return part.slice(DATA_FLAG.length, -1).replace(/\\'/g, "'");
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
  options: FetchProxyCurlLoggerOptions = {},
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  const {
    logger = (parts) => console.error(parts.join(" \\\n  ")),
    fetch: customFetch = fetch,
  } = options;

  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    const method = init?.method || "GET";
    const curlCmd: string[] = [`curl -X ${method.toUpperCase()} '${url}'`];

    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        curlCmd.push(`-H '${key}: ${value}'`);
      });
    }

    if (init?.body) {
      if (typeof init.body !== "string") {
        throw new Error(`Body must be a string, got ${typeof init.body}`);
      }
      curlCmd.push(wrapAsCurlData(init.body));
    }

    logger(curlCmd);
    return customFetch(input, init);
  };
}

/**
 * Tries to find an environment variable matching the authorization value
 * @param headerPart - The header part of the curl command
 * @returns The modified header with env var if found, or original if not
 */
function maskAuthorizationHeader(headerPart: string): string {
  if (!authHeaderRegex.test(headerPart)) {
    return headerPart;
  }

  const authValue = headerPart.slice(AUTH_HEADER.length, -1).trim();
  const isBearer = authValue.startsWith(BEARER_PREFIX);
  const valueToMatch = isBearer
    ? authValue.slice(BEARER_PREFIX.length)
    : authValue;

  // Check all environment variables using optional chaining
  // tslint:disable-next-line:no-any
  for (const [key, value] of Object.entries(globalThis?.process?.env ?? {})) {
    if (value === valueToMatch) {
      // Removed single quotes, using double quotes for the variable
      return `-H "Authorization: ${
        isBearer ? `${BEARER_PREFIX}$` : "$"
      }${key}"`;
    }
  }

  return headerPart;
}

/**
 * Sample logger that pretty prints JSON bodies and headers while removing Content-Length
 */
export function prettyJsonLogger(curlCommandParts: string[]): void {
  let hasJsonBody = false;
  const payloadFile = "fetch_payload.json";

  const jsonFormattedParts = curlCommandParts.map((part) => {
    const data = unwrapCurlData(part);
    if (data !== undefined) {
      try {
        hasJsonBody = true;
        return `-d @${payloadFile}`;
      } catch (e) {
        console.error(e instanceof Error ? e.stack : e);
        return part;
      }
    }
    return maskAuthorizationHeader(part);
  });

  const finalParts = hasJsonBody
    ? jsonFormattedParts.filter((part) => !contentLengthRegex.test(part))
    : jsonFormattedParts;

  if (hasJsonBody) {
    console.error(`# Save payload to ${payloadFile}:`);
    console.error(`cat > ${payloadFile} << 'EOF'`);
    console.error(
      `${
        JSON.stringify(
          JSON.parse(
            unwrapCurlData(
              curlCommandParts.find((p) => p.startsWith(DATA_FLAG))!,
            )!,
          ),
          null,
          2,
        )
      }`,
    );
    console.error("EOF");
  }
  console.error(finalParts.join(" \\\n  "));
}
