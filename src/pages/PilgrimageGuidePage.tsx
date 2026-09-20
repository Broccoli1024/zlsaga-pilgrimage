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

const sectionStyle: CSSProperties = {
  marginTop: "var(--space-xl)",
};

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "var(--space-md)",
  margin: "0 0 var(--space-lg)",
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-sm)",
  padding: "var(--space-md)",
  background: "var(--color-card)",
  border: "1px solid var(--color-border-light)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-sm)",
};

const cardLinkStyle: CSSProperties = {
  color: "var(--color-primary)",
  fontWeight: 500,
  textDecoration: "none",
};

interface GuideSpot {
  id: string;
  ja: string;
  en: string;
}

interface AreaFeature {
  ja: string;
  en: string;
  descriptionJa: string;
  descriptionEn: string;
  spots: GuideSpot[];
}

interface ModelRoute {
  ja: string;
  en: string;
  descriptionJa: string;
  descriptionEn: string;
  spots: GuideSpot[];
}

const areaFeatures: AreaFeature[] = [
  {
    ja: "佐賀市街地：ライブと物語を歩く",
    en: "Central Saga: live venues and story scenes",
    descriptionJa:
      "佐賀駅を起点に、ライブ会場や市街地のスポットをつなぐ、初めての巡礼にも組み込みやすいエリアです。",
    descriptionEn:
      "Starting at Saga Station, this compact area connects live venues and story locations and is an easy introduction to pilgrimage.",
    spots: [
      {
        id: "c0a79eb3-d2ed-4ceb-9ac0-61caed1ce4bb",
        ja: "佐賀駅",
        en: "Saga Station",
      },
      {
        id: "7256623c-f2cf-42bf-a77f-87dc136e1ef8",
        ja: "656広場（むつごろう広場）",
        en: "656 Plaza (Mutsugoro Plaza)",
      },
      {
        id: "0e17fe1c-d61e-4150-88cb-852802730bc6",
        ja: "GEILS / SPIRITS",
        en: "GEILS / SPIRITS",
      },
      {
        id: "e4904cc3-7569-4805-80c4-4a1a0089718f",
        ja: "神野公園",
        en: "Kanno Park",
      },
    ],
  },
  {
    ja: "唐津：海・駅・ライブ会場",
    en: "Karatsu: coast, station, and live venues",
    descriptionJa:
      "唐津駅周辺から海側へ広げていくエリア。駅近のスポットと海岸・展望台を分けて計画すると、滞在時間を調整しやすくなります。",
    descriptionEn:
      "Expand from Karatsu Station toward the coast. Separating station-area stops from beaches and viewpoints makes the day easier to pace.",
    spots: [
      {
        id: "33079d4d-1d00-434d-8119-06de769bea39",
        ja: "唐津駅",
        en: "Karatsu Station",
      },
      {
        id: "24dc04cb-2b8e-40f5-8449-2a3c036088d4",
        ja: "唐津市ふるさと会館アルピノ",
        en: "Karatsu City Furusato Hall Alpino",
      },
      {
        id: "6884bbc5-a3ed-4244-aecc-f9ea976e4669",
        ja: "唐津市歴史民俗資料館",
        en: "Karatsu City Museum of History and Folklore",
      },
      {
        id: "b0c6786f-a824-4ba7-95ac-9f2e3800ff1b",
        ja: "鏡山展望台",
        en: "Kagamiyama Observation Deck",
      },
    ],
  },
  {
    ja: "嬉野・武雄：温泉と周辺スポット",
    en: "Ureshino and Takeo: hot springs and nearby spots",
    descriptionJa:
      "温泉街で休憩を取りながら、嬉野と武雄のスポットを組み合わせるエリアです。営業時間や入館情報は出発前に各施設で確認してください。",
    descriptionEn:
      "Combine Ureshino and Takeo locations with breaks in the hot-spring towns. Check opening hours and admission information with each facility before leaving.",
    spots: [
      {
        id: "83029f8b-1fda-4306-9982-73e85ab3c3d9",
        ja: "嬉野温泉 湯宿広場",
        en: "Ureshino Onsen: Yuyado Plaza",
      },
      {
        id: "2b08b365-abb3-438e-8a6c-80e3fcc69f5d",
        ja: "cafe moka",
        en: "Cafe Moka",
      },
      {
        id: "4437f083-0123-484d-84ef-e9c4ca87b977",
        ja: "武雄温泉新館",
        en: "Takeo Onsen New Wing",
      },
      {
        id: "4e465a10-f7d4-4f5e-9987-2cc1509d7961",
        ja: "佐賀県立宇宙科学館 ゆめぎんが",
        en: "Saga Prefectural Space Science Museum Yumeginga",
      },
    ],
  },
];

const modelRoutes: ModelRoute[] = [
  {
    ja: "半日：佐賀駅から市街地へ",
    en: "Half day: Saga Station to the city center",
    descriptionJa:
      "駅を起点に市街地のスポットを選び、滞在時間に合わせて立ち寄り先を増減するルートです。",
    descriptionEn:
      "Start at the station and adjust the number of city-center stops to fit the time you have.",
    spots: [
      {
        id: "c0a79eb3-d2ed-4ceb-9ac0-61caed1ce4bb",
        ja: "佐賀駅",
        en: "Saga Station",
      },
      {
        id: "7256623c-f2cf-42bf-a77f-87dc136e1ef8",
        ja: "656広場（むつごろう広場）",
        en: "656 Plaza (Mutsugoro Plaza)",
      },
      {
        id: "0e17fe1c-d61e-4150-88cb-852802730bc6",
        ja: "GEILS / SPIRITS",
        en: "GEILS / SPIRITS",
      },
    ],
  },
  {
    ja: "1日：唐津駅から海側へ",
    en: "Full day: Karatsu Station toward the coast",
    descriptionJa:
      "駅周辺のスポットを先に訪ね、午後に海岸や展望台を組み合わせる想定です。移動手段に応じて順番を組み替えてください。",
    descriptionEn:
      "Visit station-area locations first, then add a beach or viewpoint in the afternoon. Reorder the stops for your chosen transport mode.",
    spots: [
      {
        id: "33079d4d-1d00-434d-8119-06de769bea39",
        ja: "唐津駅",
        en: "Karatsu Station",
      },
      {
        id: "24dc04cb-2b8e-40f5-8449-2a3c036088d4",
        ja: "唐津市ふるさと会館アルピノ",
        en: "Karatsu City Furusato Hall Alpino",
      },
      {
        id: "b0c6786f-a824-4ba7-95ac-9f2e3800ff1b",
        ja: "鏡山展望台",
        en: "Kagamiyama Observation Deck",
      },
    ],
  },
  {
    ja: "温泉を組み込む：嬉野・武雄",
    en: "Add a hot-spring stop: Ureshino and Takeo",
    descriptionJa:
      "スポット巡りの途中に休憩を入れやすい組み合わせです。施設の営業状況を確認し、無理のない件数に絞ってください。",
    descriptionEn:
      "This combination makes it easy to include a break. Check facility hours and keep the number of stops realistic.",
    spots: [
      {
        id: "83029f8b-1fda-4306-9982-73e85ab3c3d9",
        ja: "嬉野温泉 湯宿広場",
        en: "Ureshino Onsen: Yuyado Plaza",
      },
      {
        id: "2b08b365-abb3-438e-8a6c-80e3fcc69f5d",
        ja: "cafe moka",
        en: "Cafe Moka",
      },
      {
        id: "4437f083-0123-484d-84ef-e9c4ca87b977",
        ja: "武雄温泉新館",
        en: "Takeo Onsen New Wing",
      },
    ],
  },
];

function SpotLinks({ spots, isEn }: { spots: GuideSpot[]; isEn: boolean }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px" }}>
      {spots.map((spot) => (
        <Link key={spot.id} to={`/spots/${spot.id}`} style={cardLinkStyle}>
          {isEn ? spot.en : spot.ja}
        </Link>
      ))}
    </div>
  );
}

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
              character, or appearance. Grouping nearby locations reduces travel
              time and leaves more time to enjoy each place.
            </p>

            <h2 style={headingStyle}>2. Understand the spot labels</h2>
            <p style={paragraphStyle}>
              “Sacred” identifies a filming or inspiration location that appears
              in the work. “Sightseeing” identifies a nearby place that can be
              combined with a pilgrimage itinerary. Episode and scene details on
              each spot page help you decide which locations matter most to your
              trip.
            </p>

            <h2 style={headingStyle}>
              3. Build a route you can actually finish
            </h2>
            <ul style={listStyle}>
              <li>Select the locations you most want to visit.</li>
              <li>Choose walking, driving, or public transport.</li>
              <li>
                Include time spent at each location, not only travel time.
              </li>
              <li>
                Leave extra time for transfers, meals, and unexpected delays.
              </li>
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
              entrances, keep noise down, and ask before photographing people or
              private property. Do not enter restricted areas.
            </p>

            <h2 style={headingStyle}>5. Keep and improve your record</h2>
            <p style={paragraphStyle}>
              After visiting, use check-in and favorites to keep track of your
              trip. If a pin, access note, or scene description is incorrect,
              send the details through the suggestion form so the listing can be
              reviewed and improved.
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

        <section style={sectionStyle}>
          <h2 style={headingStyle}>
            {isEn ? "Featured areas" : "エリア別の見どころ"}
          </h2>
          <p style={paragraphStyle}>
            {isEn
              ? "These are compact starting points built from the locations already registered in Pilgrimapp. Open each spot for the latest access details, then adjust the order in the route planner."
              : "ピルグリマップに登録済みのスポットから、最初に計画しやすいまとまりを選びました。各スポットの最新のアクセス情報を確認し、最後にルート作成で順番を調整してください。"}
          </p>
          <div style={cardGridStyle}>
            {areaFeatures.map((area) => (
              <article key={area.ja} style={cardStyle}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "var(--font-size-lg)",
                    color: "var(--color-text-main)",
                    fontWeight: 500,
                  }}
                >
                  {isEn ? area.en : area.ja}
                </h3>
                <p style={{ ...paragraphStyle, flex: 1 }}>
                  {isEn ? area.descriptionEn : area.descriptionJa}
                </p>
                <SpotLinks spots={area.spots} isEn={isEn} />
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>{isEn ? "Model routes" : "モデルルート"}</h2>
          <p style={paragraphStyle}>
            {isEn
              ? "A model route is a starting idea, not a fixed itinerary. Select the stops you want and let Pilgrimapp recalculate the route for walking, driving, or public transport."
              : "モデルルートは旅程を固定するものではなく、計画を始めるためのたたき台です。訪れたい場所を選び、徒歩・自動車・公共交通機関に合わせてピルグリマップで再計算してください。"}
          </p>
          <div style={cardGridStyle}>
            {modelRoutes.map((route) => (
              <article key={route.ja} style={cardStyle}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "var(--font-size-lg)",
                    color: "var(--color-text-main)",
                    fontWeight: 500,
                  }}
                >
                  {isEn ? route.en : route.ja}
                </h3>
                <p style={{ ...paragraphStyle, flex: 1 }}>
                  {isEn ? route.descriptionEn : route.descriptionJa}
                </p>
                <SpotLinks spots={route.spots} isEn={isEn} />
                <Link
                  to={`/routes/new?spots=${route.spots.map((spot) => spot.id).join(",")}`}
                  style={cardLinkStyle}
                >
                  {isEn
                    ? "Open this route in the planner →"
                    : "この候補をルート作成で開く →"}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <p style={{ ...paragraphStyle, marginTop: "var(--space-xl)" }}>
          <Link to="/spots" style={{ color: "var(--color-primary)" }}>
            {isEn ? "Browse the spot list →" : "スポット一覧から計画を始める →"}
          </Link>
        </p>
      </StaticPageLayout>
    </>
  );
}
