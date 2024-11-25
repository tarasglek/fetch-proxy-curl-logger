import { fetchProxyCurlLogger, prettyJsonLogger } from "../mod.ts";
import OpenAI from "npm:openai";
const openai = new OpenAI({
  fetch: fetchProxyCurlLogger({
    logger: prettyJsonLogger,
  }),
});
await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello!" }],
});
