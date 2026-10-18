import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/layout/StaticPageLayout";
import SEO from "../components/seo/SEO";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../stores/authStore";
export default function DeleteAccountPage({
  onMenuOpen,
}: {
  onMenuOpen: () => void;
}) {
  const { i18n } = useTranslation();
  const en = i18n.language.startsWith("en");
  const tr = (ja: string, english: string) => (en ? english : ja);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !confirmed || !password || busy) return;
    if (
      !window.confirm(
        tr(
          "アカウントと関連データを完全に削除します。元に戻せません。削除しますか？",
          "Permanently delete your account and related data? This cannot be undone.",
        ),
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const { data, error: err } = await supabase.functions.invoke(
        "delete-account",
        { body: { password, confirmation: "DELETE" } },
      );
      if (err) {
        let message =
          "削除を完了できませんでした。再試行するか、お問い合わせください。 / Deletion failed. Please retry or contact support.";
        if (err.context instanceof Response) {
          try {
            const body = await err.context.json();
            if (typeof body.error === "string") message = body.error;
          } catch {
            /* generic message */
          }
        }
        throw new Error(message);
      }
      if (!data?.deleted)
        throw new Error(
          "削除完了を確認できませんでした。 / Could not confirm deletion.",
        );
      setDone(true);
      await supabase.auth.signOut({ scope: "local" });
      setUser(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tr("削除に失敗しました。", "Deletion failed."),
      );
    } finally {
      setPassword("");
      setBusy(false);
    }
  };
  return (
    <>
      <SEO title="アカウント削除 | Pilgrimapp" canonical="/delete-account" />
      <StaticPageLayout
        title={tr(
          "ピルグリマップのアカウント削除",
          "Delete your Pilgrimapp account",
        )}
        onMenuOpen={onMenuOpen}
      >
        {done ? (
          <section className="spot-photos">
            <h2>{tr("アカウントを削除しました", "Account deleted")}</h2>
            <p role="status">
              {tr(
                "ご利用ありがとうございました。",
                "Thank you for using Pilgrimapp.",
              )}
            </p>
            <Link to="/">{tr("地図に戻る", "Back to map")}</Link>
          </section>
        ) : (
          <>
            <p>
              {tr(
                "このページから、アプリを再インストールせずに退会できます。アプリ内のマイページからも同じ手続きができます。",
                "You can delete your account here without reinstalling the app. This page is also accessible from My Page in the app.",
              )}
            </p>
            <section className="spot-photos">
              <h2>{tr("削除するデータ", "Data to be deleted")}</h2>
              <ul>
                <li>
                  {tr(
                    "アカウント、メールアドレス、プロフィール情報・画像",
                    "Account, email address, profile and avatar",
                  )}
                </li>
                <li>
                  {tr(
                    "チェックイン・訪問履歴、お気に入り、保存したルート",
                    "Check-ins, visit history, favorites and saved routes",
                  )}
                </li>
                <li>
                  {tr(
                    "投稿写真（公開済み・確認待ちを含む）と写真の説明",
                    "All submitted photos, including published and pending photos, and captions",
                  )}
                </li>
                <li>
                  {tr(
                    "ブロック設定、アカウントに紐づく通報・利用記録",
                    "Blocks, reports and activity records associated with your account",
                  )}
                </li>
              </ul>
              <p>
                {tr(
                  "削除は取り消せません。画像の削除後にアカウントを削除します。途中で通信に失敗すると一部の画像だけが削除される場合があるため、完了表示が出るまで再試行してください。",
                  "Deletion cannot be undone. Images are removed before the account. If interrupted, some images may already be removed; retry until completion is confirmed.",
                )}
              </p>
              {user ? (
                <form className="spot-photo-form" onSubmit={submit}>
                  <p>
                    {tr(
                      "現在ログインしているアカウントだけを削除します。",
                      "Only the currently signed-in account will be deleted.",
                    )}
                  </p>
                  <label>
                    {tr("現在のパスワード", "Current password")}
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      disabled={busy}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>
                  <label className="spot-photo-consent">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      disabled={busy}
                      onChange={(e) => setConfirmed(e.target.checked)}
                    />
                    {tr(
                      "削除対象と、元に戻せないことを確認しました。",
                      "I understand what will be deleted and that this cannot be undone.",
                    )}
                  </label>
                  {error && <p role="alert">{error}</p>}
                  <button
                    type="submit"
                    disabled={busy || !confirmed || !password}
                  >
                    {busy
                      ? tr("削除処理中…", "Deleting…")
                      : tr(
                          "アカウントとデータを削除",
                          "Delete account and data",
                        )}
                  </button>
                </form>
              ) : (
                <p>
                  <Link to="/login?next=/delete-account">
                    {tr(
                      "ログインして削除手続きへ",
                      "Log in to delete your account",
                    )}
                  </Link>
                </p>
              )}
            </section>
            <p>
              {tr(
                "ログインできない場合や削除が完了しない場合は、以下の窓口で「ピルグリマップのアカウント削除希望」と登録メールアドレスをお知らせください。本人確認後に対応します。パスワードは送らないでください。",
                "If you cannot log in or complete deletion, use the support form below, request Pilgrimapp account deletion and provide your registered email address. We will verify ownership. Do not send your password.",
              )}
            </p>
            <a
              href="https://docs.google.com/forms/d/16xCEsny8eq4bh5kJH-HwE540jxCvBPfu9DyPXk5uVCI/viewform"
              target="_blank"
              rel="noreferrer"
            >
              {tr(
                "アカウント削除の相談・申請窓口",
                "Account deletion request and support",
              )}
            </a>
            <p>
              <Link to="/privacy">
                {tr("プライバシーポリシー", "Privacy policy")}
              </Link>
            </p>
          </>
        )}
      </StaticPageLayout>
    </>
  );
}
