import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdSenseUnitProps {
  /** AdSenseで広告ユニットを作成すると発行される data-ad-slot の値 */
  slot: string;
  style?: React.CSSProperties;
  format?: string;
  fullWidthResponsive?: boolean;
}

const CLIENT_ID = "ca-pub-3271827222905842";

/**
 * Google AdSenseの広告ユニットを表示するコンポーネント。
 * AdSense管理画面で「広告ユニット」を作成し、発行された slot ID を渡して使う。
 * サイト審査が完了するまでは空欄で表示されるのが正常な挙動。
 */
export default function AdSenseUnit({
  slot,
  style,
  format = "auto",
  fullWidthResponsive = true,
}: AdSenseUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSenseスクリプトの読み込み前など、失敗しても無視して問題ない
    }
  }, []);

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block", ...style }}
      data-ad-client={CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
    />
  );
}
