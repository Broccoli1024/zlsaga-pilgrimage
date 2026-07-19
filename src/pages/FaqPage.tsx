import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/layout/StaticPageLayout";
import SEO from "../components/seo/SEO";

interface FaqPageProps {
  onMenuOpen: () => void;
}

export default function FaqPage({ onMenuOpen }: FaqPageProps) {
  const { t } = useTranslation();
  return (
    <>
      <SEO title={t("faq.title")} canonical="/faq" />
      <StaticPageLayout title={t("faq.title")} onMenuOpen={onMenuOpen}>
        <p>{t("faq.comingSoon")}</p>
      </StaticPageLayout>
    </>
  );
}
