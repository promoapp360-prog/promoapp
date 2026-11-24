import pageContent from "../../lib/seo-page-content.json" with { type: "json" };
import type { Service } from "../../lib/marketing";

export type SEOContentPath = keyof typeof pageContent;
type Section = { heading: string; paragraphs: string[] };
type SeoPageContent = {
  title?: string;
  description?: string;
  h1?: string;
  intro?: string;
  service?: Service;
  city?: string;
  projects?: string[];
  sections?: Section[];
  faq?: [string, string][];
  related?: [string, string][];
};
const contentByPath = pageContent as unknown as Record<SEOContentPath, SeoPageContent>;

export function getSEOContent(pagePath: SEOContentPath) {
  return contentByPath[pagePath];
}

export function SEOSections({ pagePath }: { pagePath: SEOContentPath }) {
  const sections = getSEOContent(pagePath).sections ?? [];
  return <>{sections.map((section, index) => (
    <section key={section.heading} className={`sl-section${index % 2 === 0 ? " alt" : ""}`}>
      <div className="marketing-container">
        <h2 className="sl-h2">{section.heading}</h2>
        {section.paragraphs.map((paragraph) => <p className="sl-lead mt-4" key={paragraph}>{paragraph}</p>)}
      </div>
    </section>
  ))}</>;
}

export function SEOFAQs({ pagePath }: { pagePath: SEOContentPath }) {
  const faqs = getSEOContent(pagePath).faq ?? [];
  if (!faqs.length) return null;
  return <section className="sl-section alt">
    <div className="marketing-container">
      <h2 className="sl-h2">Domande frequenti</h2>
      <div className="sl-faq">
        {faqs.map(([question, answer]) => (
          <details key={question}><summary>{question}</summary><p>{answer}</p></details>
        ))}
      </div>
    </div>
  </section>;
}
