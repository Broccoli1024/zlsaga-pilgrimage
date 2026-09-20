import { readFile } from "node:fs/promises";
import { liveClients, mockClients } from "./config.ts";
import { orchestrate } from "./orchestrator.ts";
import { validateTask } from "./types.ts";

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === "--help") {
    console.log(
      'Usage: npm run ai -- [--mock|--live] "request" [--context path]\n       npm run ai -- --smoke-live\nDefault: mock, no network. Live sends request/context to OpenAI, Anthropic and TypeSafe. No files are edited.',
    );
    return;
  }
  const mode = args[0] === "--live" ? "live" : "mock";
  if (args[0] === "--smoke-live") {
    if (args.length !== 1) throw new Error("Unexpected smoke arguments");
    const clients = liveClients(process.env);
    const task = {
      request: "Review this function for correctness.",
      context: "function add(a, b) { return a + b; }",
    };
    await clients.planner.generate({
      instructions: "Reply with OK.",
      input: "Connection test",
    });
    console.log("OpenAI: OK");
    await clients.worker.generate({
      instructions: "Reply with OK.",
      input: "Connection test",
    });
    console.log("Anthropic: OK");
    const decision = await clients.router.decide(
      task,
      "Review the provided add function.",
    );
    console.log(`Jev: OK (${decision.action})`);
    return;
  }
  if (args[0] === "--live" || args[0] === "--mock") args.shift();
  if (
    (args.length !== 1 && args.length !== 3) ||
    args[0]?.startsWith("--") ||
    (args.length === 3 && args[1] !== "--context")
  ) {
    throw new Error("Invalid arguments; use --help");
  }
  const task = {
    request: args[0],
    context: args.length === 3 ? await readFile(args[2], "utf8") : "",
  };
  validateTask(task);
  const result = await orchestrate(
    task,
    mode === "live" ? liveClients(process.env) : mockClients(),
    mode,
  );
  console.log(JSON.stringify(result, null, 2));
  if (result.status === "needs_input") process.exitCode = 2;
}

main().catch((error: unknown) => {
  // Never dump API responses, environment values or stack traces.
  console.error(error instanceof Error ? error.message : "AI execution failed");
  process.exitCode = 1;
});
