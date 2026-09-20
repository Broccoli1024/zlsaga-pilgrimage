export type Transport = typeof fetch;

// Errors deliberately omit request/response bodies and credentials.
export async function post(
  provider: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  transport: Transport = fetch,
  timeoutMs = 30000,
): Promise<unknown> {
  const encoded = JSON.stringify(body);
  if (encoded.length > 200000)
    throw new Error(`${provider}: request too large`);
  let response: Response;
  try {
    response = await transport(url, {
      method: "POST",
      redirect: "error",
      headers: { "Content-Type": "application/json", ...headers },
      body: encoded,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error(`${provider}: network error or timeout`);
  }
  if (!response.ok) throw new Error(`${provider}: HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Error(`${provider}: invalid JSON response`);
  }
}
