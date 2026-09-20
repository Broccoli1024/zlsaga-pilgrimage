import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { openaiClient, anthropicClient } from "./clients.ts";
import { mockClients, liveClients } from "./config.ts";
import { orchestrate } from "./orchestrator.ts";
import { jevRouter, parseDecision } from "./router.ts";
import { post } from "./http.ts";
import type { Transport } from "./http.ts";
import type { Action, Decision } from "./types.ts";

const task = {
  request: "Implement add",
  context: "export function add(a: number, b: number): number;",
};
const textRequest = { instructions: "Test instruction", input: "Test input" };
const routeResponse = (action: Action = "CODE", confidence = 0.9) => ({
  answers: {
    route: {
      type: "choice",
      choice: action,
      confidence,
      probabilities: {
        CODE: action === "CODE" ? 1 : 0,
        REVIEW: action === "REVIEW" ? 1 : 0,
        ASK_USER: action === "ASK_USER" ? 1 : 0,
      },
    },
  },
});
const transportFor =
  (body: unknown): Transport =>
  async () =>
    Response.json(body);

test("CODE runs plan, route, coding, review, integration in order", async () => {
  const calls: string[] = [];
  const result = await orchestrate(
    task,
    {
      planner: {
        async generate() {
          calls.push("planner");
          return "plan/summary";
        },
      },
      worker: {
        async generate({ input }) {
          calls.push("worker");
          if (calls.length === 4) assert.match(input, /draft/);
          return "proposal/review";
        },
      },
      router: {
        async decide() {
          calls.push("router");
          return parseDecision(routeResponse());
        },
      },
    },
    "mock",
  );
  assert.deepEqual(calls, ["planner", "router", "worker", "worker", "planner"]);
  assert.equal(result.status, "proposed");
  assert.ok(result.draft && result.review);
});

test("REVIEW skips coding", async () => {
  const clients = mockClients();
  let workerCalls = 0;
  clients.router.decide = async () => parseDecision(routeResponse("REVIEW"));
  clients.worker.generate = async () => {
    workerCalls++;
    return "review";
  };
  const result = await orchestrate(task, clients, "mock");
  assert.equal(workerCalls, 1);
  assert.equal(result.draft, undefined);
});

for (const [action, confidence] of [
  ["ASK_USER", 1],
  ["CODE", 0.59],
] as const) {
  test(`stops before Claude on ${action}/${confidence}`, async () => {
    const clients = mockClients();
    clients.router.decide = async () =>
      parseDecision(routeResponse(action, confidence));
    clients.worker.generate = async () => {
      throw new Error("must not be called");
    };
    assert.equal(
      (await orchestrate(task, clients, "mock")).status,
      "needs_input",
    );
  });
}

test("invalid task is rejected before API calls", async () => {
  for (const request of ["", "x".repeat(24001)]) {
    await assert.rejects(
      orchestrate({ request, context: "" }, mockClients(), "mock"),
    );
  }
});

test("OpenAI uses Responses API and parses raw output blocks", async () => {
  const transport: Transport = async (url, init) => {
    assert.equal(url, "https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.store, false);
    assert.equal(body.model, "test-model");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer test-key",
    );
    return Response.json({
      status: "completed",
      output: [
        { type: "reasoning" },
        { type: "message", content: [{ type: "output_text", text: "OK" }] },
      ],
    });
  };
  assert.equal(
    await openaiClient("test-key", "test-model", transport).generate(
      textRequest,
    ),
    "OK",
  );
});

test("Anthropic uses Messages API with correct auth/version", async () => {
  const transport: Transport = async (url, init) => {
    assert.equal(url, "https://api.anthropic.com/v1/messages");
    assert.equal(new Headers(init?.headers).get("x-api-key"), "test-key");
    assert.equal(
      new Headers(init?.headers).get("anthropic-version"),
      "2023-06-01",
    );
    const body = JSON.parse(String(init?.body));
    assert.equal(body.system, textRequest.instructions);
    assert.equal(body.messages[0].content, textRequest.input);
    return Response.json({
      stop_reason: "end_turn",
      content: [{ type: "text", text: "OK" }],
    });
  };
  assert.equal(
    await anthropicClient("test-key", "test-model", transport).generate(
      textRequest,
    ),
    "OK",
  );
});

test("Jev sends Choice criteria and parses typed probabilities", async () => {
  const transport: Transport = async (url, init) => {
    assert.equal(url, "https://api.typesafe.ai/v1/systemone");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.questions.route.type, "choice");
    assert.deepEqual(Object.keys(body.questions.route.criteria), [
      "CODE",
      "REVIEW",
      "ASK_USER",
    ]);
    assert.deepEqual(JSON.parse(body.state).task, task);
    return Response.json(routeResponse());
  };
  assert.equal(
    (await jevRouter("test-key", "jev-latest", transport).decide(task, "plan"))
      .action,
    "CODE",
  );
});

test("rejects invalid/unknown routes, confidence and distributions", () => {
  const invalid = [
    { choice: "DELETE" },
    { confidence: NaN },
    { confidence: -1 },
    { confidence: 2 },
    { probabilities: { CODE: 0.5, REVIEW: 0, ASK_USER: 0 } },
    { probabilities: { CODE: 0, REVIEW: 1, ASK_USER: 0 } },
    { probabilities: { CODE: 1, REVIEW: 0 } },
    { probabilities: { CODE: 1, REVIEW: 0, ASK_USER: 0, OTHER: 0 } },
  ];
  for (const fields of invalid) {
    const response = routeResponse();
    Object.assign(response.answers.route, fields);
    assert.throws(() => parseDecision(response));
  }
});

test("fails closed on refused, truncated or empty model output", async () => {
  for (const body of [
    { status: "incomplete", output: [] },
    { status: "completed", output: [] },
    {
      status: "completed",
      output: [{ type: "message", content: [{ type: "refusal" }] }],
    },
  ])
    await assert.rejects(
      openaiClient("key", "model", transportFor(body)).generate(textRequest),
    );
  for (const body of [
    { stop_reason: "max_tokens", content: [] },
    { stop_reason: "end_turn", content: [] },
  ]) {
    await assert.rejects(
      anthropicClient("key", "model", transportFor(body)).generate(textRequest),
    );
  }
});

test("HTTP failures never expose response secrets or retry", async () => {
  for (const status of [401, 429, 500]) {
    let calls = 0;
    const transport: Transport = async () => {
      calls++;
      return new Response("secret-key", { status });
    };
    await assert.rejects(
      post("Test", "https://example.com", {}, {}, transport),
      { message: `Test: HTTP ${status}` },
    );
    assert.equal(calls, 1);
  }
  await assert.rejects(
    post("Test", "https://example.com", {}, {}, async () => {
      throw new Error("secret-key");
    }),
    { message: "Test: network error or timeout" },
  );
  await assert.rejects(
    post(
      "Test",
      "https://example.com",
      {},
      {},
      async () => new Response("not-json"),
    ),
    { message: "Test: invalid JSON response" },
  );
});

test("request timeout aborts transport", async () => {
  const transport: Transport = async (_url, init) =>
    new Promise((_resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("timeout did not abort")),
        1000,
      );
      init?.signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
      });
    });
  await assert.rejects(
    post("Test", "https://example.com", {}, {}, transport, 5),
    { message: "Test: network error or timeout" },
  );
});

test("provider failure propagates, never silently substitutes mock", async () => {
  const clients = mockClients();
  clients.router.decide = async (): Promise<Decision> => {
    throw new Error("Jev: HTTP 429");
  };
  await assert.rejects(orchestrate(task, clients, "live"), /Jev: HTTP 429/);
});

test("all live configuration is checked before network access", () => {
  assert.throws(
    () => liveClients({ OPENAI_API_KEY: "secret" }),
    (error) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /ANTHROPIC_API_KEY/);
      assert.doesNotMatch(error.message, /secret/);
      return true;
    },
  );
});

test("CLI mock end-to-end and missing-key live failure", () => {
  const cli = new URL("./cli.ts", import.meta.url);
  const mock = spawnSync(
    process.execPath,
    [cli.pathname, "--mock", "Implement add"],
    { encoding: "utf8", env: {} },
  );
  assert.equal(mock.status, 0, mock.stderr);
  assert.equal(JSON.parse(mock.stdout).mode, "mock");
  const live = spawnSync(process.execPath, [cli.pathname, "--smoke-live"], {
    encoding: "utf8",
    env: {},
  });
  assert.equal(live.status, 1);
  assert.match(live.stderr, /Missing configuration/);
});
