import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import NavMenuButton from "../ui/NavMenuButton";

interface StaticPageLayoutProps {
  title: string;
  children: ReactNode;
  onMenuOpen: () => void;
}

export default function StaticPageLayout({
  title,
  children,
  onMenuOpen,
}: StaticPageLayoutProps) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "var(--color-bg)",
        padding: "var(--space-xl) var(--space-lg)",
      }}
    >
      <NavMenuButton
        onClick={onMenuOpen}
        className="nav-menu-btn"
        style={{ position: "absolute", top: "var(--space-xl)" }}
      />

      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <Link
          to="/"
          style={{
            display: "inline-block",
            marginBottom: "var(--space-lg)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-primary)",
            textDecoration: "none",
          }}
        >
          ← 地図に戻る
        </Link>

        <h1
          style={{
            margin: "0 0 var(--space-md)",
            fontSize: "var(--font-size-xl)",
            color: "var(--color-text-main)",
            fontWeight: "500",
          }}
        >
          {title}
        </h1>

        <div
          style={{
            height: "2px",
            background: "var(--color-primary)",
            borderRadius: "1px",
            marginBottom: "var(--space-xl)",
          }}
        />

        <div
          style={{
            fontSize: "var(--font-size-md)",
            color: "var(--color-text-main)",
            lineHeight: 1.8,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
