import { commercialIncentive, commercialTrust } from "../../lib/commercial";
import { appPath, type Service } from "../../lib/marketing";
import "../../styles/commercial.css";

export default function TrustPoints({ service = "generale" }: { service?: Service }) {
  const staged = commercialTrust.stagedPaymentConfirmed &&
    (commercialTrust.stagedPaymentServices as string[]).includes(service);
  const days: number | null = commercialTrust.initialSupportDays;
  const support = commercialTrust.initialSupportConfirmed && typeof days === "number" && days > 0 &&
    (commercialTrust.initialSupportServices as string[]).includes(service);
  const contact = commercialTrust.projectContact;
  const points = [
    ["Prima vedi, poi decidi", commercialIncentive().promise],
    ["Preventivo scritto prima di iniziare", "Funzioni, inclusioni, extra e costi periodici definiti con chiarezza prima della realizzazione."],
    [staged ? "Pagamento a fasi" : "Modalità di pagamento chiare", staged ? "Il progetto prevede un pagamento legato alle fasi concordate nel preventivo." : "Importi e scadenze vengono concordati sul prodotto scelto, senza condizioni prese da altre offerte."],
    [support ? `${days} giorni di assistenza iniziale` : "Assistenza da concordare", support ? "Periodo iniziale incluso nei limiti descritti nel preventivo; attività successive e costi sono distinti." : "Canali, durata, ambito ed eventuali costi dell'assistenza vengono definiti prima dell'avvio."],
    ["Rapporto diretto", "Confrontati con il referente che segue la realizzazione e chiarisci le esigenze senza dover conoscere la tecnologia."],
  ];
  return <div className="promo-trust">
    <div className="sl-grid c3">{points.map(([title, description]) =>
      <article className="sl-card" key={title}><h3>{title}</h3><p>{description}</p></article>)}</div>
    {contact.name && contact.photo && contact.role && contact.bio && <aside className="sl-card project-contact mt-5">
      <img src={contact.photo.startsWith("/") ? appPath(contact.photo) : contact.photo}
        width="80" height="80" loading="lazy" alt={`Foto di ${contact.name}`} />
      <div><h3>Chi segue il tuo progetto</h3><strong>{contact.name}</strong><p>{contact.role}</p><p>{contact.bio}</p></div>
    </aside>}
  </div>;
}
