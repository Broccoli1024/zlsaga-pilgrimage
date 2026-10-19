import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AdminMfaGate({ onVerified }: { onVerified: () => void }) {
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([]);
  const [factorId, setFactorId] = useState("");
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) setError("認証設定を取得できません。ページを再読み込みしてください。");
      else {
        setFactors(data.totp);
        setFactorId(data.totp[0]?.id ?? "");
      }
      setLoading(false);
    }).catch(() => {
      if (active) { setError("認証設定を取得できません。ページを再読み込みしてください。"); setLoading(false); }
    });
    return () => { active = false; };
  }, []);
  const enroll = async () => {
    setBusy(true); setError("");
    try {
      // Only clean up this screen's abandoned, never-verified setup factors.
      const listed = await supabase.auth.mfa.listFactors();
      if (listed.error) throw listed.error;
      if (listed.data.totp.length) {
        setFactors(listed.data.totp); setFactorId(listed.data.totp[0].id); return;
      }
      for (const factor of listed.data.all) {
        if (factor.factor_type === "totp" && factor.status === "unverified" && factor.friendly_name === "Pilgrimapp admin") {
          const result = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (result.error) throw result.error;
        }
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Pilgrimapp admin", issuer: "Pilgrimapp" });
      if (error) throw error;
      setFactorId(data.id);
      setSetup({ qr: data.totp.qr_code, secret: data.totp.secret });
    } catch {
      setError("登録を開始できませんでした。時間をおいて再度お試しください。");
    } finally { setBusy(false); }
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !factorId || !/^\d{6}$/.test(code)) return;
    setBusy(true); setError("");
    try {
      const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (result.error) throw result.error;
      // The server, not the UI, decides whether the new session can administer data.
      const access = await supabase.rpc("is_admin");
      if (access.error || access.data !== true) throw new Error("Access denied");
      setSetup(null); setCode(""); onVerified();
    } catch {
      setCode("");
      setError("確認できませんでした。認証アプリの最新の6桁コードを入力してください。端末の日時は自動設定にしてください。");
    } finally { setBusy(false); }
  };
  return (
    <main style={{ maxWidth: 560, margin: "2rem auto", padding: "1.5rem" }}>
      <Link to="/">← 地図に戻る</Link>
      <h1>管理者の二段階認証</h1>
      <p>管理操作には、パスワードに加えて認証アプリの6桁コードが必要です。</p>
      {loading && <p role="status">認証設定を確認中…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !factorId && !error && <>
        <p>Google Authenticatorなどの認証アプリをご用意ください。次の画面のQRコードを読み取り、表示されたコードで登録を完了します。</p>
        <p>端末を紛失した場合に備え、認証アプリのバックアップ・移行方法を確認してください。QRコードや設定キーは他人と共有しないでください。</p>
        <button disabled={busy} onClick={enroll}>認証アプリの登録を始める</button>
      </>}
      {!loading && !factorId && error && <button disabled={busy} onClick={() => window.location.reload()}>再読み込み</button>}
      {setup && <>
        <img src={setup.qr.startsWith("data:") ? setup.qr : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr)}`} alt="認証アプリ登録用QRコード（共有しないでください）" style={{ width: 240, maxWidth: "100%", background: "white" }} />
        <details><summary>同じ端末で設定する・QRコードを読めない場合</summary><p>認証アプリで「設定キーを入力」を選び、時間ベースで登録してください。</p><code style={{ overflowWrap: "anywhere" }}>{setup.secret}</code></details>
      </>}
      {factorId && <form className="spot-photo-form" onSubmit={verify}>
        {factors.length > 1 && <label>認証アプリ<select value={factorId} disabled={busy} onChange={(e) => setFactorId(e.target.value)}>{factors.map((f, i) => <option key={f.id} value={f.id}>{f.friendly_name || `認証アプリ ${i+1}`}</option>)}</select></label>}
        <label>6桁の確認コード<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} disabled={busy} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0,6))} /></label>
        <button disabled={busy || !/^\d{6}$/.test(code)}>{busy ? "確認中…" : "確認して管理画面へ"}</button>
      </form>}
      <p>認証アプリを紛失した場合は、運営者用のSupabase管理画面から本人確認のうえ復旧してください。コードや設定キーを問い合わせ文に書かないでください。</p>
    </main>
  );
}
