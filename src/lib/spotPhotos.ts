import { supabase } from "./supabase";
import { compressPhoto, validatePhotoFiles } from "./photoImage";
export interface SpotPhoto {
  id: string;
  spot_id: string;
  user_id: string;
  storage_path: string;
  caption: string;
  status: "uploading" | "pending" | "approved" | "rejected";
  created_at: string;
  url?: string;
}
export const PHOTO_BUCKET = "spot-photos";
export async function photoUrls(rows: SpotPhoto[]): Promise<SpotPhoto[]> {
  if (!rows.length) return [];
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(
      rows.map((p) => p.storage_path),
      300,
    );
  if (error) throw error;
  return rows.map((p) => ({
    ...p,
    url: data?.find((u) => u.path === p.storage_path)?.signedUrl ?? undefined,
  }));
}
export async function listSpotPhotos(spotId: string, page = 0, cover = false) {
  const size = cover ? 1 : 24;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let blocked: string[] = [];
  if (session) {
    const result = await supabase.from("user_blocks").select("blocked_user_id");
    if (result.error) throw result.error;
    blocked = (result.data ?? []).map((row) => row.blocked_user_id);
  }
  let query = supabase
    .from("spot_photos")
    .select("*")
    .eq("spot_id", spotId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .order("id")
    .range(page * size, page * size + size - 1);
  if (blocked.length)
    query = query.not("user_id", "in", `(${blocked.join(",")})`);
  const { data, error } = await query;
  if (error) throw error;
  return photoUrls(data ?? []);
}
export async function deletePhoto(photo: SpotPhoto) {
  // Storage first: keep the row and its deletion permission if removal fails.
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photo.storage_path]);
  if (error) throw error;
  const result = await supabase.rpc("delete_spot_photo_record", {
    photo_id: photo.id,
  });
  if (result.error) throw result.error;
}
export async function uploadSpotPhotos(
  spotId: string,
  files: File[],
  caption: string,
  onProgress: (count: number) => void,
) {
  validatePhotoFiles(files);
  let completed = 0;
  for (const file of files) {
    const blob = await compressPhoto(file);
    const { data, error } = await supabase.rpc("reserve_spot_photo", {
      target_spot: spotId,
      photo_caption: caption,
    });
    if (error)
      throw new Error(
        `${completed}枚を送信済み。投稿上限または接続状態を確認してください。 / Check quota or connection.`,
      );
    const photo = data as SpotPhoto;
    try {
      const uploaded = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(photo.storage_path, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (uploaded.error) throw uploaded.error;
      const submitted = await supabase.rpc("submit_spot_photo", {
        photo_id: photo.id,
      });
      if (submitted.error) throw submitted.error;
    } catch {
      // A failed cleanup remains visible to its owner as an incomplete upload.
      await deletePhoto(photo).catch(() => undefined);
      throw new Error(
        `${completed}枚を送信済み。残りの写真を送信できませんでした。 / Some photos could not be uploaded.`,
      );
    }
    completed++;
    onProgress(completed);
  }
}
