import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { authorLabel, unblockAuthor } from "../../lib/userSafety";
import { useTranslation } from "react-i18next";
export default function BlockedAuthors() {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    supabase
      .from("user_blocks")
      .select("blocked_user_id")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (active) {
          if (error)
            setError(
              "ブロック一覧を取得できませんでした。 / Could not load blocked authors.",
            );
          else setIds((data ?? []).map((r) => r.blocked_user_id));
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const remove = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      await unblockAuthor(id);
      setIds((rows) => rows.filter((v) => v !== id));
    } catch {
      setError("解除できませんでした。 / Could not unblock.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="spot-photos">
      <h2>{en ? "Blocked photo authors" : "ブロック中の投稿者"}</h2>
      <p>
        {en
          ? "Photos from these authors are hidden while you are signed in."
          : "ログイン中は、ブロックした投稿者の写真を一覧・地図に表示しません。"}
      </p>
      {error && <p role="alert">{error}</p>}
      {!ids.length && !error && (
        <p>{en ? "No blocked authors." : "ブロック中の投稿者はいません。"}</p>
      )}
      {ids.map((id) => (
        <div className="spot-photo-actions" key={id}>
          <span>{en ? `Author ${id.slice(0, 8)}` : authorLabel(id)}</span>
          <button disabled={busy} onClick={() => remove(id)}>
            {en ? "Unblock" : "ブロック解除"}
          </button>
        </div>
      ))}
    </section>
  );
}
