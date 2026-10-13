import { Capacitor } from "@capacitor/core";

const PUBLIC_WEB_ORIGIN = "https://pilgrimapp.jp";

/**
 * Supabaseの確認・再設定メールは、ネイティブWebViewの内部URLではなく
 * 公開Web版へ戻す。Universal Links導入後も同じHTTPS URLを利用できる。
 */
interface AuthRedirectOptions {
  native?: boolean;
  webOrigin?: string;
}

export function getAuthRedirectUrl(
  path: string,
  options: AuthRedirectOptions = {},
): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("認証リダイレクト先はサイト内の絶対パスで指定してください");
  }

  const native = options.native ?? Capacitor.isNativePlatform();
  const origin = native
    ? PUBLIC_WEB_ORIGIN
    : (options.webOrigin ?? window.location.origin);

  return new URL(path, `${origin}/`).toString();
}
