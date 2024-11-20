# [jsr:@tarasglek/fetch-proxy-curl-logger](https://jsr.io/@tarasglek/fetch-proxy-curl-logger)

A lightweight utility that wraps the Fetch API to log equivalent cURL commands
for each request.

## Installation

```bash
npx jsr add @tarasglek/fetch-proxy-curl-logger
```

## Usage

```js
import { fetchProxyCurlLogger } from "@tarasglek/fetch-proxy-curl-logger";

// Basic usage with default logger
const fetch = fetchProxyCurlLogger();
fetch("https://api.example.com/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: "value" }),
});

// Pretty print JSON and remove Content-Length headers
const fetchWithPrettyJson = fetchProxyCurlLogger({
    logger: prettyJsonLogger
});
fetchWithPrettyJson("https://api.example.com/data", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Content-Length": "123"
    },
    body: JSON.stringify({ nested: { objects: "are", pretty: "printed" } })
});

// Custom logger that replaces Authorization header with env var
const fetchWithEnvAuth = fetchProxyCurlLogger({
    logger: (parts) => {
        const envParts = parts.map((part) => {
            if (part.startsWith("-H 'Authorization:")) {
                return "-H 'Authorization: $AUTHORIZATION'";
            }
            return part;
        });
        console.error(envParts.join(" \\\n  "));
    },
});

// Chain with custom fetch implementation
import nodeFetch from "node-fetch";
const fetchWithCustomImpl = fetchProxyCurlLogger({
    fetch: nodeFetch,
});
```

Example output:

Basic logger:
```bash
curl -X POST 'https://api.example.com/data' \
  -H 'Content-Type: application/json' \
  -H "Authorization: $AUTHORIZATION" \
  -d '{"key":"value"}'
```

Pretty JSON logger:
```bash
curl -X POST 'https://api.example.com/data' \
  -H 'Content-Type: application/json' \
  -d '{
  "nested": {
    "objects": "are",
    "pretty": "printed"
  }
}'
```

## Features

- 🔍 Logs equivalent cURL commands for all fetch requests
- 🎨 Customizable logging format
- 🔗 Chain with custom fetch implementations
- 📝 TypeScript support
- 🪶 Zero dependencies
- 🔒 Preserves original fetch behavior
- 🎯 Built-in pretty JSON formatting logger

## API

### fetchProxyCurlLogger(options?: FetchProxyCurlLoggerOptions)

Creates a fetch proxy that logs cURL commands.

#### Options

```typescript
interface FetchProxyCurlLoggerOptions {
    /** Custom logger function */
    logger?: (curlCommandParts: string[]) => void;
    /** Custom fetch implementation */
    fetch?: typeof fetch;
}
```

- `logger`: Custom logging function that receives array of command parts
- `fetch`: Custom fetch implementation for chaining
- Returns: Proxied fetch function with identical signature to native fetch

### prettyJsonLogger

A sample logger implementation that:
- Pretty prints JSON request bodies with proper indentation
- Removes Content-Length headers when JSON is detected
- Maintains original formatting for non-JSON requests

## License

MIT
