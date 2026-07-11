import type { CSSProperties } from "react";

interface NavMenuButtonProps {
  onClick: () => void;
  style: CSSProperties;
  className?: string;
}

export default function NavMenuButton({
  onClick,
  style,
  className,
}: NavMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="メニューを開く"
      className={className}
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        background: "var(--color-card)",
        boxShadow: "var(--shadow-md)",
        cursor: "pointer",
        fontSize: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-text-main)",
        zIndex: 3,
        ...style,
      }}
    >
      ☰
    </button>
  );
}
