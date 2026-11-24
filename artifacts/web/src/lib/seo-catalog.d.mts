type SeoContentSection = { heading: string; paragraphs: string[] };
type SeoPage = {
  title: string;
  description: string;
  h1?: string;
  canonical?: string;
  noindex?: boolean;
  faq?: [string, string][];
  sections?: SeoContentSection[];
  intro?: string;
  service?: "siti-web" | "web-app" | "menu-digitali";
  city?: string;
  projects?: string[];
  related?: [string, string][];
  kind?: "portfolio";
};
declare const pages: Record<string, SeoPage>;
export default pages;
