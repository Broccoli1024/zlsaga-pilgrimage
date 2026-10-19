// UI-only fixture server. Binds to loopback; no external services or real accounts.
import http from "node:http";
import { randomUUID } from "node:crypto";
const spot = {
  id: "a0000000-0000-4000-8000-000000000001",
  name: "写真投稿テスト用スポット",
  name_en: "Photo test spot",
  description:
    "写真投稿機能の確認用です。実際のスポット情報・投稿ではありません。",
  lat: 33.3052,
  lng: 130.1368,
  is_published: true,
  area_id: null,
  category_id: null,
};
const user = {
  id: "f3333333-3333-4333-8333-333333333333",
  email: "admin@example.invalid",
  role: "authenticated",
  aud: "authenticated",
  user_metadata: {},
  app_metadata: {},
  created_at: new Date().toISOString(),
};
const jwt = [
  Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
  Buffer.from(
    JSON.stringify({
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "authenticated",
    }),
  ).toString("base64url"),
  "local-test-signature",
].join(".");
let photos = [1, 2].map((n) => ({
  id: randomUUID(),
  spot_id: spot.id,
  user_id: "f1111111-1111-4111-8111-111111111111",
  storage_path: `fixture-${n}.jpg`,
  caption: `テスト画像 ${n}（実際の投稿ではありません）`,
  status: "approved",
  created_at: new Date(Date.now() - n * 1000).toISOString(),
}));
const files = new Map();
let blocks = [];
let reports = [];
http
  .createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    );
    if (req.method === "OPTIONS") {
      res.end();
      return;
    }
    const url = new URL(req.url, "http://127.0.0.1:54329");
    const path = url.pathname;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    let body = {};
    try {
      body = JSON.parse(raw.toString());
    } catch {}
    function send(data) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    }
    if (path === "/auth/v1/token")
      return send({
        access_token: jwt,
        refresh_token: "local-only",
        token_type: "bearer",
        expires_in: 3600,
        user,
      });
    if (path === "/auth/v1/user") return send(user);
    if (path.startsWith("/auth/")) return send({});
    if (
      path.startsWith("/storage/v1/object/sign/spot-photos/") &&
      req.method === "GET"
    ) {
      const name = decodeURIComponent(
        path.slice("/storage/v1/object/sign/spot-photos/".length),
      );
      if (files.has(name)) {
        res.setHeader("Content-Type", "image/jpeg");
        res.end(files.get(name));
        return;
      }
      res.setHeader("Content-Type", "image/svg+xml");
      res.end(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${name.includes("2") ? "#246778" : "#7c3aed"}"/><text x="400" y="290" text-anchor="middle" font-size="52" fill="white">TEST PHOTO</text><text x="400" y="350" text-anchor="middle" font-size="26" fill="white">Local preview only</text></svg>`,
      );
      return;
    }
    if (path === "/storage/v1/object/sign/spot-photos")
      return send(
        body.paths.map((p) => ({
          path: p,
          signedURL: `/object/sign/spot-photos/${p}?token=local-only`,
          error: null,
        })),
      );
    if (
      path.startsWith("/storage/v1/object/spot-photos/") &&
      req.method === "POST"
    ) {
      files.set(
        decodeURIComponent(
          path.slice("/storage/v1/object/spot-photos/".length),
        ),
        raw.subarray(
          raw.indexOf(Buffer.from([255, 216])),
          raw.lastIndexOf(Buffer.from([255, 217])) + 2,
        ),
      );
      console.log("UPLOAD RECEIVED", raw.length);
      return send({ Key: "spot-photos/test", Id: randomUUID() });
    }
    if (path === "/storage/v1/object/spot-photos" && req.method === "DELETE") {
      for (const p of body.prefixes ?? []) files.delete(p);
      return send([]);
    }
    if ((path.endsWith("/rpc/is_admin") || path.endsWith("/rpc/is_admin_member"))) return send(true);
    if (path.includes("/rpc/reserve_spot_photo")) {
      const id = randomUUID();
      const p = {
        id,
        spot_id: body.target_spot,
        user_id: user.id,
        storage_path: `${user.id}/${id}.jpg`,
        caption: body.photo_caption,
        status: "uploading",
        created_at: new Date().toISOString(),
      };
      photos.unshift(p);
      return send(p);
    }
    if (path.includes("/rpc/submit_spot_photo")) {
      photos.find((p) => p.id === body.photo_id).status = "pending";
      return send(null);
    }
    if (path.includes("/rpc/review_spot_photo")) {
      photos.find((p) => p.id === body.photo_id).status = body.decision;
      return send(null);
    }
    if (path.includes("/rpc/delete_spot_photo_record")) {
      photos = photos.filter((p) => p.id !== body.photo_id);
      return send(null);
    }
    if (path === "/rest/v1/user_blocks") {
      if(req.method === "POST") { blocks.push(body); return send(null); }
      if(req.method === "DELETE") { blocks = blocks.filter(b => b.blocked_user_id !== url.searchParams.get("blocked_user_id")?.slice(3)); return send(null); }
      return send(blocks);
    }
    if (path.endsWith("/rpc/report_photo_author")) {
      reports.push({id:randomUUID(),reported_user_id:photos.find(p => p.id === body.target_photo)?.user_id,photo_id:body.target_photo,reason:body.report_reason,created_at:new Date().toISOString()}); return send(null);
    }
    if (path === "/rest/v1/user_reports") return send(reports);
    if (path.endsWith("/rpc/resolve_user_report")) { reports = reports.filter(r => r.id !== body.report_id); return send(null); }
    if (path === "/rest/v1/spots")
      return send(
        req.headers.accept?.includes("vnd.pgrst.object") ? spot : [spot],
      );
    if (path === "/rest/v1/spot_photos") {
      let rows = [...photos];
      for (const field of ["status", "spot_id", "user_id"]) {
        const q = url.searchParams.get(field);
        if (q?.startsWith("not.in.(")) rows = rows.filter(p => !q.slice(8,-1).split(",").includes(p[field]));
        if (q?.startsWith("eq."))
          rows = rows.filter((p) => p[field] === q.slice(3));
      }
      const offset = Number(url.searchParams.get("offset") || 0);
      const limit = Number(url.searchParams.get("limit") || 1000);
      return send(rows.slice(offset, offset + limit));
    }
    return send([]);
  })
  .listen(54329, "127.0.0.1", () =>
    console.log(
      "Photo mock API: http://127.0.0.1:54329; UI fixture spot:",
      spot.id,
    ),
  );
