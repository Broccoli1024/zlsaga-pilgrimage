import type { CSSProperties } from "react";
import StaticPageLayout from "../components/layout/StaticPageLayout";

interface TermsPageProps {
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

export default function TermsPage({ onMenuOpen }: TermsPageProps) {
  return (
    <StaticPageLayout title="📜 利用規約" onMenuOpen={onMenuOpen}>
      <p style={paragraphStyle}>
        本利用規約（以下「本規約」といいます。）は、Bro（以下「運営者」といいます。）が提供する「Pilgrimapp（ピルグリマップ）」（以下「本サービス」といいます。）の利用条件を定めるものです。利用者は、本規約に同意した上で本サービスをご利用ください。
      </p>

      <h2 style={headingStyle}>第1条（適用）</h2>
      <p style={paragraphStyle}>
        本規約は、本サービスの利用に関する運営者と利用者との一切の関係に適用されます。
      </p>

      <h2 style={headingStyle}>第2条（本サービスについて）</h2>
      <p style={paragraphStyle}>
        本サービスは、アニメ・漫画・ゲーム等の作品に関連する聖地（ロケ地・モデル地）情報の閲覧、記録およびルート作成等を支援する非公式のファンサービスです。
      </p>
      <p style={paragraphStyle}>
        本サービスは各作品の権利者・製作会社・製作委員会等とは一切関係ありません。
      </p>

      <h2 style={headingStyle}>第3条（アカウント）</h2>
      <ul style={listStyle}>
        <li>
          利用者はメールアドレスおよびパスワードを登録することで、本サービスへログインできます。
        </li>
        <li>利用者は、自らの責任においてアカウントを管理するものとします。</li>
      </ul>

      <h2 style={headingStyle}>第4条（スポット情報・投稿について）</h2>
      <ul style={listStyle}>
        <li>利用者は、スポット情報の提案やその他の情報を投稿できます。</li>
        <li>
          投稿された内容は、運営者が内容を確認し、必要に応じて修正・翻訳・公開・非公開・削除できるものとします。
        </li>
        <li>
          利用者は、第三者の権利を侵害する内容や虚偽の情報を投稿してはなりません。
        </li>
      </ul>

      <h2 style={headingStyle}>第5条（禁止事項）</h2>
      <p style={paragraphStyle}>利用者は、以下の行為を行ってはなりません。</p>
      <ul style={listStyle}>
        <li>法令または公序良俗に反する行為</li>
        <li>犯罪行為またはその助長</li>
        <li>本サービスの運営を妨害する行為</li>
        <li>他の利用者または第三者の権利・利益を侵害する行為</li>
        <li>虚偽の情報を投稿する行為</li>
        <li>不正アクセスその他これに類する行為</li>
        <li>その他、運営者が不適切と判断する行為</li>
      </ul>

      <h2 style={headingStyle}>第6条（知的財産権）</h2>
      <p style={paragraphStyle}>
        本サービスに掲載される作品名、キャラクター名、画像等に関する著作権・商標権その他の権利は、それぞれの権利者に帰属します。
      </p>
      <p style={paragraphStyle}>
        利用者が投稿した内容については、利用者本人が必要な権利を有しているものとします。
      </p>

      <h2 style={headingStyle}>第7条（免責事項）</h2>
      <p style={paragraphStyle}>
        運営者は、本サービスに掲載する情報の正確性・完全性・最新性を保証するものではありません。
      </p>
      <p style={paragraphStyle}>
        巡礼の際は、現地のルールやマナーを守り、安全に十分配慮してください。
      </p>
      <p style={paragraphStyle}>
        本サービスの利用によって生じた損害について、運営者は故意または重大な過失がある場合を除き、一切の責任を負いません。
      </p>

      <h2 style={headingStyle}>第8条（サービスの変更・停止）</h2>
      <p style={paragraphStyle}>
        運営者は、利用者への事前通知なく、本サービスの内容を変更・停止・終了することがあります。
      </p>

      <h2 style={headingStyle}>第9条（規約の変更）</h2>
      <p style={paragraphStyle}>運営者は、必要に応じて本規約を変更できます。</p>
      <p style={paragraphStyle}>
        変更後の規約は、本サービス上に掲載した時点から効力を生じるものとします。
      </p>

      <h2 style={headingStyle}>第10条（準拠法・裁判管轄）</h2>
      <p style={paragraphStyle}>本規約は日本法に準拠します。</p>
      <p style={paragraphStyle}>
        本サービスに関して紛争が生じた場合は、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
      </p>

      <p
        style={{
          ...paragraphStyle,
          marginTop: "var(--space-xl)",
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-sub)",
        }}
      >
        制定日：2026年7月11日　最終更新日：2026年7月11日
      </p>
    </StaticPageLayout>
  );
}
