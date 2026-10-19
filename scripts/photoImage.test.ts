import test from "node:test";
import assert from "node:assert/strict";
import {
  photoDimensions,
  validatePhotoFiles,
  MAX_SOURCE_BYTES,
  compressProfileImage,
} from "../src/lib/photoImage.ts";
test("photos preserve aspect ratio, never upscale, and fit within 1600 pixels", () => {
  assert.deepEqual(photoDimensions(4000, 3000), { width: 1600, height: 1200 });
  assert.deepEqual(photoDimensions(3000, 4000), { width: 1200, height: 1600 });
  assert.deepEqual(photoDimensions(600, 400), { width: 600, height: 400 });
  assert.throws(() => photoDimensions(0, 10));
  assert.throws(() => photoDimensions(Infinity, 10));
});
test("profile images reject invalid inputs before decoding", async () => {
  for (const file of [
    new File(["x"], "x.svg", { type: "image/svg+xml" }),
    new File([], "empty.jpg", { type: "image/jpeg" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }),
  ]) await assert.rejects(compressProfileImage(file));
});
test("profile upload uses newly encoded pixels and closes bitmap on conversion failure", async (t) => {
  let closed = 0;
  let fail = false;
  const encoded = new Blob(["encoded pixels"], { type: "image/jpeg" });
  for (const name of ["createImageBitmap", "document"]) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  Object.defineProperty(globalThis, "createImageBitmap", { configurable: true, value: async () => ({
    width: 4000, height: 3000, close() { closed++; },
  }) });
  const canvas = {
    width: 0, height: 0,
    getContext: () => ({ fillStyle: "", fillRect() {}, drawImage() {} }),
    toBlob(callback: (value: Blob | null) => void, type: string) {
      assert.equal(type, "image/jpeg");
      callback(fail ? null : encoded);
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { createElement: () => canvas } });
  const source = new File(["original metadata"], "source.gif", { type: "image/gif" });
  assert.equal(await compressProfileImage(source), encoded);
  assert.equal(canvas.width, 1600);
  assert.equal(canvas.height, 1200);
  assert.equal(closed, 1);
  fail = true;
  await assert.rejects(compressProfileImage(source));
  assert.equal(closed, 2);
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
