import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import StaticPageLayout from "../components/layout/StaticPageLayout";
import SEO from "../components/seo/SEO";
import { findGuideArticle } from "../data/guideArticles";

interface GuideArticlePageProps {
  onMenuOpen: () => void;
}

const headingStyle: CSSProperties = {
  margin: "var(--space-xl) 0 var(--space-sm)",
  fontSize: "var(--font-size-lg)",
  color: "var(--color-text-main)",
  fontWeight: 500,
};

const paragraphStyle: CSSProperties = { margin: "0 0 var(--space-md)" };

export default function GuideArticlePage({
  onMenuOpen,
}: GuideArticlePageProps) {
  const { slug } = useParams();
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const article = slug ? findGuideArticle(slug) : undefined;

  if (!article) {
    return (
      <StaticPageLayout
        title={isEn ? "Guide not found" : "ガイドが見つかりません"}
        onMenuOpen={onMenuOpen}
      >
        <p>
          {isEn
            ? "Return to the guide index to choose another article."
            : "ガイド一覧へ戻り、別の記事を選んでください。"}
        </p>
        <Link to="/guide">{isEn ? "Guide index →" : "ガイド一覧へ →"}</Link>
      </StaticPageLayout>
    );
  }

  const title = isEn ? article.titleEn : article.titleJa;
  const description = isEn ? article.descriptionEn : article.descriptionJa;

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={`/guide/${article.slug}`}
      />
      <StaticPageLayout title={title} onMenuOpen={onMenuOpen}>
        <article>
          <p style={paragraphStyle}>
            {isEn ? article.introEn : article.introJa}
          </p>
          {article.sections.map((section) => (
            <section key={section.headingJa}>
              <h2 style={headingStyle}>
                {isEn ? section.headingEn : section.headingJa}
              </h2>
              {(isEn ? section.paragraphsEn : section.paragraphsJa).map(
                (paragraph) => (
                  <p key={paragraph} style={paragraphStyle}>
                    {paragraph}
                  </p>
                ),
              )}
            </section>
          ))}
          {article.spots.length > 0 && (
            <section>
              <h2 style={headingStyle}>
                {isEn
                  ? "Locations used in this guide"
                  : "このガイドで紹介したスポット"}
              </h2>
              <ul>
                {article.spots.map((spot) => (
                  <li key={spot.id}>
                    <Link to={`/spots/${spot.id}`}>
                      {isEn ? spot.en : spot.ja}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p style={{ ...paragraphStyle, marginTop: "var(--space-xl)" }}>
            <Link to="/guide">
              ← {isEn ? "Back to the pilgrimage guide" : "聖地巡礼ガイドへ戻る"}
            </Link>
          </p>
        </article>
      </StaticPageLayout>
    </>
  );
}
