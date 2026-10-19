export const MAX_PHOTO_BYTES = 1024 * 1024;
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
export function photoDimensions(width: number, height: number) {
  if (width <= 0 || height <= 0 || !Number.isFinite(width + height))
    throw new Error("Invalid image");
  const scale = Math.min(1, 1600 / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
export function validatePhotoFiles(files: Pick<File, "size" | "type">[]) {
  if (files.length < 1 || files.length > 3)
    throw new Error("写真は1回に1〜3枚選択してください。 / Select 1–3 photos.");
  for (const file of files) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      throw new Error(
        "JPEG・PNG・WebP形式を選択してください。 / Use JPEG, PNG or WebP.",
      );
    if (file.size <= 0 || file.size > MAX_SOURCE_BYTES)
      throw new Error(
        "元の写真は1枚20MB以下にしてください。 / Maximum source size: 20 MB.",
      );
  }
}
export async function compressPhoto(file: File): Promise<Blob> {
  validatePhotoFiles([file]);
  return encodeImage(file);
}
export async function compressProfileImage(file: File): Promise<Blob> {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) ||
    file.size <= 0 || file.size > 5 * 1024 * 1024
  ) {
    throw new Error("5MB以下のJPEG・PNG・WebP・GIFを選択してください。 / Use JPEG, PNG, WebP or GIF up to 5 MB.");
  }
  return encodeImage(file);
}
async function encodeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 60_000_000)
      throw new Error("画像が大きすぎます。 / Image dimensions are too large.");
    const canvas = document.createElement("canvas");
    const size = photoDimensions(bitmap.width, bitmap.height);
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("画像を変換できません。 / Could not process image.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Re-encoding only pixels removes original EXIF (including GPS), filename and other metadata.
    for (const quality of [0.82, 0.68, 0.5, 0.35]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (blob && blob.size <= MAX_PHOTO_BYTES) return blob;
    }
    throw new Error(
      "画像を1MB以下に圧縮できません。 / Could not compress below 1 MB.",
    );
  } finally {
    bitmap.close();
  }
}
