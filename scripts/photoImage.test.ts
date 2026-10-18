import test from "node:test";
import assert from "node:assert/strict";
import {
  photoDimensions,
  validatePhotoFiles,
  MAX_SOURCE_BYTES,
} from "../src/lib/photoImage.ts";
test("photos preserve aspect ratio, never upscale, and fit within 1600 pixels", () => {
  assert.deepEqual(photoDimensions(4000, 3000), { width: 1600, height: 1200 });
  assert.deepEqual(photoDimensions(3000, 4000), { width: 1200, height: 1600 });
  assert.deepEqual(photoDimensions(600, 400), { width: 600, height: 400 });
  assert.throws(() => photoDimensions(0, 10));
  assert.throws(() => photoDimensions(Infinity, 10));
});
test("uploads reject excess files, unsupported formats, empty and oversized files", () => {
  const jpeg = { type: "image/jpeg", size: 1024 };
  validatePhotoFiles([jpeg, jpeg, jpeg]);
  assert.throws(() => validatePhotoFiles([]));
  assert.throws(() => validatePhotoFiles([jpeg, jpeg, jpeg, jpeg]));
  assert.throws(() =>
    validatePhotoFiles([{ type: "image/svg+xml", size: 100 }]),
  );
  assert.throws(() => validatePhotoFiles([{ ...jpeg, size: 0 }]));
  assert.throws(() =>
    validatePhotoFiles([{ ...jpeg, size: MAX_SOURCE_BYTES + 1 }]),
  );
});
