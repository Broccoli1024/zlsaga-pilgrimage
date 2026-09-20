import { anthropicClient, openaiClient } from "./clients.ts";
import { jevRouter } from "./router.ts";
import type { Clients } from "./types.ts";

export function liveClients(env: NodeJS.ProcessEnv): Clients {
  const names = [
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_MODEL",
    "JEV_API_KEY",
    "JEV_MODEL",
  ] as const;
  const missing = names.filter((name) => !env[name]?.trim());
  if (missing.length)
    throw new Error(`Missing configuration: ${missing.join(", ")}`);
  return {
    planner: openaiClient(env.OPENAI_API_KEY!, env.OPENAI_MODEL!),
    worker: anthropicClient(env.ANTHROPIC_API_KEY!, env.ANTHROPIC_MODEL!),
    router: jevRouter(env.JEV_API_KEY!, env.JEV_MODEL!),
  };
}

export function mockClients(): Clients {
  return {
    planner: {
      async generate({ instructions }) {
        return instructions.includes("planner")
          ? "[MOCK] 提供されたコードへの最小変更を提案し、レビューする。"
          : "[MOCK] 提案とレビューを統合しました。ファイル変更・公開は行っていません。";
      },
    },
    worker: {
      async generate({ instructions }) {
        return instructions.includes("coding specialist")
          ? "[MOCK] export function add(a: number, b: number) { return a + b; }"
          : "[MOCK] 正数・負数・ゼロのテストを提案します。未実行です。";
      },
    },
    router: {
      async decide() {
        return {
          action: "CODE",
          confidence: 1,
          probabilities: { CODE: 1, REVIEW: 0, ASK_USER: 0 },
        };
      },
    },
  };
}
