export const actions = ["CODE", "REVIEW", "ASK_USER"] as const;
export type Action = (typeof actions)[number];
export interface Task {
  request: string;
  context: string;
}
export interface Decision {
  action: Action;
  confidence: number;
  probabilities: Record<Action, number>;
}
export interface TextRequest {
  instructions: string;
  input: string;
}
export interface TextClient {
  generate(request: TextRequest): Promise<string>;
}
export interface Router {
  decide(task: Task, plan: string): Promise<Decision>;
}
export interface Clients {
  planner: TextClient;
  worker: TextClient;
  router: Router;
}
export interface Result {
  mode: "mock" | "live";
  status: "proposed" | "needs_input";
  plan: string;
  decision: Decision;
  draft?: string;
  review?: string;
  summary: string;
}

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid API object");
  return value as Record<string, unknown>;
}
export function nonempty(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("Empty or invalid API text");
  return value;
}
export function probability(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error("Invalid routing probability");
  }
  return value;
}
export function validateTask(task: Task): void {
  nonempty(task.request);
  if (
    typeof task.context !== "string" ||
    task.request.length + task.context.length > 24000
  ) {
    throw new Error("Task and context must total at most 24000 characters");
  }
}
