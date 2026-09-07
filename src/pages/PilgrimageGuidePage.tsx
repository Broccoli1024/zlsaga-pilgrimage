import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/layout/StaticPageLayout";
import SEO from "../components/seo/SEO";

interface PilgrimageGuidePageProps {
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

export default function PilgrimageGuidePage({
  onMenuOpen,
}: PilgrimageGuidePageProps) {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");

  return (
    <>
      <SEO
        title={isEn ? "Pilgrimage Planning Guide" : "聖地巡礼ガイド"}
        description={
          isEn
            ? "A practical guide to finding Zombie Land Saga locations, planning an efficient route, and visiting responsibly with Pilgrimapp."
            : "ゾンビランドサガの聖地を探し、無理のない巡礼ルートを組み、現地で気持ちよく楽しむためのピルグリマップ活用ガイドです。"
        }
        canonical="/guide"
      />
      <StaticPageLayout
        title={isEn ? "🧭 Pilgrimage Planning Guide" : "🧭 聖地巡礼ガイド"}
        onMenuOpen={onMenuOpen}
      >
        {isEn ? (
          <>
            <p style={paragraphStyle}>
              Pilgrimapp brings together locations from the Zombie Land Saga
              series and nearby sightseeing spots. This guide explains how to
              turn the map into a realistic day plan instead of simply
              collecting pins.
            </p>

            <h2 style={headingStyle}>1. Decide on an area first</h2>
            <p style={paragraphStyle}>
              Spots are spread across Saga Prefecture. Start by choosing one
              area in the spot list, then narrow the results by category,
              character, or appearance. Grouping nearby locations reduces
              travel time and leaves more time to enjoy each place.
            </p>

            <h2 style={headingStyle}>2. Understand the spot labels</h2>
            <p style={paragraphStyle}>
              “Sacred” identifies a filming or inspiration location that
              appears in the work. “Sightseeing” identifies a nearby place that
              can be combined with a pilgrimage itinerary. Episode and scene
              details on each spot page help you decide which locations matter
              most to your trip.
            </p>

            <h2 style={headingStyle}>3. Build a route you can actually finish</h2>
            <ul style={listStyle}>
              <li>Select the locations you most want to visit.</li>
              <li>Choose walking, driving, or public transport.</li>
              <li>Include time spent at each location, not only travel time.</li>
              <li>Leave extra time for transfers, meals, and unexpected delays.</li>
            </ul>
            <p style={paragraphStyle}>
              The automatic route is a planning aid. Always check current
              transport timetables, opening hours, closures, and local traffic
              information before departure.
            </p>

            <h2 style={headingStyle}>4. Visit responsibly</h2>
            <p style={paragraphStyle}>
              Some locations are ordinary streets, businesses, schools, or
              residential areas. Follow posted rules, avoid blocking paths or
              entrances, keep noise down, and ask before photographing people
              or private property. Do not enter restricted areas.
            </p>

            <h2 style={headingStyle}>5. Keep and improve your record</h2>
            <p style={paragraphStyle}>
              After visiting, use check-in and favorites to keep track of your
              trip. If a pin, access note, or scene description is incorrect,
              send the details through the suggestion form so the listing can
              be reviewed and improved.
            </p>
          </>
        ) : (
          <>
            <p style={paragraphStyle}>
              ピルグリマップには、『ゾンビランドサガ』シリーズに登場する場所と、巡礼と一緒に立ち寄りやすい観光スポットを掲載しています。このガイドでは、地図上のピンを見るだけでなく、実際に回れる巡礼計画へ組み立てる方法を紹介します。
            </p>

            <h2 style={headingStyle}>1. まず巡るエリアを決める</h2>
            <p style={paragraphStyle}>
              スポットは佐賀県内の各地に点在しています。最初にスポット一覧でエリアを一つ選び、カテゴリ、登場キャラクター、登場度で絞り込むと計画しやすくなります。近い場所をまとめることで移動時間を抑え、各スポットを楽しむ時間を確保できます。
            </p>

            <h2 style={headingStyle}>2. 「聖地」と「観光」を使い分ける</h2>
            <p style={paragraphStyle}>
              「聖地」は作中に登場したロケ地・モデル地、「観光」は作品に直接登場していなくても周辺で一緒に訪れやすい場所です。各スポットの登場エピソードやシーン説明を確認すると、自分の旅で優先したい場所を選びやすくなります。
            </p>

            <h2 style={headingStyle}>3. 無理なく回れるルートを作る</h2>
            <ul style={listStyle}>
              <li>特に訪れたいスポットから選ぶ</li>
              <li>徒歩・自動車・公共交通機関から移動手段を選ぶ</li>
              <li>移動時間だけでなく、各スポットの滞在時間も含める</li>
              <li>乗り換え、食事、混雑などのために余裕を持たせる</li>
            </ul>
            <p style={paragraphStyle}>
              自動生成されるルートは計画の目安です。出発前には、交通機関の最新時刻、営業時間、休業・通行止め、現地の交通情報を必ず確認してください。
            </p>

            <h2 style={headingStyle}>4. 現地のルールと生活を尊重する</h2>
            <p style={paragraphStyle}>
              掲載場所には、一般の道路、店舗、学校、住宅地なども含まれます。掲示されたルールを守り、通路や出入口をふさがず、大声を控えてください。人物や私有地を撮影するときは許可を取り、立入禁止区域には入らないようにしましょう。
            </p>

            <h2 style={headingStyle}>5. 訪問記録を残し、情報をより良くする</h2>
            <p style={paragraphStyle}>
              訪問後はチェックインやお気に入りを使うと、自分の巡礼記録を整理できます。ピンの位置、アクセス情報、シーン説明などに誤りを見つけた場合は、提案フォームから情報をお寄せください。内容を確認したうえで掲載情報を改善します。
            </p>
          </>
        )}

        <p style={{ ...paragraphStyle, marginTop: "var(--space-xl)" }}>
          <Link to="/spots" style={{ color: "var(--color-primary)" }}>
            {isEn ? "Browse the spot list →" : "スポット一覧から計画を始める →"}
          </Link>
        </p>
      </StaticPageLayout>
    </>
  );
}
