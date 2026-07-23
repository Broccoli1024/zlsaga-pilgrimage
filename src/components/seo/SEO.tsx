import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
}

const SITE_NAME = "Pilgrimapp";
const BASE_URL = "https://pilgrimapp.jp";

export default function SEO({
  title,
  description,
  canonical,
  image,
}: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;

  useEffect(() => {
    // Edge Middlewareがサーバー側で埋め込んだ<title>/<meta>/<link>タグは
    // react-helmet-asyncが「自分の管理下」と認識できず、削除せずに
    // 新しいタグを追加してしまうため重複が発生する。
    // Helmetが自分のタグにdata-rh="true"を付与するのを利用し、
    // それが付いていない同種のタグ（＝middleware由来の古いタグ）を
    // 初回マウント時に一度だけ掃除する。
    const cleanup = () => {
      document
        .querySelectorAll(
          'title:not([data-rh]), meta[name="description"]:not([data-rh]), meta[property^="og:"]:not([data-rh]), link[rel="canonical"]:not([data-rh]), meta[name="twitter:card"]:not([data-rh])',
        )
        .forEach((el) => el.remove());
    };
    // Helmetのタグ挿入(useEffect)より後に実行されるよう1フレーム遅らせる
    const id = requestAnimationFrame(cleanup);
    return () => cancelAnimationFrame(id);
  }, [fullTitle, description, canonical, image]);

  return (
    <Helmet>
      <title>{fullTitle}</title>

      {description && <meta name="description" content={description} />}

      {canonical && <link rel="canonical" href={`${BASE_URL}${canonical}`} />}

      <meta property="og:title" content={fullTitle} />

      {description && <meta property="og:description" content={description} />}

      {image && <meta property="og:image" content={image} />}

      <meta property="og:type" content="website" />

      <meta property="og:site_name" content={SITE_NAME} />

      <meta property="og:url" content={`${BASE_URL}${canonical ?? ""}`} />

      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
