import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  accent?: boolean; // 左ボーダーのアクセントライン
  onClick?: () => void;
  style?: CSSProperties;
}

export default function Card({
  children,
  accent = false,
  onClick,
  style,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--color-card)",
        borderRadius: "var(--radius-md)",
        border: accent ? "none" : "0.5px solid var(--color-border)",
        borderLeft: accent ? "3px solid var(--color-primary)" : undefined,
        padding: "var(--space-md) var(--space-lg)",
        boxShadow: "var(--shadow-sm)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
