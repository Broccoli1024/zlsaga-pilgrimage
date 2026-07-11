import type { CSSProperties } from "react";
import StaticPageLayout from "../components/layout/StaticPageLayout";

interface AboutPageProps {
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

export default function AboutPage({ onMenuOpen }: AboutPageProps) {
  return (
    <StaticPageLayout title="📖 このアプリについて" onMenuOpen={onMenuOpen}>
      <p style={paragraphStyle}>
        「ピルグリマップ（Pilgrimapp）」は、アニメ・漫画などの作品に登場する聖地（ロケ地・モデル地）を、地図上でめぐるための聖地巡礼支援アプリです。
      </p>

      <h2 style={headingStyle}>できること</h2>
      <ul style={listStyle}>
        <li>作品に登場したスポットを地図上で探す</li>
        <li>
          エリア・カテゴリ・キャラクター・登場度などでスポットを絞り込んで検索する
        </li>
        <li>訪れたスポットをチェックインして記録する</li>
        <li>巡りたいスポットを選んで、最適なルートを自動作成する</li>
        <li>徒歩・車・公共交通機関に対応したルート案内</li>
      </ul>
      <p style={paragraphStyle}>
        フィルタ機能を使ってスポットを柔軟に絞り込めることが、ピルグリマップの特長です。
      </p>

      <h2 style={headingStyle}>対応作品について</h2>
      <p style={paragraphStyle}>
        現在は『ゾンビランドサガ』シリーズの聖地に対応しています。今後、対応作品を順次追加していく予定です。
      </p>

      <h2 style={headingStyle}>スポット情報について</h2>
      <p style={paragraphStyle}>
        掲載しているスポットは、運営が独自に調査したものに加え、ユーザーの皆様からのご提案をもとに随時追加しています。「まだ登録されていないスポットがある」「ここも聖地では」といった情報は、
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfpAy3zvl3G6IdRTD6mhA4g1nZ49NKV4LxDJfE8jbk91e85nA/viewform"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--color-primary)" }}
        >
          こちらのフォーム
        </a>
        からお寄せください。
      </p>

      <h2 style={headingStyle}>運営について</h2>
      <p style={paragraphStyle}>
        本アプリは個人開発者（Bro）による非公式のファンプロジェクトです。各作品の著作権は、それぞれの製作会社・製作委員会等に帰属します。本アプリは公式とは一切関係のない、ファンによる非公式サービスです。
      </p>
      <p style={paragraphStyle}>
        作品や公式情報については、各作品の公式サイト・SNSをご確認ください。
      </p>
    </StaticPageLayout>
  );
}
