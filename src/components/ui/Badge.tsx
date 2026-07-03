import type { CSSProperties, ReactNode } from "react";

type BadgeVariant = "primary" | "neutral" | "success" | "warning";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: CSSProperties;
}

const variantStyles: Record<BadgeVariant, CSSProperties> = {
  primary: {
    background: "var(--color-primary-light)",
    color: "var(--color-primary)",
    border: "0.5px solid var(--color-primary)",
  },
  neutral: {
    background: "var(--color-card)",
    color: "var(--color-text-sub)",
    border: "0.5px solid var(--color-border)",
  },
  success: {
    background: "var(--color-success-light)",
    color: "var(--color-success)",
    border: "0.5px solid var(--color-success)",
  },
  warning: {
    background: "var(--color-warning-light)",
    color: "var(--color-warning)",
    border: "0.5px solid var(--color-warning)",
  },
};

export default function Badge({
  children,
  variant = "neutral",
  style,
}: BadgeProps) {
  return (
    <span
      style={{
        ...variantStyles[variant],
        fontSize: "var(--font-size-xs)",
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        display: "inline-block",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
