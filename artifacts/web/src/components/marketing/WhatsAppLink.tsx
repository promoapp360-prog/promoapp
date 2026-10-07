import type { ReactNode } from "react";
import { whatsappUrl, type Service } from "../../lib/marketing";
import { trackWhatsApp } from "../../lib/analytics";

export default function WhatsAppLink({ service = "generale", children, className = "whatsapp-link", placement = "inline" }: {
  service?: Service; children: ReactNode; className?: string; placement?: string;
}) {
  return <a href={whatsappUrl(service)} target="_blank" rel="noopener noreferrer"
    className={className} onClick={() => trackWhatsApp(service, placement)}
    aria-label={placement === "floating" ? "Richiedi un preventivo su WhatsApp" : undefined}
    data-testid={`whatsapp-${placement}`}>{children}</a>;
}
