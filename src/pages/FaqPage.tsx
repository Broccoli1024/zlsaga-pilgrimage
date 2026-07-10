import StaticPageLayout from "../components/layout/StaticPageLayout";

interface FaqPageProps {
  onMenuOpen: () => void;
}

export default function FaqPage({ onMenuOpen }: FaqPageProps) {
  return (
    <StaticPageLayout title="❓ よくある質問" onMenuOpen={onMenuOpen}>
      <p>準備中です。近日中に内容を掲載します。</p>
    </StaticPageLayout>
  );
}
