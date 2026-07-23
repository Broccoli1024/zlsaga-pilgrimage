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
