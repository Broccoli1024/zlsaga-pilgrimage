import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 480;

/**
 * 画面幅が480px以下（index.cssのメディアクエリと同じ基準）かどうかを判定する。
 * リサイズ時にも追従する。
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}
