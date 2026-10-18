import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { deletionHandler } from "./handler.ts";
const url = Deno.env.get("SUPABASE_URL")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, service, options);
Deno.serve(
  deletionHandler({
    async identify(token) {
      const client = createClient(url, anon, options);
      const { data, error } = await client.auth.getUser(token);
      return !error && data.user?.email
        ? { id: data.user.id, email: data.user.email }
        : null;
    },
    async verifyPassword(email, password, expectedId) {
      const client = createClient(url, anon, options);
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      const valid = !error && data.user?.id === expectedId;
      if (data.session) await client.auth.signOut({ scope: "local" });
      return valid;
    },
    async begin(userId) {
      const { error } = await admin.rpc("begin_account_deletion", {
        target_user: userId,
      });
      if (error) throw error;
    },
    async objects(userId) {
      const { data, error } = await admin.rpc("account_deletion_objects", {
        target_user: userId,
      });
      if (error) throw error;
      return data ?? [];
    },
    async remove(bucket, paths) {
      const { error } = await admin.storage.from(bucket).remove(paths);
      if (error) throw error;
    },
    async removeActivity(userId) {
      const { error } = await admin.rpc("delete_account_activity", {
        target_user: userId,
      });
      if (error) throw error;
    },
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    async markFailed(userId) {
      const { error } = await admin
        .from("account_deletions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
    },
  }),
);
