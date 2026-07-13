import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import LangToggle from "../components/ui/LangToggle";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    if (isResetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage(t("login.resetSent"));
    } else if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) setError(error.message);
      else setMessage(t("login.confirmationSent"));
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else navigate("/");
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
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--space-xl)",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 2px",
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              聖地巡礼アプリ
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--font-size-xl)",
                color: "var(--color-text-main)",
                fontWeight: "500",
              }}
            >
              {isResetMode
                ? t("login.resetTitle")
                : isSignUp
                  ? t("login.signupTitle")
                  : t("login.title")}
            </h1>
          </div>
          <LangToggle />
        </div>

        {/* アクセントライン */}
        <div
          style={{
            height: "2px",
            background: "var(--color-primary)",
            borderRadius: "1px",
            marginBottom: "var(--space-xl)",
          }}
        />

        {/* フォーム */}
        <div style={{ marginBottom: "var(--space-md)" }}>
          <label
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-sub)",
              fontWeight: "500",
            }}
          >
            {t("login.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        {!isResetMode && (
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <label
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-sub)",
                fontWeight: "500",
              }}
            >
              {t("login.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
            />
          </div>
        )}

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
          {loading
            ? t("login.processing")
            : isResetMode
              ? t("login.resetSubmit")
              : isSignUp
                ? t("login.signupSubmit")
                : t("login.submit")}
        </Button>

        {isResetMode ? (
          <p
            onClick={() => {
              setIsResetMode(false);
              setError(null);
              setMessage(null);
            }}
            style={{
              marginTop: "var(--space-lg)",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-primary)",
              cursor: "pointer",
              textAlign: "center",
              textDecoration: "underline",
            }}
          >
            {t("login.backToLogin")}
          </p>
        ) : (
          <>
            <p
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                marginTop: "var(--space-lg)",
                fontSize: "var(--font-size-sm)",
                color: "var(--color-primary)",
                cursor: "pointer",
                textAlign: "center",
                textDecoration: "underline",
              }}
            >
              {isSignUp ? t("login.toLogin") : t("login.toSignup")}
            </p>
            {!isSignUp && (
              <p
                onClick={() => {
                  setIsResetMode(true);
                  setError(null);
                  setMessage(null);
                }}
                style={{
                  marginTop: "var(--space-sm)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  textAlign: "center",
                  textDecoration: "underline",
                }}
              >
                {t("login.forgotPassword")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
