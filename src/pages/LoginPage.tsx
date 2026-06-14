import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("確認メールを送信しました。メールを確認してください。");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>{isSignUp ? "新規登録" : "ログイン"}</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label>メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: "8px",
            marginTop: "4px",
          }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            padding: "8px",
            marginTop: "4px",
          }}
        />
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ padding: "8px 24px", cursor: "pointer" }}
      >
        {loading ? "処理中..." : isSignUp ? "登録" : "ログイン"}
      </button>

      <p
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: "1rem", color: "blue", cursor: "pointer" }}
      >
        {isSignUp ? "ログインはこちら" : "新規登録はこちら"}
      </p>
    </div>
  );
}
