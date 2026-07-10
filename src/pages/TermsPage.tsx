import StaticPageLayout from "../components/layout/StaticPageLayout";

interface TermsPageProps {
  onMenuOpen: () => void;
}

export default function TermsPage({ onMenuOpen }: TermsPageProps) {
  return (
    <StaticPageLayout title="📜 利用規約" onMenuOpen={onMenuOpen}>
      <p>準備中です。近日中に内容を掲載します。</p>
    </StaticPageLayout>
  );
}
