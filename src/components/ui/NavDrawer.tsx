import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface MenuItem {
  icon: string;
  labelKey: string;
  to?: string;
  href?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: "📖", labelKey: "nav.about", to: "/about" },
  {
    icon: "🗺",
    labelKey: "nav.suggestSpot",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSfpAy3zvl3G6IdRTD6mhA4g1nZ49NKV4LxDJfE8jbk91e85nA/viewform",
  },
  {
    icon: "🐞",
    labelKey: "nav.feedback",
    href: "https://docs.google.com/forms/d/16xCEsny8eq4bh5kJH-HwE540jxCvBPfu9DyPXk5uVCI/viewform",
  },
  { icon: "❓", labelKey: "nav.faq", to: "/faq" },
  { icon: "🔒", labelKey: "nav.privacy", to: "/privacy" },
  { icon: "📜", labelKey: "nav.terms", to: "/terms" },
  { icon: "ℹ️", labelKey: "nav.license", to: "/license" },
];

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 右からスライドインするメニューパネル本体（オーバーレイ含む）。
 * 開閉ボタンは呼び出し側で用意し、isOpen/onCloseで制御する。
 */
export default function NavDrawer({ isOpen, onClose }: NavDrawerProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* 背景オーバーレイ */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            zIndex: 9,
            transition: "opacity 0.2s",
          }}
        />
      )}

      {/* 右からスライドインするパネル */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          width: "min(320px, 85vw)",
          background: "var(--color-bg)",
          boxShadow: "var(--shadow-lg)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease-out",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--space-lg)",
            borderBottom: "2px solid var(--color-primary)",
            background: "var(--color-card)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: "500",
              fontSize: "var(--font-size-md)",
              color: "var(--color-text-main)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {t("nav.other")}
          </p>
          <button
            onClick={onClose}
            aria-label={t("nav.close")}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "20px",
              cursor: "pointer",
              color: "var(--color-text-sub)",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* メニュー項目 */}
        <div style={{ flex: 1, padding: "var(--space-sm) 0" }}>
          {MENU_ITEMS.map((item) =>
            item.to ? (
              <Link
                key={item.labelKey}
                to={item.to}
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "var(--space-md) var(--space-lg)",
                  textDecoration: "none",
                  color: "var(--color-text-main)",
                  fontSize: "var(--font-size-md)",
                  borderBottom: "0.5px solid var(--color-border-light)",
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                {t(item.labelKey)}
              </Link>
            ) : (
              <a
                key={item.labelKey}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "var(--space-md) var(--space-lg)",
                  textDecoration: "none",
                  color: "var(--color-text-main)",
                  fontSize: "var(--font-size-md)",
                  borderBottom: "0.5px solid var(--color-border-light)",
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                {t(item.labelKey)}
              </a>
            ),
          )}
        </div>
      </div>
    </>
  );
}
