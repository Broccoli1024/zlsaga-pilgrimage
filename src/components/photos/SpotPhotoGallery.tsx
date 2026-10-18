import {
  blockAuthor,
  authorLabel,
  PHOTO_VISIBILITY_CHANGED,
} from "../../lib/userSafety";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { supabase } from "../../lib/supabase";
import {
  deletePhoto,
  listSpotPhotos,
  photoUrls,
  uploadSpotPhotos,
} from "../../lib/spotPhotos";
import type { SpotPhoto } from "../../lib/spotPhotos";
import { validatePhotoFiles } from "../../lib/photoImage";

export default function SpotPhotoGallery({
  spotId,
  children,
}: {
  spotId: string;
  children?: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  return (
    <Gallery
      key={`${spotId}:${user?.id ?? "guest"}`}
      spotId={spotId}
      userId={user?.id}
      children={children}
    />
  );
}
function Gallery({
  spotId,
  userId,
  children,
}: {
  spotId: string;
  userId?: string;
  children?: ReactNode;
}) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const tr = (ja: string, english: string) => (en ? english : ja);
  const [photos, setPhotos] = useState<SpotPhoto[]>([]);
  const [mine, setMine] = useState<SpotPhoto[]>([]);
  const [pages, setPages] = useState(1);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [feedbackArea, setFeedbackArea] = useState<"gallery" | "upload">(
    "upload",
  );
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [fileKey, setFileKey] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [reportId, setReportId] = useState<string>();
  const [reportKind, setReportKind] = useState<"photo" | "author">("photo");
  const [reason, setReason] = useState("");
  const load = useCallback(async () => {
    const batches = await Promise.all(
      Array.from({ length: pages }, (_, i) => listSpotPhotos(spotId, i)),
    );
    let own: SpotPhoto[] = [];
    if (userId) {
      const result = await supabase
        .from("spot_photos")
        .select("*")
        .eq("spot_id", spotId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (result.error) throw result.error;
      own = await photoUrls(result.data ?? []);
    }
    return { all: batches.flat(), own, more: batches.at(-1)?.length === 24 };
  }, [pages, spotId, userId]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await load();
        if (active) {
          setPhotos(result.all);
          setMine(result.own);
          setMore(result.more);
          setLoadError("");
        }
      } catch {
        if (active)
          setLoadError(
            "写真を読み込めませんでした。再読み込みしてください。 / Could not load photos. Please retry.",
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 240_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [load, revision]);
  useEffect(() => {
    const refresh = () => {
      setSelected(undefined);
      setRevision((r) => r + 1);
    };
    window.addEventListener(PHOTO_VISIBILITY_CHANGED, refresh);
    return () => window.removeEventListener(PHOTO_VISIBILITY_CHANGED, refresh);
  }, []);
  const block = async (photo: SpotPhoto) => {
    if (
      !window.confirm(
        tr(
          "この投稿者の写真を非表示にしますか？マイページから解除できます。",
          "Hide this author's photos? You can unblock them in My Page.",
        ),
      )
    )
      return;
    setBusy(true);
    setFeedbackArea("gallery");
    setError("");
    setNotice("");
    try {
      await blockAuthor(photo.user_id);
      setPhotos((rows) => rows.filter((row) => row.user_id !== photo.user_id));
      setReportId(undefined);
      setNotice(tr("投稿者をブロックしました。", "Author blocked."));
    } catch {
      setError(tr("ブロックできませんでした。", "Could not block author."));
    } finally {
      setBusy(false);
    }
  };
  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !consent) return;
    setFeedbackArea("upload");
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await uploadSpotPhotos(spotId, files, caption, (n) =>
        setNotice(
          tr(
            `${n}/${files.length}枚を送信済み`,
            `${n}/${files.length} uploaded`,
          ),
        ),
      );
      setNotice(
        tr(
          "投稿を受け付けました。管理者の確認後に公開します。",
          "Submitted. Photos will appear after review.",
        ),
      );
      setFiles([]);
      setCaption("");
      setConsent(false);
      setFileKey((k) => k + 1);
    } catch (e) {
      setNotice("");
      setError(
        e instanceof Error
          ? e.message
          : tr("投稿に失敗しました。", "Upload failed."),
      );
    } finally {
      setBusy(false);
      setRevision((r) => r + 1);
    }
  };
  const remove = async (photo: SpotPhoto) => {
    setFeedbackArea("upload");
    if (
      !window.confirm(tr("この投稿写真を削除しますか？", "Delete this photo?"))
    )
      return;
    setBusy(true);
    setError("");
    try {
      await deletePhoto(photo);
      setRevision((r) => r + 1);
    } catch {
      setError(
        tr(
          "削除できませんでした。もう一度お試しください。",
          "Could not delete. Please retry.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  const report = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || !reportId || !reason.trim()) return;
    setFeedbackArea("gallery");
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const { error: err } =
        reportKind === "author"
          ? await supabase.rpc("report_photo_author", {
              target_photo: reportId,
              report_reason: reason.trim(),
            })
          : await supabase
              .from("spot_photo_reports")
              .insert({
                photo_id: reportId,
                user_id: userId,
                reason: reason.trim(),
              });
      if (err && err.code !== "23505") throw err;
      setNotice(tr("通報を受け付けました。", "Report received."));
      setReportId(undefined);
      setReason("");
    } catch {
      setError(tr("通報できませんでした。", "Could not send report."));
    } finally {
      setBusy(false);
    }
  };
  const enlarged = [...photos, ...mine].find((p) => p.id === selected);
  const feedback = (
    <>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </>
  );
  return (
    <>
      <section className="spot-photos" aria-labelledby="spot-photos-heading">
        <h2 id="spot-photos-heading">
          {tr("みんなの投稿写真", "Community photos")}
        </h2>
        {loading && (
          <p role="status">{tr("写真を読み込み中…", "Loading photos…")}</p>
        )}
        {loadError && (
          <div role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => setRevision((r) => r + 1)}>
              {tr("再読み込み", "Retry")}
            </button>
          </div>
        )}
        {feedbackArea === "gallery" && feedback}
        {!loading && !loadError && photos.length === 0 && (
          <p>
            {tr(
              "公開済みの写真はまだありません。最初の写真を投稿してみませんか。",
              "No published photos yet. Share the first one!",
            )}
          </p>
        )}
        <div className="spot-photo-grid">
          {photos.map((photo) => (
            <figure key={photo.id}>
              <button
                type="button"
                className="spot-photo-open"
                onClick={() => setSelected(photo.id)}
                aria-label={tr("写真を拡大", "Enlarge photo")}
              >
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={
                      photo.caption ||
                      tr("スポットの投稿写真", "Community spot photo")
                    }
                    loading="lazy"
                  />
                ) : (
                  <span>{tr("画像を表示できません", "Image unavailable")}</span>
                )}
              </button>
              {photo.caption && <figcaption>{photo.caption}</figcaption>}
              <p className="photo-author-label">
                {en
                  ? `Author ${photo.user_id.slice(0, 8)}`
                  : authorLabel(photo.user_id)}
              </p>
              {userId && userId !== photo.user_id && (
                <div className="spot-photo-actions">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setReportKind("author");
                      setReportId(photo.id);
                      setReason("");
                    }}
                  >
                    {tr("投稿者を通報", "Report author")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => block(photo)}
                  >
                    {tr("投稿者をブロック", "Block author")}
                  </button>
                </div>
              )}
              {userId && (
                <button
                  type="button"
                  className="spot-photo-report"
                  onClick={() => {
                    setReportKind("photo");
                    setReportId(photo.id);
                    setReason("");
                  }}
                >
                  {tr("通報", "Report")}
                </button>
              )}
            </figure>
          ))}
        </div>
        {more && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setPages((p) => p + 1);
            }}
          >
            {tr("さらに写真を見る", "Load more photos")}
          </button>
        )}
        {enlarged && (
          <div className="spot-photo-enlarged">
            <button type="button" onClick={() => setSelected(undefined)}>
              {tr("拡大表示を閉じる", "Close enlarged photo")}
            </button>
            <img
              src={enlarged.url}
              alt={enlarged.caption || tr("拡大写真", "Enlarged photo")}
            />
          </div>
        )}
        {reportId && (
          <form onSubmit={report} className="spot-photo-form">
            <label>
              {reportKind === "author"
                ? tr("投稿者の通報理由", "Reason for reporting this author")
                : tr("写真の通報理由", "Reason for reporting this photo")}
              <textarea
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <button disabled={busy || !reason.trim()}>
              {tr("通報する", "Send report")}
            </button>
            <button type="button" onClick={() => setReportId(undefined)}>
              {tr("キャンセル", "Cancel")}
            </button>
          </form>
        )}
      </section>
      {children}
      <section
        className="spot-photos"
        aria-labelledby="spot-photo-upload-heading"
      >
        <h2 id="spot-photo-upload-heading">
          {tr("写真を投稿", "Share photos")}
        </h2>
        {feedbackArea === "upload" && feedback}
        {userId ? (
          <form onSubmit={upload} className="spot-photo-form">
            <p>
              {tr(
                "1回3枚まで（JPEG・PNG・WebP、元画像は各20MB以下）。縮小・圧縮し、位置情報を除去して送信します。管理者の確認後に公開されます。保存上限は1人30枚です。",
                "Up to 3 photos per submission (JPEG, PNG or WebP, up to 20 MB each). Photos are resized and GPS metadata removed before upload. Published after review. Storage limit: 30 photos per user.",
              )}
            </p>
            <label>
              {tr("投稿する写真", "Photos to upload")}
              <input
                key={fileKey}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={busy}
                onChange={(e) => {
                  setFeedbackArea("upload");
                  setNotice("");
                  const next = Array.from(e.target.files ?? []);
                  try {
                    validatePhotoFiles(next);
                    setFiles(next);
                    setError("");
                  } catch (err) {
                    setFiles([]);
                    setError((err as Error).message);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            <label>
              {tr(
                "写真の説明（任意・200文字まで）",
                "Caption (optional, up to 200 characters)",
              )}
              <textarea
                maxLength={200}
                value={caption}
                disabled={busy}
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>
            <p>
              <Link to="/terms" target="_blank" rel="noreferrer">
                {tr("写真投稿の利用規約", "Photo submission terms")}
              </Link>
            </p>
            <label className="spot-photo-consent">
              <input
                type="checkbox"
                checked={consent}
                disabled={busy}
                onChange={(e) => setConsent(e.target.checked)}
              />
              {tr(
                "利用規約を確認し、同意しました。自分が撮影した写真で、サイトへの掲載に同意します。人物の顔・車のナンバーなど個人を特定する情報や、撮影禁止の写真は含めません。",
                "I have read and agree to the terms. I took these photos and agree to their publication. They contain no identifying faces, license plates, or prohibited photography.",
              )}
            </label>
            <button type="submit" disabled={busy || !consent || !files.length}>
              {busy
                ? tr("送信中…", "Uploading…")
                : tr("写真を投稿する", "Submit photos")}
            </button>
          </form>
        ) : (
          <p>
            <Link to="/login">
              {tr("ログインして写真を投稿する", "Log in to share photos")}
            </Link>
          </p>
        )}
        {mine.length > 0 && (
          <details>
            <summary>
              {tr("自分の投稿・審査状況", "My submissions and review status")} (
              {mine.length})
            </summary>
            <div className="spot-photo-grid">
              {mine.map((photo) => (
                <figure key={photo.id}>
                  {photo.url && (
                    <img
                      src={photo.url}
                      alt={photo.caption || tr("自分の投稿写真", "My photo")}
                      loading="lazy"
                    />
                  )}
                  <figcaption>
                    {
                      {
                        uploading: tr(
                          "未完了・削除して再投稿してください",
                          "Incomplete — delete and retry",
                        ),
                        pending: tr("確認待ち", "Pending review"),
                        approved: tr("公開済み", "Published"),
                        rejected: tr("非公開", "Not published"),
                      }[photo.status]
                    }
                  </figcaption>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(photo)}
                  >
                    {tr("削除", "Delete")}
                  </button>
                </figure>
              ))}
            </div>
          </details>
        )}
      </section>
    </>
  );
}
