import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import "./styles/theme.css";

// Edge Middleware(middleware.ts)がSEO用に<title>/<meta>/<link>を
// サーバー側のHTMLへ直接埋め込んでいる。react-helmet-asyncはこれらを
// 「自分が管理しているタグ」として認識できず、削除せずに新しいタグを
// 追加してしまい重複が発生するため、Reactが起動する前に一度だけ
// Middleware由来のタグを取り除いておく（Helmetがまっさらな状態から
// 自分のタグを追加できるようにする）。
document
  .querySelectorAll(
    'title, meta[name="description"], meta[property^="og:"], link[rel="canonical"], meta[name="twitter:card"]',
  )
  .forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
