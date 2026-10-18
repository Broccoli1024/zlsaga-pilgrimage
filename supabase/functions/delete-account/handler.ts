export interface DeletionDependencies {
  identify(token: string): Promise<{ id: string; email: string } | null>;
  verifyPassword(
    email: string,
    password: string,
    expectedId: string,
  ): Promise<boolean>;
  begin(userId: string): Promise<void>;
  objects(userId: string): Promise<{ bucket_id: string; name: string }[]>;
  remove(bucket: string, paths: string[]): Promise<void>;
  removeActivity(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  markFailed(userId: string): Promise<void>;
}
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization,x-client-info,apikey,content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
export function deletionHandler(deps: DeletionDependencies) {
  return async (req: Request): Promise<Response> => {
    const reply = (status: number, body: object) =>
      new Response(JSON.stringify(body), { status, headers });
    if (req.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return reply(405, { error: "POST required" });
    const token = req.headers
      .get("Authorization")
      ?.match(/^Bearer (.+)$/i)?.[1];
    if (!token)
      return reply(401, {
        error: "ログインし直してください。 / Please log in again.",
      });
    let body: { password?: unknown; confirmation?: unknown; userId?: unknown };
    try {
      body = JSON.parse(await req.text());
    } catch {
      return reply(400, { error: "Invalid request" });
    }
    if (
      body.confirmation !== "DELETE" ||
      typeof body.password !== "string" ||
      !body.password ||
      body.password.length > 1024
    )
      return reply(400, {
        error:
          "削除の確認と現在のパスワードが必要です。 / Confirmation and current password required.",
      });
    // Never accept a target user ID or email from the caller.
    let user: { id: string; email: string } | null;
    try {
      user = await deps.identify(token);
    } catch {
      user = null;
    }
    if (!user)
      return reply(401, {
        error: "ログインし直してください。 / Please log in again.",
      });
    let verified = false;
    try {
      verified = await deps.verifyPassword(user.email, body.password, user.id);
    } catch {
      /* fail closed */
    }
    body.password = undefined;
    if (!verified)
      return reply(403, {
        error: "パスワードを確認してください。 / Check your current password.",
      });
    try {
      await deps.begin(user.id);
    } catch {
      return reply(409, {
        error:
          "削除処理中、または接続に失敗しました。数分後に再試行してください。 / Retry in a few minutes.",
      });
    }
    try {
      // Fetch page zero repeatedly: deletions shift the remaining objects forward.
      for (let batch = 0; batch < 100; batch++) {
        const objects = await deps.objects(user.id);
        if (!objects.length) {
          await deps.removeActivity(user.id);
          await deps.deleteUser(user.id);
          return reply(200, { deleted: true });
        }
        for (const bucket of new Set(objects.map((o) => o.bucket_id))) {
          await deps.remove(
            bucket,
            objects.filter((o) => o.bucket_id === bucket).map((o) => o.name),
          );
        }
      }
      throw new Error("Cleanup incomplete");
    } catch {
      await deps.markFailed(user.id).catch(() => undefined);
      return reply(503, {
        error:
          "削除は完了していません。一部の画像が削除された可能性があります。この画面から再試行するか、お問い合わせください。 / Deletion incomplete. Some images may have been removed. Retry or contact support.",
      });
    }
  };
}
