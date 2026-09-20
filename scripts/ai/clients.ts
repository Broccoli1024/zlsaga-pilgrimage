import { post } from "./http.ts";
import type { Transport } from "./http.ts";
import { object, nonempty } from "./types.ts";
import type { TextClient } from "./types.ts";

export function openaiClient(
  key: string,
  model: string,
  transport?: Transport,
): TextClient {
  return {
    async generate({ instructions, input }) {
      const result = object(
        await post(
          "OpenAI",
          "https://api.openai.com/v1/responses",
          { Authorization: `Bearer ${key}` },
          { model, instructions, input, store: false, max_output_tokens: 4096 },
          transport,
        ),
      );
      if (result.status !== "completed" || !Array.isArray(result.output)) {
        throw new Error("OpenAI: incomplete response");
      }
      const texts: string[] = [];
      for (const item of result.output) {
        const message = object(item);
        if (message.type !== "message" || !Array.isArray(message.content))
          continue;
        for (const content of message.content) {
          const block = object(content);
          if (block.type === "refusal")
            throw new Error("OpenAI: request refused");
          if (block.type === "output_text") texts.push(nonempty(block.text));
        }
      }
      return nonempty(texts.join("\n"));
    },
  };
}

export function anthropicClient(
  key: string,
  model: string,
  transport?: Transport,
): TextClient {
  return {
    async generate({ instructions, input }) {
      const result = object(
        await post(
          "Anthropic",
          "https://api.anthropic.com/v1/messages",
          { "x-api-key": key, "anthropic-version": "2023-06-01" },
          {
            model,
            system: instructions,
            max_tokens: 4096,
            messages: [{ role: "user", content: input }],
          },
          transport,
        ),
      );
      if (result.stop_reason !== "end_turn" || !Array.isArray(result.content)) {
        throw new Error("Anthropic: incomplete or refused response");
      }
      return nonempty(
        result.content
          .map(object)
          .filter((b) => b.type === "text")
          .map((b) => nonempty(b.text))
          .join("\n"),
      );
    },
  };
}
