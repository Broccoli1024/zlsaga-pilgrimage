import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { deletePhoto, photoUrls } from "../../lib/spotPhotos";
import type { SpotPhoto } from "../../lib/spotPhotos";
export default function PhotoModeration() {
  const [photos, setPhotos] = useState<SpotPhoto[]>([]);
  const [reports, setReports] = useState<
    { photo_id: string; user_id: string; reason: string }[]
  >([]);
  const [filter, setFilter] = useState("pending");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const result = await supabase
          .from("spot_photos")
          .select("*")
          .eq("status", filter)
          .order("created_at", { ascending: false })
          .order("id")
          .range(page * 24, page * 24 + 23);
        if (result.error) throw result.error;
        const rows = await photoUrls(result.data ?? []);
        const flags = rows.length
          ? await supabase
              .from("spot_photo_reports")
              .select("photo_id,user_id,reason")
              .is("resolved_at", null)
              .in(
                "photo_id",
                rows.map((p) => p.id),
              )
          : { data: [], error: null };
        if (flags.error) throw flags.error;
        if (active) {
          setPhotos(rows);
          setReports(flags.data ?? []);
          setError("");
        }
      } catch {
        if (active)
          setError(
            "写真を取得できませんでした。接続と管理者権限を確認してください。",
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 240_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [filter, page, revision]);
  const act = async (
    photo: SpotPhoto,
    decision: "approved" | "rejected" | "delete",
  ) => {
    if (decision === "delete" && !window.confirm("この写真を削除しますか？"))
      return;
    setBusy(true);
    try {
      if (decision === "delete") await deletePhoto(photo);
      else {
        const { error: err } = await supabase.rpc("review_spot_photo", {
          photo_id: photo.id,
          decision,
        });
        if (err) throw err;
      }
      setRevision((r) => r + 1);
    } catch {
      setError("更新できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  };
  const resolveReport = async (photoId: string, reporter: string) => {
    setBusy(true);
    setError("");
    try {
      const { error: err } = await supabase.rpc("resolve_spot_photo_report", {
        target_photo: photoId,
        reporter,
      });
      if (err) throw err;
      setRevision((r) => r + 1);
    } catch {
      setError("通報を更新できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="spot-photos">
      <h2>投稿写真の管理</h2>
      <p>
        写真の内容・撮影場所・権利を確認して公開してください。非公開化しても発行済みの画像リンクは最長5分間有効です。
      </p>
      <label>
        表示する状態{" "}
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="pending">確認待ち</option>
          <option value="approved">公開済み・通報確認</option>
          <option value="rejected">非公開</option>
          <option value="uploading">アップロード未完了</option>
        </select>
      </label>
      <button type="button" onClick={() => setRevision((r) => r + 1)}>
        再読み込み
      </button>
      {error && <p role="alert">{error}</p>}
      {loading && <p role="status">読み込み中…</p>}
      {!loading && !error && !photos.length && (
        <p>該当する投稿はありません。</p>
      )}
      <div className="spot-photo-grid">
        {photos.map((photo) => (
          <figure key={photo.id}>
            {photo.url && (
              <a href={photo.url} target="_blank" rel="noreferrer">
                <img
                  src={photo.url}
                  alt={photo.caption || "投稿写真"}
                  loading="lazy"
                />
              </a>
            )}
            <figcaption>{photo.caption}</figcaption>
            <Link to={`/spots/${photo.spot_id}`}>スポット情報</Link>
            {reports
              .filter((r) => r.photo_id === photo.id)
              .map((r) => (
                <div key={r.user_id}>
                  <p className="photo-report-reason">通報：{r.reason}</p>
                  <button
                    disabled={busy}
                    onClick={() => resolveReport(r.photo_id, r.user_id)}
                  >
                    確認済みにする（写真はそのまま）
                  </button>
                </div>
              ))}
            <div className="spot-photo-actions">
              {photo.status !== "approved" && photo.status !== "uploading" && (
                <button disabled={busy} onClick={() => act(photo, "approved")}>
                  承認・公開
                </button>
              )}
              {photo.status !== "rejected" && photo.status !== "uploading" && (
                <button disabled={busy} onClick={() => act(photo, "rejected")}>
                  非公開
                </button>
              )}
              <button disabled={busy} onClick={() => act(photo, "delete")}>
                削除
              </button>
            </div>
          </figure>
        ))}
      </div>
      <button
        disabled={page === 0 || loading}
        onClick={() => setPage((p) => p - 1)}
      >
        前へ
      </button>
      <span> {page + 1} </span>
      <button
        disabled={photos.length < 24 || loading}
        onClick={() => setPage((p) => p + 1)}
      >
        次へ
      </button>
    </section>
  );
}
