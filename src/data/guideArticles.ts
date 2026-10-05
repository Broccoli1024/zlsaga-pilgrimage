export interface GuideSpotLink {
  id: string;
  ja: string;
  en: string;
}

export interface GuideSection {
  headingJa: string;
  headingEn: string;
  paragraphsJa: string[];
  paragraphsEn: string[];
}

export interface GuideArticle {
  slug: string;
  titleJa: string;
  titleEn: string;
  descriptionJa: string;
  descriptionEn: string;
  introJa: string;
  introEn: string;
  sections: GuideSection[];
  spots: GuideSpotLink[];
}

export const guideArticles: GuideArticle[] = [
  {
    slug: "saga-city",
    titleJa: "佐賀市街地の聖地巡礼を組み立てる",
    titleEn: "Planning a pilgrimage in central Saga",
    descriptionJa:
      "佐賀駅を起点に、ゾンビランドサガの市街地スポットを無理なく巡るためのエリアガイドです。",
    descriptionEn:
      "An area guide for building a realistic Zombie Land Saga pilgrimage from Saga Station through the city center.",
    introJa:
      "佐賀市街地は、鉄道で到着してから徒歩や市内交通を組み合わせやすく、初めての巡礼でも計画の基準を作りやすいエリアです。ここでは、登録済みスポットをどのように選び、半日の行程へまとめるかを説明します。",
    introEn:
      "Central Saga is a practical starting point for a first pilgrimage because a trip can begin at the station and combine walking with local transport. This guide explains how to choose registered locations and shape them into a manageable half-day plan.",
    sections: [
      {
        headingJa: "佐賀駅を計画の基準にする",
        headingEn: "Use Saga Station as the planning anchor",
        paragraphsJa: [
          "列車で訪れる場合は、佐賀駅を出発点と帰着点にすると、到着時刻と帰りの時刻から使える時間を逆算できます。最初から多くの場所を選ばず、特に見たい場面に関係するスポットを二、三か所選んでから追加するのが安全です。",
          "自動車で訪れる場合も、駅周辺と郊外を同じ感覚で扱わず、市街地で歩く区間と車で移動する区間を分けると、駐車や乗り降りに必要な時間を見落としにくくなります。",
        ],
        paragraphsEn: [
          "When arriving by train, using Saga Station as both the start and finish makes it easier to work backward from arrival and departure times. Begin with two or three locations tied to scenes you care about, then add stops only if time remains.",
          "Drivers should also separate walkable city-center stops from locations that require a car. This helps account for parking and the time needed to enter and leave each area.",
        ],
      },
      {
        headingJa: "ライブ会場と市街地の場所をまとめる",
        headingEn: "Group live venues and city locations",
        paragraphsJa: [
          "656広場やGEILS / SPIRITSなど市街地の候補は、地図で位置関係を確認してから順番を決めます。直線距離だけでなく、横断歩道、商店街の通行、休憩を含めて考えると、現地で急ぐ必要が減ります。",
          "イベント開催日には普段と周辺状況が異なることがあります。施設の利用条件やイベント情報は、訪問当日に運営者の公式案内を確認してください。",
        ],
        paragraphsEn: [
          "For city locations such as 656 Plaza and GEILS / SPIRITS, inspect their positions on the map before choosing an order. Include crossings, pedestrian routes, and breaks rather than relying only on straight-line distance.",
          "Conditions may differ on event days. Check the venue operator's current information on the day of the visit for access rules and event details.",
        ],
      },
      {
        headingJa: "半日なら余白を残す",
        headingEn: "Leave room in a half-day plan",
        paragraphsJa: [
          "半日の巡礼では、移動だけで予定を埋めず、写真を撮る時間、作品の場面を確認する時間、食事や休憩の時間を残します。候補を保存しておけば、当日の天候や混雑に応じて一か所減らす判断もしやすくなります。",
          "学校、店舗、住宅に近い場所では、通行や営業を妨げないことを優先してください。公開された場所でも、立入禁止区域や私有地へ入れることを意味しません。",
        ],
        paragraphsEn: [
          "A half-day itinerary should leave time for photographs, checking scenes, meals, and rest. Saving candidate stops makes it easier to remove one when weather or congestion changes the plan.",
          "Near schools, businesses, and homes, give priority to normal traffic and local activity. A publicly listed location does not grant access to private or restricted property.",
        ],
      },
    ],
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
    slug: "karatsu",
    titleJa: "唐津の聖地巡礼を一日にまとめる",
    titleEn: "Building a full-day pilgrimage in Karatsu",
    descriptionJa:
      "唐津駅周辺と海側のスポットを分け、移動手段に合わせて巡るためのゾンビランドサガ聖地巡礼ガイドです。",
    descriptionEn:
      "A Zombie Land Saga pilgrimage guide for separating Karatsu Station-area stops from coastal locations and planning around transport.",
    introJa:
      "唐津エリアには駅の近くで組み合わせやすい場所と、海岸・高所など移動時間を確保したい場所があります。すべてを一続きに並べるのではなく、午前と午後で役割を分けると一日の計画が安定します。",
    introEn:
      "Karatsu combines locations close to the station with coastal and elevated destinations that need more travel time. Dividing the day into station-area and outer-area segments creates a more reliable plan.",
    sections: [
      {
        headingJa: "午前は駅周辺から始める",
        headingEn: "Begin near the station in the morning",
        paragraphsJa: [
          "唐津駅と唐津市ふるさと会館アルピノなど、駅周辺の候補を先にまとめると、到着直後の時間を使いやすくなります。鉄道の遅れや準備時間も考え、最初の予定を詰めすぎないようにします。",
          "各スポットの説明で作品との関係を確認し、自分が見たい場面との結び付きが強い場所を優先すると、単に件数を増やすより満足度の高い巡礼になります。",
        ],
        paragraphsEn: [
          "Grouping Karatsu Station and nearby candidates such as Alpino makes arrival time easier to use. Allow for train delays and preparation rather than filling the first hour too tightly.",
          "Read each spot description and prioritize locations connected to scenes that matter to you. A smaller, meaningful selection is usually more rewarding than maximizing the number of stops.",
        ],
      },
      {
        headingJa: "海側と展望地点は移動手段で選ぶ",
        headingEn: "Choose coastal and viewpoint stops by transport mode",
        paragraphsJa: [
          "鏡山展望台のように駅周辺とは移動条件が異なる場所を加えるときは、徒歩向けの計画をそのまま延長せず、車や公共交通機関の区間として分けて考えます。往復時間を含め、戻る時刻を先に決めておくと安心です。",
          "海岸や展望地点では、天候によって見え方や移動の負担が変わります。悪天候時に無理をせず、駅周辺の候補へ切り替えられる予備案を用意してください。",
        ],
        paragraphsEn: [
          "When adding a location such as the Kagamiyama Observation Deck, treat it as a separate car or public-transport segment instead of extending a walking route. Include the return journey and set a latest return time first.",
          "Weather changes both visibility and travel conditions at coastal and elevated locations. Keep a station-area alternative so that poor conditions do not force an unsafe schedule.",
        ],
      },
      {
        headingJa: "施設情報は訪問前に再確認する",
        headingEn: "Recheck facility information before visiting",
        paragraphsJa: [
          "施設の公開日、営業時間、入館方法は変わることがあります。ピルグリマップは場所選びと経路検討の補助として使い、営業状況は施設や自治体の公式情報で確認してください。",
          "撮影時はほかの来訪者や地域の方を写り込ませない配慮をし、通路や店舗の出入口を占有しないようにします。作品の舞台を楽しむことと、現地の日常を尊重することを両立させましょう。",
        ],
        paragraphsEn: [
          "Opening days, hours, and admission procedures can change. Use Pilgrimapp to choose places and compare routes, then confirm operating details through the facility or local authority's official information.",
          "When taking photographs, avoid including other visitors or residents without permission and never occupy paths or entrances. Enjoying a setting and respecting everyday local life should go together.",
        ],
      },
    ],
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
    slug: "ureshino-takeo",
    titleJa: "嬉野・武雄を巡礼と温泉で楽しむ",
    titleEn: "Combining pilgrimage and hot-spring towns in Ureshino and Takeo",
    descriptionJa:
      "嬉野・武雄のゾンビランドサガ関連スポットを、休憩と移動時間を含めて組み立てるエリアガイドです。",
    descriptionEn:
      "An area guide for combining Zombie Land Saga locations in Ureshino and Takeo with realistic travel and rest time.",
    introJa:
      "嬉野・武雄では、スポットを短時間で数多く回るより、温泉街での休憩や施設での滞在を含めて計画する方が地域の魅力を味わえます。エリア間の移動を一つの区切りとして扱い、余裕のある件数を選びます。",
    introEn:
      "In Ureshino and Takeo, the experience is better when a plan includes rest in the hot-spring towns and time inside facilities rather than trying to collect many stops quickly. Treat travel between the two areas as a major segment and keep the stop count modest.",
    sections: [
      {
        headingJa: "エリア間移動を最初に決める",
        headingEn: "Decide the inter-area journey first",
        paragraphsJa: [
          "嬉野と武雄の両方を訪れる場合は、先にエリア間の移動方法を決め、その前後にスポットを配置します。公共交通機関を使う日は、帰りの便から逆算して最終地点を選ぶと、予定が崩れにくくなります。",
          "自動車でも、駐車場所から目的地までの徒歩や施設内の滞在時間が必要です。地図上の移動時間だけで一日を埋めないようにしてください。",
        ],
        paragraphsEn: [
          "If visiting both Ureshino and Takeo, choose the connection between the areas first and place stops around it. On public transport, work backward from the return service when selecting the final destination.",
          "Even by car, time is needed to walk from parking and spend time at each facility. Do not fill the day using map travel estimates alone.",
        ],
      },
      {
        headingJa: "休憩を予定として扱う",
        headingEn: "Treat rest as part of the itinerary",
        paragraphsJa: [
          "温泉街や飲食店で過ごす時間を余り時間ではなく予定の一部にすると、遅れが出にくくなります。入浴、食事、買い物など、自分が現地で楽しみたいことに合わせてスポット数を調整してください。",
          "店舗は営業日や混雑状況が変わります。特定の店を目的にする場合は、当日に公式情報を確認し、休業時の代替候補も考えておきます。",
        ],
        paragraphsEn: [
          "Scheduling time in the hot-spring district or at a café as a real activity, rather than leftover time, makes delays less likely. Adjust the number of pilgrimage stops around bathing, meals, and shopping you want to enjoy.",
          "Business days and congestion can change. If a particular shop is essential, check its official information that day and keep an alternative for closures.",
        ],
      },
      {
        headingJa: "一日の終点を無理なく選ぶ",
        headingEn: "Choose a practical end point",
        paragraphsJa: [
          "最後のスポットは、宿泊先や帰りの交通へ移りやすい場所から選びます。行きたい順だけで並べるのではなく、日没や疲労も考えて、遠い場所を早めに回す選択も有効です。",
          "寺社、公共施設、店舗ではそれぞれの利用ルールを守ってください。撮影可能な場所でも、参拝者や利用者の動線をふさがず、長時間同じ場所を占有しない配慮が必要です。",
        ],
        paragraphsEn: [
          "Select the final stop based on access to lodging or the return journey. Ordering only by preference can create a difficult finish, so consider daylight and fatigue and visit remote places earlier when appropriate.",
          "Follow the rules of shrines, public facilities, and businesses. Even where photography is allowed, do not block visitors or occupy one position for a long time.",
        ],
      },
    ],
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
  {
    slug: "planning-and-etiquette",
    titleJa: "聖地巡礼の計画と現地マナー",
    titleEn: "Pilgrimage planning and local etiquette",
    descriptionJa:
      "移動時間、天候、撮影、私有地への配慮を含め、聖地巡礼を安全に楽しむための実用ガイドです。",
    descriptionEn:
      "A practical guide to safe pilgrimage planning, including travel time, weather, photography, and respect for private property.",
    introJa:
      "聖地巡礼は、作品の場面と現地の風景を重ねて楽しめる一方、その場所で暮らす人や施設を利用する人と空間を共有する活動です。出発前の計画と現地での小さな配慮が、訪問者にも地域にも気持ちのよい体験を作ります。",
    introEn:
      "A pilgrimage connects scenes from a work with real places, while sharing those places with residents, businesses, and other visitors. Careful planning and simple consideration create a better experience for both travelers and the community.",
    sections: [
      {
        headingJa: "件数ではなく目的で場所を選ぶ",
        headingEn: "Choose places by purpose, not quantity",
        paragraphsJa: [
          "最初に、特に見たい場面、訪れたいキャラクター関連地、地域観光のどれを重視するか決めます。目的に合う場所を優先すると、移動に追われず、一か所ごとの発見を楽しめます。",
          "候補は必須、時間があれば訪問、悪天候時の代替に分けておくと、当日に予定を変更しても失敗と感じにくくなります。",
        ],
        paragraphsEn: [
          "First decide whether the priority is a particular scene, character-related locations, or regional sightseeing. Selecting places that serve that purpose leaves time to notice details instead of rushing between pins.",
          "Separate candidates into essential stops, optional stops, and bad-weather alternatives. This makes a change of plan feel intentional rather than like a failed itinerary.",
        ],
      },
      {
        headingJa: "移動時間に余白を加える",
        headingEn: "Add a margin to travel time",
        paragraphsJa: [
          "経路検索の時間には、乗り換え待ち、駐車、道を確認する時間、撮影や休憩が十分に含まれないことがあります。短い区間でも余白を設け、帰りの便や閉館時刻に直結する予定ほど早めに行動します。",
          "公共交通機関の時刻、道路状況、施設の営業情報は変わります。出発前と当日に公式情報を確認し、ピルグリマップの表示だけで最終判断をしないでください。",
        ],
        paragraphsEn: [
          "Route estimates may not include transfer waits, parking, navigation, photography, or breaks. Add a margin even to short segments and act early when a return service or closing time is involved.",
          "Transport schedules, road conditions, and operating information change. Check official sources before departure and on the day rather than using Pilgrimapp as the final authority.",
        ],
      },
      {
        headingJa: "撮影と立ち入りの境界を守る",
        headingEn: "Respect boundaries for photography and access",
        paragraphsJa: [
          "道路では安全を最優先し、車道へ出たり、通行のための場所に機材を置いたりしないでください。人物、住宅、店内を撮影するときは、必要に応じて許可を取り、位置情報を公開する影響も考えます。",
          "作品に登場する場所であっても、私有地、学校、業務区域、立入禁止区域へ入ることはできません。現地の掲示やスタッフの案内が、地図上の情報より常に優先されます。",
        ],
        paragraphsEn: [
          "On roads, put safety first: do not step into traffic or place equipment in paths. Ask permission when appropriate before photographing people, homes, or interiors, and consider the effect of publishing precise locations.",
          "Appearing in a work does not grant access to private land, schools, work areas, or restricted zones. Signs and staff instructions at the location always take priority over map information.",
        ],
      },
      {
        headingJa: "地域の日常を尊重する",
        headingEn: "Respect everyday local life",
        paragraphsJa: [
          "大声、長時間の滞在、出入口の占有を避け、ごみは持ち帰るか指定場所へ捨てます。店舗を撮影場所としてだけ利用せず、利用条件や混雑に配慮してください。",
          "誤った位置や古い説明を見つけた場合は、提案フォームから根拠とともに知らせてください。利用者からの具体的な情報は、継続的に地図を手入れするための重要な手掛かりになります。",
        ],
        paragraphsEn: [
          "Avoid loud voices, long occupation of one place, and blocking entrances. Take rubbish away or use designated bins, and respect a business as a working place rather than only a photo location.",
          "If a pin or description appears outdated, send the correction and its basis through the suggestion form. Specific reports from visitors help keep the map maintained over time.",
        ],
      },
    ],
    spots: [],
  },
];

export function findGuideArticle(slug: string): GuideArticle | undefined {
  return guideArticles.find((article) => article.slug === slug);
}
