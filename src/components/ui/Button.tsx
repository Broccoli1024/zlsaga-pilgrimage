import type { CSSProperties, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  style?: CSSProperties;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: "var(--color-primary)",
    color: "var(--color-white)",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--color-primary)",
    border: "1px solid var(--color-primary)",
  },
  ghost: {
    background: "var(--color-card)",
    color: "var(--color-text-sub)",
    border: "0.5px solid var(--color-border)",
  },
  danger: {
    background: "transparent",
    color: "var(--color-error)",
    border: "1px solid var(--color-error)",
  },
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "4px 10px", fontSize: "var(--font-size-xs)" },
  md: { padding: "8px 16px", fontSize: "var(--font-size-sm)" },
  lg: { padding: "10px 20px", fontSize: "var(--font-size-md)" },
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  onClick,
  type = "button",
  style,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontWeight: variant === "primary" ? "500" : "normal",
        width: fullWidth ? "100%" : "auto",
        transition: "opacity 0.15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
