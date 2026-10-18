import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { authorLabel } from "../../lib/userSafety";
interface Report {
  id: string;
  reported_user_id: string;
  photo_id: string | null;
  reason: string;
  created_at: string;
}
export default function UserReportModeration() {
  const [rows, setRows] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(0);
  useEffect(() => {
    let active = true;
    supabase
      .from("user_reports")
      .select("id,reported_user_id,photo_id,reason,created_at")
      .is("resolved_at", null)
      .order("created_at")
      .range(page * 20, page * 20 + 19)
      .then(({ data, error }) => {
        if (active) {
          if (error) setError("投稿者の通報を取得できませんでした。");
          else {
            setRows(data ?? []);
            setError("");
          }
        }
      });
    return () => {
      active = false;
    };
  }, [revision, page]);
  const resolve = async (row: Report, hide: boolean) => {
    if (
      hide &&
      !window.confirm(
        "この投稿者の公開済み・確認待ちの写真をすべて非公開にしますか？",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.rpc("resolve_user_report", {
        report_id: row.id,
        hide_photos: hide,
      });
      if (error) throw error;
      setRevision((r) => r + 1);
    } catch {
      setError("通報を更新できませんでした。");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="spot-photos">
      <h2>投稿者への通報</h2>
      <button onClick={() => setRevision((r) => r + 1)}>再読み込み</button>
      {error && <p role="alert">{error}</p>}
      {!rows.length && !error && <p>未対応の通報はありません。</p>}
      {rows.map((r) => (
        <article key={r.id}>
          <h3>{authorLabel(r.reported_user_id)}</h3>
          <p>{r.reason}</p>
          {r.photo_id && <PhotoLink photoId={r.photo_id} />}
          <div className="spot-photo-actions">
            <button disabled={busy} onClick={() => resolve(r, true)}>
              投稿写真を非公開にして対応済み
            </button>
            <button disabled={busy} onClick={() => resolve(r, false)}>
              確認済みにする
            </button>
          </div>
        </article>
      ))}
      <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
        前へ
      </button>
      <span> {page + 1} </span>
      <button disabled={rows.length < 20} onClick={() => setPage((p) => p + 1)}>
        次へ
      </button>
    </section>
  );
}
function PhotoLink({ photoId }: { photoId: string }) {
  const [spotId, setSpotId] = useState<string>();
  useEffect(() => {
    let active = true;
    supabase
      .from("spot_photos")
      .select("spot_id")
      .eq("id", photoId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSpotId(data?.spot_id);
      });
    return () => {
      active = false;
    };
  }, [photoId]);
  return spotId ? (
    <Link to={`/spots/${spotId}`}>該当スポットを確認</Link>
  ) : null;
}
