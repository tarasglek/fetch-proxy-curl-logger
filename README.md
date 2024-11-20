# @tarasglek/fetch-proxy-curl-logger

A lightweight utility that wraps the Fetch API to log equivalent cURL commands
for each request.

## Installation

```bash
npm install @tarasglek/fetch-proxy-curl-logger
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

// Custom logger with timestamps
const fetchWithTime = fetchProxyCurlLogger((parts) => {
  console.log(`[${new Date().toISOString()}]\n${parts.join(" \\\n  ")}`);
});
```

## Features

- 🔍 Logs equivalent cURL commands for all fetch requests
- 🎨 Customizable logging format
- 📝 TypeScript support
- 🪶 Zero dependencies
- 🔒 Preserves original fetch behavior

## API

### fetchProxyCurlLogger(logger?: CurlLogger)

Creates a fetch proxy that logs cURL commands.

- `logger` (optional): Custom logging function that receives array of command
  parts
- Returns: Proxied fetch function with identical signature to native fetch

## License

MIT
