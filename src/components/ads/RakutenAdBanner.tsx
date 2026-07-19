interface RakutenAdBannerProps {
  /** 楽天アフィリエイトの「リンク作成」画面で発行されるHTMLタグをそのまま渡す */
  html: string;
  style?: React.CSSProperties;
}

/**
 * 楽天アフィリエイトのリンク作成画面で発行されたHTMLタグをそのまま埋め込むコンポーネント。
 * html は開発者自身が楽天の管理画面から取得した固定のコードのみを渡すこと
 * （ユーザー入力を渡してはいけない）。
 */
export default function RakutenAdBanner({ html, style }: RakutenAdBannerProps) {
  return (
    <div
      style={{ display: "inline-block", ...style }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
