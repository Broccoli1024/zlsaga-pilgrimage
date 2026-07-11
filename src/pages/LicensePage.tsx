import type { CSSProperties } from "react";
import StaticPageLayout from "../components/layout/StaticPageLayout";

interface LicensePageProps {
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

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "var(--space-md)",
  fontSize: "var(--font-size-sm)",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "var(--space-sm)",
  borderBottom: "2px solid var(--color-primary)",
  color: "var(--color-text-main)",
};

const tdStyle: CSSProperties = {
  padding: "var(--space-sm)",
  borderBottom: "0.5px solid var(--color-border-light)",
  color: "var(--color-text-main)",
};

export default function LicensePage({ onMenuOpen }: LicensePageProps) {
  return (
    <StaticPageLayout title="ℹ️ ライセンス" onMenuOpen={onMenuOpen}>
      <h2 style={headingStyle}>本アプリのソースコードについて</h2>
      <p style={paragraphStyle}>
        本アプリのソースコードは、MITライセンスのもとで公開しています。
      </p>
      <p style={paragraphStyle}>
        ただし、本アプリが扱う作品名・キャラクター名・スポット情報等のコンテンツは、MITライセンスの対象には含まれません。これらの著作権は、それぞれの権利者に帰属します（詳細は
        <a href="/terms" style={{ color: "var(--color-primary)" }}>
          利用規約
        </a>
        をご確認ください）。
      </p>

      <h2 style={headingStyle}>利用しているオープンソースソフトウェア</h2>
      <p style={paragraphStyle}>
        本アプリは、以下を含むオープンソースソフトウェアを利用して開発されています。
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>ソフトウェア</th>
            <th style={thStyle}>用途</th>
            <th style={thStyle}>ライセンス</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>React / React DOM</td>
            <td style={tdStyle}>UIライブラリ</td>
            <td style={tdStyle}>MIT License</td>
          </tr>
          <tr>
            <td style={tdStyle}>React Router</td>
            <td style={tdStyle}>ルーティング</td>
            <td style={tdStyle}>MIT License</td>
          </tr>
          <tr>
            <td style={tdStyle}>Zustand</td>
            <td style={tdStyle}>状態管理</td>
            <td style={tdStyle}>MIT License</td>
          </tr>
          <tr>
            <td style={tdStyle}>i18next / react-i18next</td>
            <td style={tdStyle}>多言語対応</td>
            <td style={tdStyle}>MIT License</td>
          </tr>
          <tr>
            <td style={tdStyle}>Supabase JS Client</td>
            <td style={tdStyle}>データベース・認証</td>
            <td style={tdStyle}>Apache License 2.0</td>
          </tr>
          <tr>
            <td style={tdStyle}>Mapbox GL JS</td>
            <td style={tdStyle}>地図表示・ルート表示</td>
            <td style={tdStyle}>Mapbox Terms of Service</td>
          </tr>
          <tr>
            <td style={tdStyle}>React Map GL</td>
            <td style={tdStyle}>React用Mapboxラッパー</td>
            <td style={tdStyle}>MIT License</td>
          </tr>
          <tr>
            <td style={tdStyle}>date-fns</td>
            <td style={tdStyle}>日付操作</td>
            <td style={tdStyle}>MIT License</td>
          </tr>
          <tr>
            <td style={tdStyle}>Papa Parse</td>
            <td style={tdStyle}>CSV解析</td>
            <td style={tdStyle}>MIT License</td>
          </tr>
          <tr>
            <td style={tdStyle}>React Hook Form</td>
            <td style={tdStyle}>フォーム管理</td>
            <td style={tdStyle}>MIT License</td>
          </tr>
          <tr>
            <td style={tdStyle}>Lucide React</td>
            <td style={tdStyle}>アイコン</td>
            <td style={tdStyle}>ISC License</td>
          </tr>
        </tbody>
      </table>

      <h2 style={headingStyle}>地図・外部サービスのクレジット表記</h2>
      <ul style={listStyle}>
        <li>
          地図データ：
          <a
            href="https://www.mapbox.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-primary)" }}
          >
            © Mapbox
          </a>
          、
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-primary)" }}
          >
            © OpenStreetMap
          </a>{" "}
          contributors
        </li>
        <li>翻訳機能：DeepL API を利用しています</li>
        <li>
          公共交通経路検索：
          <a
            href="https://transit.ls8h.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-primary)" }}
          >
            Transit API
          </a>
          （てるきち氏提供）を利用しています。交通データは、公共交通オープンデータセンター（ODPT）の提供するデータ（
          <a
            href="https://developer.odpt.org/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-primary)" }}
          >
            https://developer.odpt.org/
          </a>
          ）、および各鉄道・バス事業者・自治体等が公開するGTFSデータ・公式サイトの時刻表情報に基づいています。データの正確性・完全性・最新性は保証されません。運行情報等に関するお問い合わせは、データ提供元（ODPT・各事業者等）へは行わないようお願いいたします。
        </li>
        <li>
          ホスティング：
          <a
            href="https://vercel.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-primary)" }}
          >
            Vercel
          </a>
        </li>
      </ul>

      <p
        style={{
          ...paragraphStyle,
          marginTop: "var(--space-xl)",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-sub)",
        }}
      >
        各ソフトウェア・サービスの権利は、それぞれの著作権者・提供元に帰属します。
      </p>

      <p
        style={{
          ...paragraphStyle,
          marginTop: "var(--space-lg)",
        }}
      >
        このアプリは、多くのオープンソースソフトウェアおよび各種サービスによって支えられています。
        <br />
        開発者・コミュニティ・サービス提供者の皆様に心より感謝いたします。
      </p>
    </StaticPageLayout>
  );
}
