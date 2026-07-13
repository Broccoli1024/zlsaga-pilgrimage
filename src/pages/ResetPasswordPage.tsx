import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import LangToggle from "../components/ui/LangToggle";
import Button from "../components/ui/Button";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // パスワード再設定メールのリンクを踏むと、Supabaseが自動的に
    // PASSWORD_RECOVERYイベント付きの一時セッションを発行する。
    // それを待ってからフォームを表示する。
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // 既にセッションが張られている場合（リロード等）も考慮
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    if (password.length < 6) {
      setError(t("login.passwordTooShort"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMessage(t("login.newPasswordSet"));
      setTimeout(() => navigate("/login"), 2000);
    }
    setLoading(false);
  };

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: "10px 12px",
    marginTop: "6px",
    fontSize: "var(--font-size-md)",
    border: "0.5px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    background: "var(--color-card)",
    color: "var(--color-text-main)",
    boxSizing: "border-box" as const,
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-xl)",
      }}
    >
      <div
        style={{
          background: "var(--color-card)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          padding: "var(--space-xl)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-xl)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "var(--font-size-xl)",
              color: "var(--color-text-main)",
              fontWeight: "500",
            }}
          >
            {t("login.newPasswordTitle")}
          </h1>
          <LangToggle />
        </div>

        <div
          style={{
            height: "2px",
            background: "var(--color-primary)",
            borderRadius: "1px",
            marginBottom: "var(--space-xl)",
          }}
        />

        {!ready ? (
          <p
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
              textAlign: "center",
            }}
          >
            {t("login.invalidResetLink")}
          </p>
        ) : (
          <>
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <label
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-sub)",
                  fontWeight: "500",
                }}
              >
                {t("login.newPassword")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={inputStyle}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "var(--color-error-light)",
                  border: "0.5px solid var(--color-error)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-sm) var(--space-md)",
                  marginBottom: "var(--space-md)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-error)",
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  background: "var(--color-success-light)",
                  border: "0.5px solid var(--color-success)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-sm) var(--space-md)",
                  marginBottom: "var(--space-md)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-success)",
                }}
              >
                {message}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? t("login.processing") : t("login.newPasswordSubmit")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
