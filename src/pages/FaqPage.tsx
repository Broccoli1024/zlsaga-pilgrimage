import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/layout/StaticPageLayout";

interface FaqPageProps {
  onMenuOpen: () => void;
}

export default function FaqPage({ onMenuOpen }: FaqPageProps) {
  const { t } = useTranslation();
  return (
    <StaticPageLayout title={t("faq.title")} onMenuOpen={onMenuOpen}>
      <p>{t("faq.comingSoon")}</p>
    </StaticPageLayout>
  );
}
