import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/layout/StaticPageLayout";
import SEO from "../components/seo/SEO";

interface FaqPageProps {
  onMenuOpen: () => void;
}

const QA_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"];

export default function FaqPage({ onMenuOpen }: FaqPageProps) {
  const { t } = useTranslation();
  return (
    <>
      <SEO title={t("faq.title")} description={t("faq.a1")} canonical="/faq" />
      <StaticPageLayout title={t("faq.title")} onMenuOpen={onMenuOpen}>
        {QA_KEYS.map((key) => (
          <div key={key} style={{ marginBottom: "var(--space-xl)" }}>
            <h2
              style={{
                margin: "0 0 var(--space-sm)",
                fontSize: "var(--font-size-lg)",
                color: "var(--color-primary)",
                fontWeight: "500",
              }}
            >
              Q. {t(`faq.${key}`)}
            </h2>
            <p
              style={{
                margin: 0,
                lineHeight: 1.7,
                color: "var(--color-text-main)",
              }}
            >
              A. {t(`faq.a${key.slice(1)}`)}
            </p>
          </div>
        ))}
      </StaticPageLayout>
    </>
  );
}
