import type { CSSProperties } from "react";
import StaticPageLayout from "../components/layout/StaticPageLayout";

interface PrivacyPolicyPageProps {
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

export default function PrivacyPolicyPage({
  onMenuOpen,
}: PrivacyPolicyPageProps) {
  return (
    <StaticPageLayout title="🔒 プライバシーポリシー" onMenuOpen={onMenuOpen}>
      <p style={paragraphStyle}>
        「ピルグリマップ（Pilgrimapp）」（以下「本アプリ」といいます）は、個人開発者（以下「運営者」といいます）が提供する非公式のファンプロジェクトです。本アプリにおける利用者情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
      </p>

      <h2 style={headingStyle}>1. 取得する情報</h2>
      <p style={paragraphStyle}>
        本アプリでは、アカウント登録・ログインおよびサービス提供のため、以下の情報を取得します。
      </p>
      <ul style={listStyle}>
        <li>メールアドレス（アカウント登録・認証のため）</li>
        <li>パスワード（暗号化された状態で保存されます）</li>
        <li>
          スポットのチェックイン履歴、訪問記録、作成したルートなど、本アプリの利用によって生成される情報
        </li>
      </ul>
      <p style={paragraphStyle}>
        なお、本アプリは端末のGPS等による位置情報を取得しません。
      </p>

      <h2 style={headingStyle}>2. 情報の利用目的</h2>
      <p style={paragraphStyle}>
        取得した情報は、以下の目的の範囲内で利用します。
      </p>
      <ul style={listStyle}>
        <li>アカウントの認証およびログイン状態の維持</li>
        <li>チェックイン履歴・訪問記録・ルート等の保存および表示</li>
        <li>本アプリの機能改善、不具合対応</li>
        <li>利用者からのお問い合わせへの対応</li>
      </ul>

      <h2 style={headingStyle}>3. 第三者への提供・外部サービスの利用</h2>
      <p style={paragraphStyle}>
        本アプリは、以下の外部サービスを利用してホスティング・データの保存・地図表示・ルート検索・翻訳を行っています。各サービスの利用にあたっては、それぞれのプライバシーポリシーが適用されます。
      </p>
      <ul style={listStyle}>
        <li>Vercel（アプリケーションのホスティング）</li>
        <li>Supabase（データベース・認証基盤）</li>
        <li>Mapbox（地図表示、車・徒歩ルートの検索）</li>
        <li>Transit API（公共交通機関の経路検索）</li>
        <li>DeepL API（多言語対応のための翻訳）</li>
      </ul>
      <p style={paragraphStyle}>
        ルート検索機能では、選択されたスポットの位置情報（緯度・経度）が経路検索のためMapboxおよびTransit
        APIに送信されますが、これは利用者個人を特定する情報ではありません。
      </p>
      <p style={paragraphStyle}>
        運営者は、法令に基づく場合を除き、取得した個人情報を利用者の同意なく第三者に提供することはありません。
      </p>

      <h2 style={headingStyle}>4. データの保存・管理</h2>
      <p style={paragraphStyle}>
        取得した情報は、適切な安全管理措置を講じたうえで保存・管理します。ただし、現時点ではアカウントおよびデータの削除（退会）機能は実装されていません。データの削除をご希望の場合は、下記のお問い合わせ窓口までご連絡ください。今後、アプリ内から退会・データ削除を行える機能を追加する予定です。
      </p>

      <h2 style={headingStyle}>5. 情報の開示・訂正・削除</h2>
      <p style={paragraphStyle}>
        利用者は、運営者に対して自己の情報の開示、訂正、削除を求めることができます。ご希望の場合は、下記のお問い合わせ窓口までご連絡ください。内容を確認のうえ、合理的な範囲で対応いたします。
      </p>

      <h2 style={headingStyle}>6. お問い合わせ</h2>
      <p style={paragraphStyle}>
        本ポリシーに関するお問い合わせ、または個人情報の開示・訂正・削除のご希望は、
        <a
          href="https://docs.google.com/forms/d/16xCEsny8eq4bh5kJH-HwE540jxCvBPfu9DyPXk5uVCI/viewform"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--color-primary)" }}
        >
          こちらのフォーム
        </a>
        よりご連絡ください。
      </p>

      <h2 style={headingStyle}>7. 本ポリシーの変更</h2>
      <p style={paragraphStyle}>
        本ポリシーの内容は、法令の改正や本アプリの機能追加等に応じて、予告なく変更されることがあります。変更後のポリシーは、本ページに掲載した時点で効力を生じるものとします。
      </p>

      <p
        style={{
          ...paragraphStyle,
          marginTop: "var(--space-xl)",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-sub)",
        }}
      >
        制定日：2026年7月11日
      </p>
    </StaticPageLayout>
  );
}
