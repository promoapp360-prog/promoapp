import { useEffect } from "react";
import { useLocation } from "wouter";
import seoPages from "../../lib/seo-pages.json";
import { PUBLIC_ORIGIN } from "../../lib/marketing";
import { trackPage } from "../../lib/analytics";

type SEO = { title: string; description: string; canonical?: string; noindex?: boolean };
export default function PageSEO() {
  const [path] = useLocation();
  useEffect(() => {
    const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
    const seo = (seoPages as Record<string, SEO>)[clean] ?? {
      title: "Anteprima progetto | PromoApp.it", description: "Area di anteprima del progetto.", noindex: true,
    };
    document.title = seo.title;
    function meta(name: string, content: string, property = false) {
      const attribute = property ? "property" : "name";
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, name); document.head.appendChild(element); }
      element.content = content;
    }
    const canonicalUrl = `${PUBLIC_ORIGIN}${seo.canonical ?? clean}`;
    meta("description", seo.description); meta("robots", seo.noindex ? "noindex, nofollow" : "index, follow");
    meta("og:title", seo.title, true); meta("og:description", seo.description, true); meta("og:url", canonicalUrl, true);
    meta("twitter:title", seo.title); meta("twitter:description", seo.description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = canonicalUrl;
    if (window.location.hash) {
      requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView());
    } else window.scrollTo(0, 0);
    trackPage(clean);
  }, [path]);
  return null;
}
