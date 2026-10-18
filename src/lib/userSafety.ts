import { supabase } from "./supabase";
export const PHOTO_VISIBILITY_CHANGED = "pilgrimapp:photo-visibility-changed";
export const authorLabel = (id: string) => `投稿者 ${id.slice(0, 8)}`;
export async function blockAuthor(authorId: string) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Login required");
  if (user.id === authorId) throw new Error("Cannot block yourself");
  const result = await supabase
    .from("user_blocks")
    .insert({ user_id: user.id, blocked_user_id: authorId });
  if (result.error && result.error.code !== "23505") throw result.error;
  window.dispatchEvent(new Event(PHOTO_VISIBILITY_CHANGED));
}
export async function unblockAuthor(authorId: string) {
  const result = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocked_user_id", authorId);
  if (result.error) throw result.error;
  window.dispatchEvent(new Event(PHOTO_VISIBILITY_CHANGED));
}
