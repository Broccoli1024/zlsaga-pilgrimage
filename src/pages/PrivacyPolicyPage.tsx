import StaticPageLayout from "../components/layout/StaticPageLayout";

interface PrivacyPolicyPageProps {
  onMenuOpen: () => void;
}

export default function PrivacyPolicyPage({
  onMenuOpen,
}: PrivacyPolicyPageProps) {
  return (
    <StaticPageLayout title="🔒 プライバシーポリシー" onMenuOpen={onMenuOpen}>
      <p>準備中です。近日中に内容を掲載します。</p>
    </StaticPageLayout>
  );
}
