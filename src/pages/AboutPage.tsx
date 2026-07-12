import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/layout/StaticPageLayout";

interface AboutPageProps {
  onMenuOpen: () => void;
}

const headingStyle: CSSProperties = {
  margin: "var(--space-xl) 0 var(--space-sm)",
  fontSize: "var(--font-size-lg)",
  color: "var(--color-text-main)",
  fontWeight: "500",
};

const paragraphStyle: CSSProperties = {
  margin: "0 0 var(--space-md)",
};

const listStyle: CSSProperties = {
  margin: "0 0 var(--space-md)",
  paddingLeft: "var(--space-lg)",
};

export default function AboutPage({ onMenuOpen }: AboutPageProps) {
  const { t } = useTranslation();
  return (
    <StaticPageLayout title={t("about.title")} onMenuOpen={onMenuOpen}>
      <p style={paragraphStyle}>{t("about.intro")}</p>

      <h2 style={headingStyle}>{t("about.canDoHeading")}</h2>
      <ul style={listStyle}>
        <li>{t("about.can1")}</li>
        <li>{t("about.can2")}</li>
        <li>{t("about.can3")}</li>
        <li>{t("about.can4")}</li>
        <li>{t("about.can5")}</li>
      </ul>
      <p style={paragraphStyle}>{t("about.filterNote")}</p>

      <h2 style={headingStyle}>{t("about.supportedWorksHeading")}</h2>
      <p style={paragraphStyle}>{t("about.supportedWorksBody")}</p>

      <h2 style={headingStyle}>{t("about.spotInfoHeading")}</h2>
      <p style={paragraphStyle}>
        {t("about.spotInfoBefore")}
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfpAy3zvl3G6IdRTD6mhA4g1nZ49NKV4LxDJfE8jbk91e85nA/viewform"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--color-primary)" }}
        >
          {t("about.spotInfoLink")}
        </a>
        {t("about.spotInfoAfter")}
      </p>

      <h2 style={headingStyle}>{t("about.operatorHeading")}</h2>
      <p style={paragraphStyle}>{t("about.operatorBody")}</p>
      <p style={paragraphStyle}>{t("about.operatorNote")}</p>
    </StaticPageLayout>
  );
}
