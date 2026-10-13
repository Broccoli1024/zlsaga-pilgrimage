import assert from "node:assert/strict";
import { test } from "node:test";
import { getAuthRedirectUrl } from "../src/lib/authRedirect.ts";

test("native auth emails return to the public web app", () => {
  assert.equal(
    getAuthRedirectUrl("/reset-password", { native: true }),
    "https://pilgrimapp.jp/reset-password",
  );
});

test("web auth emails retain the current development origin", () => {
  assert.equal(
    getAuthRedirectUrl("/", {
      native: false,
      webOrigin: "http://127.0.0.1:5173",
    }),
    "http://127.0.0.1:5173/",
  );
});

test("auth redirects cannot leave Pilgrimapp through a protocol-relative URL", () => {
  assert.throws(() => getAuthRedirectUrl("//example.com", { native: true }));
});
