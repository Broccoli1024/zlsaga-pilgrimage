import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const publisherId = "3271827222905842";

test("AdSense ownership is declared without loading Auto ads globally", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(
    html,
    new RegExp(
      `name=["']google-adsense-account["'][\\s\\S]+ca-pub-${publisherId}`,
    ),
  );
  assert.doesNotMatch(
    html,
    /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/,
  );
});

test("ads.txt authorizes only the configured Google publisher", async () => {
  const adsTxt = await readFile(
    new URL("../public/ads.txt", import.meta.url),
    "utf8",
  );

  assert.equal(
    adsTxt,
    `google.com, pub-${publisherId}, DIRECT, f08c47fec0942fa0\n`,
  );
});
