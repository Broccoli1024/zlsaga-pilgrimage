import { useTranslation } from "react-i18next";

export default function LangToggle() {
  const { i18n } = useTranslation();
  const isJa = i18n.language.startsWith("ja");

  return (
    <button
      onClick={() => i18n.changeLanguage(isJa ? "en" : "ja")}
      style={{
        padding: "4px 10px",
        borderRadius: "6px",
        border: "1px solid #ddd",
        background: "white",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      {isJa ? "EN" : "JA"}
    </button>
  );
}
