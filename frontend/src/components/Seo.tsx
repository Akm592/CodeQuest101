import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { getSeoPage, SITE_URL } from "../lib/seo";

export default function Seo() {
  const { pathname } = useLocation();
  const page = getSeoPage(pathname);
  const url = `${SITE_URL}${page.path}`;

  return (
    <Helmet>
      <title>{page.title}</title>
      <meta name="description" content={page.description} />
      <meta name="robots" content={page.index ? "index, follow" : "noindex, follow"} />
      {page.index && <link rel="canonical" href={url} />}
      <meta property="og:title" content={page.title} />
      <meta property="og:description" content={page.description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="CodeQuest101" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={page.title} />
      <meta name="twitter:description" content={page.description} />
    </Helmet>
  );
}
