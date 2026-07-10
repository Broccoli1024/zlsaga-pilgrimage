import StaticPageLayout from "../components/layout/StaticPageLayout";

interface LicensePageProps {
  onMenuOpen: () => void;
}

export default function LicensePage({ onMenuOpen }: LicensePageProps) {
  return (
    <StaticPageLayout title="ℹ️ ライセンス" onMenuOpen={onMenuOpen}>
      <p>準備中です。近日中に内容を掲載します。</p>
    </StaticPageLayout>
  );
}
