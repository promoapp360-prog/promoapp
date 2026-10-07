import type { ReactNode } from "react";
import { whatsappUrl, type Service } from "../../lib/marketing";
import { trackWhatsApp } from "../../lib/analytics";

export default function WhatsAppLink({ service = "generale", slug, children, className = "whatsapp-link", placement = "inline" }: {
  service?: Service; slug?: string; children: ReactNode; className?: string; placement?: string;
}) {
  return <a href={whatsappUrl(service, slug)} target="_blank" rel="noopener noreferrer"
    className={className} onClick={() => trackWhatsApp(service, placement, slug)}
    aria-label={placement === "floating" ? "Richiedi un preventivo su WhatsApp" : undefined}
    data-testid={`whatsapp-${placement}`}>{children}</a>;
}
