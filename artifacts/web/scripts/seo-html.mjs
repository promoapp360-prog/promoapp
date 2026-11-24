import pages from "../src/lib/seo-catalog.mjs";
import homeFaq from "../src/lib/home-faq.json" with { type: "json" };
import projects from "../src/lib/approved-projects.json" with { type: "json" };
const SITE = "https://www.promoapp.it";
// Dati strutturati: aiutano Google a capire chi siamo, cosa offriamo e le FAQ.
const organization = {
  "@type": "ProfessionalService", "@id": `${SITE}/#organization`, name: "PromoApp", alternateName: "PromoApp.it", url: `${SITE}/`,
  logo: `${SITE}/logo.svg`, image: `${SITE}/og-promoapp.png`,
  description: "Siti web, web app, gestionali personalizzati e menu digitali QR per attività locali e professionisti. Gestione di campagne Meta, Google Ads e SEO.",
  knowsAbout: ["Sviluppo siti web", "Web app e gestionali", "Menu digitali QR", "Campagne Meta Ads", "Campagne Google Ads", "SEO"],
  legalName: "Sophia 2005 S.r.l.", vatID: "IT08223951008", telephone: "+393793602035", email: "sophiaderos0@gmail.com",
  areaServed: { "@type": "Country", name: "Italia" }, priceRange: "€€",
  sameAs: ["https://www.facebook.com/profile.php?id=61568000249468", "https://www.instagram.com/promoapp.it"],
};
const publicProjects = projects.filter((project) =>
  project.approved && project.businessType.includes("·") && !/·\s*Progetto PromoApp$/i.test(project.businessType));
function structuredData(path, page) {
  const graph = [organization, { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "PromoApp.it", inLanguage: "it-IT", publisher: { "@id": `${SITE}/#organization` } }];
  if (path === "/") {
    graph.push({ "@type": "FAQPage", mainEntity: homeFaq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
    graph.push({ "@type": "ItemList", name: "Progetti realizzati", itemListElement: publicProjects.map((p, i) => ({
      "@type": "ListItem", position: i + 1, item: { "@type": "CreativeWork", name: p.title, description: p.solution, image: `${SITE}${p.image}`,
        locationCreated: { "@type": "Place", name: p.businessType.split("·").at(-1).trim() }, creator: { "@id": `${SITE}/#organization` } } })) });
  } else if (path === "/lavori") {
    graph.push({ "@type": "ItemList", name: "Progetti realizzati da PromoApp", itemListElement: publicProjects.map((p, i) => ({
      "@type": "ListItem", position: i + 1, item: { "@type": "CreativeWork", name: p.title, description: p.solution,
        image: `${SITE}${p.image}`, locationCreated: { "@type": "Place", name: p.businessType.split("·").at(-1).trim() },
        creator: { "@id": `${SITE}/#organization` } } })) });
  } else {
    graph.push({ "@type": "Service", name: page.h1 ?? page.title, description: page.description, url: `${SITE}${path}`,
      provider: { "@id": `${SITE}/#organization` }, areaServed: page.city
        ? { "@type": "City", name: page.city }
        : { "@type": "Country", name: "Italia" } });
  }
  if (path !== "/" && page.faq?.length) graph.push({ "@type": "FAQPage", mainEntity: page.faq.map(([q, a]) => ({
    "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  if (path !== "/") graph.push({ "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: page.h1 ?? page.title, item: `${SITE}${path}` }] });
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;
}
const escape = (value) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export function seoHtml(html, pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const page = pages[path] ?? {
    title: "Pagina non trovata | PromoApp.it",
    description: "La pagina non esiste o è stata spostata. Torna alla home o scopri i servizi PromoApp.",
    noindex: true,
  };
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
  const verificationToken = process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
  if (verificationToken && /^[A-Za-z0-9_-]{5,200}$/.test(verificationToken) && !/placeholder|inserisci/i.test(verificationToken)) {
    html = html.replace("</head>", `    <meta name="google-site-verification" content="${escape(verificationToken)}">\n  </head>`);
  }
  if (!page.noindex && !page.canonical) html = html.replace("</head>", `    ${structuredData(path, page)}\n  </head>`);
  return html;
}
