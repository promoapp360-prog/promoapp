import pages from "../src/lib/seo-catalog.mjs";
const escape = (value) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export function seoHtml(html, pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const page = pages[path] ?? (path.startsWith("/per/") ? {
    title: "Pagina non trovata | PromoApp.it",
    description: "Questo settore non è disponibile. Torna alla homepage e scegli una soluzione per la tua attività.",
    noindex: true,
  } : undefined);
  if (!page) return html;
  const url = `https://www.promoapp.it${page.canonical ?? path}`;
  const replacements = [
    [/(\<title\>)[\s\S]*?(\<\/title\>)/, escape(page.title)],
    [/(<meta name="description" content=")[^"]*(")/, escape(page.description)],
    [/(<meta name="robots" content=")[^"]*(")/, page.noindex ? "noindex, nofollow" : "index, follow"],
    [/(<link rel="canonical" href=")[^"]*(")/, escape(url)],
    [/(<meta property="og:title" content=")[^"]*(")/, escape(page.title)],
    [/(<meta property="og:description" content=")[^"]*(")/, escape(page.description)],
    [/(<meta property="og:url" content=")[^"]*(")/, escape(url)],
    [/(<meta name="twitter:title" content=")[^"]*(")/, escape(page.title)],
    [/(<meta name="twitter:description" content=")[^"]*(")/, escape(page.description)],
  ];
  for (const [regex, value] of replacements) html = html.replace(regex, (_match, start, end) => `${start}${value}${end}`);
  return html;
}
