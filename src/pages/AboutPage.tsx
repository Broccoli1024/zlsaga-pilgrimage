import StaticPageLayout from "../components/layout/StaticPageLayout";

interface AboutPageProps {
  onMenuOpen: () => void;
}

export default function AboutPage({ onMenuOpen }: AboutPageProps) {
  return (
    <StaticPageLayout title="📖 このアプリについて" onMenuOpen={onMenuOpen}>
      <p>準備中です。近日中に内容を掲載します。</p>
    </StaticPageLayout>
  );
}
