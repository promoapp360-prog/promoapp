import { useState } from "react";
import "../styles/commercial.css";
import MarketingLayout from "../components/marketing/MarketingLayout";
import LeadForm from "../components/marketing/LeadForm";
import VerifiedReviews from "../components/marketing/VerifiedReviews";
import WhatsAppLink from "../components/marketing/WhatsAppLink";
import { appPath, serviceCta } from "../lib/marketing";
import { trackEvent } from "../lib/analytics";
import { useMobileFormVisibility } from "../lib/useMobileFormVisibility";
import { commercialIncentive, webappStartingPrice } from "../lib/commercial";
import TrustPoints from "../components/marketing/TrustPoints";

type Service = "siti-web" | "web-app" | "menu-digitali";
type Item = { t: string; d: string };

const MENU: Record<string, { n: string; d: string; p: string }[]> = {
  Antipasti: [
    { n: "Tagliere della casa", d: "Salumi e formaggi del territorio", p: "14,00" },
    { n: "Crudo e bufala", d: "Prosciutto crudo, mozzarella", p: "11,50" },
    { n: "Caponata tiepida", d: "Verdure di stagione", p: "8,00" },
  ],
  Primi: [
    { n: "Tonnarelli cacio e pepe", d: "Pecorino romano, pepe nero", p: "12,00" },
    { n: "Risotto allo zafferano", d: "Midollo e riduzione di vino", p: "13,50" },
    { n: "Gnocchi al pomodoro", d: "Basilico fresco", p: "10,00" },
  ],
  Secondi: [
    { n: "Tagliata di manzo", d: "Rucola e scaglie di grana", p: "18,00" },
    { n: "Frittura di paranza", d: "Pescato del giorno", p: "16,50" },
  ],
  Dolci: [
    { n: "Tiramisù", d: "Ricetta classica", p: "6,00" },
    { n: "Panna cotta", d: "Coulis ai frutti rossi", p: "5,50" },
  ],
};


function MenuDemo() {
  const cats = Object.keys(MENU);
  const [cat, setCat] = useState(cats[0]);
  return (
    <div className="sl-phone" data-testid="menu-demo-preview">
      <div className="sl-screen">
        <header><small>Esempio dimostrativo</small><b>Trattoria Esempio</b></header>
        <div className="sl-tabs" role="group" aria-label="Categorie del menu">
          {cats.map((c) => (
            <button key={c} type="button" aria-pressed={c === cat} onClick={() => setCat(c)} data-testid={`button-demo-${c}`}>{c}</button>
          ))}
        </div>
        <div className="sl-dishes" key={cat}>
          {MENU[cat].map((m, i) => (
            <div className="sl-dish" key={m.n} style={{ animationDelay: `${i * 70}ms` }}>
              <div><b>{m.n}</b><p>{m.d}</p></div>
              <span>{m.p} €</span>
            </div>
          ))}
        </div>
        <div className="sl-demo-tag">Demo illustrativa: piatti e prezzi di fantasia</div>
      </div>
    </div>
  );
}

function WebsiteExample() {
  return <figure className="website-example" data-testid="website-demo-preview">
    <div className="website-example-bar"><strong>La tua attività</strong><span>Servizi · Contatti</span></div>
    <div className="website-example-content">
      <small>ESEMPIO ILLUSTRATIVO</small>
      <h3>Il tuo lavoro, presentato con chiarezza.</h3>
      <p>Una presentazione dell'attività, i tuoi servizi e un modo semplice per contattarti.</p>
      <span className="website-example-contact">Richiedi informazioni</span>
      <div className="website-example-services"><span>La tua attività</span><span>I tuoi servizi</span><span>I tuoi contatti</span></div>
    </div>
    <figcaption>Schermata dimostrativa, non un sito di un cliente. Pagine, contenuti e funzioni si concordano nel preventivo.</figcaption>
  </figure>;
}

function Cards({ items, cols = "c3" }: { items: Item[]; cols?: string }) {
  return (
    <div className={`sl-grid ${cols}`}>
      {items.map((x, i) => (
        <div className="sl-card sl-reveal" style={{ animationDelay: `${i * 60}ms` }} key={x.t}>
          <div className="sl-ico">{String(i + 1).padStart(2, "0")}</div>
          <h3>{x.t}</h3>
          <p>{x.d}</p>
        </div>
      ))}
    </div>
  );
}

function Steps({ items, dark }: { items: Item[]; dark?: boolean }) {
  return (
    <ol className="sl-steps" data-dark={dark}>
      {items.map((s) => (<li key={s.t}><h3>{s.t}</h3><p>{s.d}</p></li>))}
    </ol>
  );
}

function Faq({ items }: { items: Item[] }) {
  return (
    <div className="sl-faq">
      {items.map((f) => (
        <details key={f.t}><summary>{f.t}</summary><p>{f.d}</p></details>
      ))}
    </div>
  );
}

function List({ items, extra }: { items: string[]; extra?: boolean }) {
  return <ul className={`sl-list${extra ? " extra" : ""}`}>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}

function Scope({ inc, ext, title, guaranteed = [] }: { inc: string[]; ext: string[]; title: string; guaranteed?: string[] }) {
  return (
    <div className="sl-scope">
      <div className="sl-box in">
        {guaranteed.length > 0 && <><h3>Sempre incluso</h3><List items={guaranteed} /></>}
        <h3>{title}</h3><List items={inc} />
      </div>
        <div className="sl-box out"><h3>Costi tecnici e servizi aggiuntivi</h3><List items={ext} extra /></div>
    </div>
  );
}

function Contact({ service, title, lead }: { service: Service; title: string; lead: string }) {
  return (
    <section className="sl-section">
      <div className="marketing-container">
        <h2 className="sl-h2">Perché PromoApp</h2><TrustPoints service={service} />
        <div className="sl-contact mt-8">
        <div className="sl-alt">
          <p className="sl-eyebrow">Contatto diretto</p>
          <h2 className="sl-h2">{title}</h2>
          <p className="sl-lead">{lead}</p>
          <div><WhatsAppLink service={service} placement="form" className="whatsapp-link">Scrivici su WhatsApp</WhatsAppLink></div>
        </div>
        <a className="whatsapp-link" href="#preventivo" onClick={() => trackEvent("cta_click", service, "product-final")}>{serviceCta[service]}</a>
        </div>
      </div>
    </section>
  );
}

function Hero({ service, kicker, h1, sub, price, priceNote, note, side }: {
  service: Service; kicker: string; h1: React.ReactNode; sub: string; price?: [string, string];
  priceNote?: string; note: string; side?: React.ReactNode;
}) {
  return (
    <section className="sl-hero product-hero">
      <div className="marketing-container">
        <div className="sl-reveal">
          <span className="sl-kicker">{kicker}</span>
          <h1>{h1}</h1>
          <p className="sl-sub">{sub}</p>
          {price && (
            <div className="sl-price"><strong>{price[0]}</strong><span>{price[1]}{priceNote ? ` · ${priceNote}` : ""}</span></div>
          )}
          <div className="sl-cta">
            <a href="#preventivo" className="whatsapp-link" data-testid="link-to-form" onClick={() => trackEvent("cta_click", service, "product-hero")}>{serviceCta[service]}</a>
            {service === "menu-digitali" && <a href="#menu-esempio" className="sl-ghost" data-testid="link-menu-example"
              onClick={() => trackEvent("cta_click", service, "product-example")}>Guarda subito il menu</a>}
            <WhatsAppLink service={service} placement="hero" className="sl-ghost">Scrivici su WhatsApp</WhatsAppLink>
          </div>
          <p className="sl-note">{note}</p>
           <p className="sl-note">{service === "menu-digitali" ? commercialIncentive().promise : "Richiedi una proposta personalizzata: definiamo insieme funzioni, tempi e costi, senza impegno."}</p>
          <p className="sl-note">{commercialIncentive().responseNote}</p>
        </div>
        <div>
          <div id="preventivo" className="scroll-mt-20"><LeadForm service={service} /></div>
          {side && <div id="menu-esempio" className="scroll-mt-20 mt-6">{side}</div>}
        </div>
      </div>
    </section>
  );
}

function SitiWeb() {
  return (
    <>
      <Hero
        service="siti-web" kicker="Siti web per attività italiane"
        h1={<>Il tuo sito web professionale a <b>399 € + IVA.</b></>}
        sub="Presenta la tua attività online, valorizza i tuoi servizi e permetti ai clienti di contattarti facilmente."
        price={["399 €", "+ IVA"]} priceNote="Attivazione definitiva"
        note="Costi tecnici di funzionamento da 9,90 € al mese, in base al progetto. Importo comunicato prima dell’attivazione."
      />
      <section className="sl-section alt"><div className="marketing-container sl-demo-wrap">
        <div><p className="sl-eyebrow">Prima di decidere</p><h2 className="sl-h2">Come potrebbe presentarsi la tua attività</h2>
          <p className="sl-lead">Un esempio illustrativo per immaginare il tuo sito. Definiamo insieme le pagine, i contenuti e le funzioni comprese nell’attivazione a 399 € + IVA.</p>
           <a href="#preventivo" className="whatsapp-link" onClick={() => trackEvent("cta_click", "siti-web", "product-example")}>Richiedi una proposta personalizzata</a>
        </div><WebsiteExample />
      </div></section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <p className="sl-eyebrow">Per chi è</p>
          <h2 className="sl-h2">Una vetrina che lavora anche quando sei chiuso</h2>
          <Cards items={[
            { t: "Negozi", d: "Orari, indirizzo e prodotti sempre a portata di telefono." },
            { t: "Professionisti", d: "Presenta competenze e servizi in modo chiaro e autorevole." },
            { t: "Artigiani", d: "Mostra il tuo lavoro e fatti trovare da chi ti cerca in zona." },
            { t: "Aziende", d: "Una presenza ordinata e credibile, con il tuo stile." },
          ]} cols="c2" />
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <p className="sl-eyebrow">Come funziona</p>
          <h2 className="sl-h2">Semplice, senza giri</h2>
          <Steps items={[
            { t: "Ci racconti il progetto", d: "Un messaggio su WhatsApp o il modulo: attività, stile, cosa vuoi mostrare." },
            { t: "Definiamo la tua soluzione", d: "Ti mostriamo le funzioni comprese nell’attivazione a 399 € + IVA e i relativi costi tecnici di funzionamento." },
            { t: "Costruiamo il sito", d: "Tu ci invii testi e foto; noi lo realizziamo e lo condividiamo per le tue correzioni." },
            { t: "Online", d: "Pubblichiamo il sito su hosting e dominio concordati." },
          ]} />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <p className="sl-eyebrow">Ambito del progetto</p>
          <h2 className="sl-h2">399 € + IVA, scritto chiaro</h2>
          <p className="sl-lead">399 € + IVA di attivazione definitiva. Definiamo insieme pagine, contenuti e funzionalità comprese, per adattare il sito alla tua attività.</p>
          <Scope title="Da concordare nel preventivo" guaranteed={[
            "Design responsive per smartphone, tablet e computer",
            "Modulo di contatto funzionante",
          ]} inc={[
            "Numero delle pagine istituzionali",
            "SEO di base",
            "Stile del brand e collegamenti ai social",
            "Testi e foto forniti da te",
          ]} ext={[
            "Costi tecnici di funzionamento da 9,90 € al mese per i servizi necessari, come database e hosting. L’importo varia in base alla soluzione e alle risorse richieste e viene comunicato prima dell’attivazione.",
            "Dominio: condizioni comunicate prima dell’attivazione",
            "Servizi esterni eventualmente necessari",
            "Risorse tecniche in base alla soluzione",
            "Assistenza secondo le condizioni concordate",
          ]} />
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <VerifiedReviews />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <h2 className="sl-h2">Domande frequenti</h2>
          <Faq items={[
            { t: "Anche le app e i gestionali costano 399 €?", d: "Sì. L’offerta a 399 € + IVA di attivazione definitiva riguarda siti web, web app e gestionali. Prima di iniziare definiamo insieme la soluzione e le funzioni comprese." },
            { t: "Cosa pago dopo l’attivazione?", d: "Solo i costi tecnici necessari al funzionamento della soluzione, da 9,90 € al mese. L’importo dipende dal progetto e dalle risorse necessarie e viene comunicato prima dell’attivazione. Eventuali servizi aggiuntivi richiesti vengono indicati separatamente." },
            { t: "E se ho bisogno di un progetto più articolato?", d: "Possiamo realizzare anche sviluppi e integrazioni aggiuntive, con una proposta dedicata concordata prima di procedere." },
            { t: "Posso aggiungere pagine e funzionalità?", d: "Sì. Numero di pagine e funzioni vengono concordati nel preventivo; le estensioni si valutano separatamente." },
            { t: "Il prezzo include l'IVA?", d: "No, 399 € è più IVA." },
          ]} />
        </div>
      </section>
      <Contact service="siti-web" title="Richiedi il tuo preventivo" lead="Tre dati per una proposta gratuita e senza impegno. Oppure scrivici subito su WhatsApp." />
    </>
  );
}

function WebApp() {
  return (
    <>
      <Hero
        service="web-app" kicker="Web app e strumenti su misura"
        h1={<>Un&apos;app su misura per <b>organizzare meglio la tua attività.</b></>}
        sub="Realizziamo soluzioni personalizzate per organizzare prenotazioni, appuntamenti, clienti, ordini e attività quotidiane."
        price={["399 € + IVA", "Attivazione definitiva"]}
        note={webappStartingPrice() ?? "Costi tecnici di funzionamento da 9,90 € al mese, in base al progetto. Importo comunicato prima dell’attivazione."}
      />
      <section className="sl-section">
        <div className="marketing-container">
          <p className="sl-eyebrow">Cosa possiamo sviluppare</p>
          <h2 className="sl-h2">Soluzioni per il lavoro di ogni giorno</h2>
          <Cards items={[
            { t: "Prenotazioni online", d: "Appuntamenti, tavoli o servizi, con agenda e promemoria." },
            { t: "Gestione clienti", d: "Anagrafiche, storico e comunicazioni in un unico posto." },
            { t: "Fidelity card", d: "Punti e premi digitali, senza tessere di carta." },
            { t: "Gestionali", d: "Ordini, magazzino, attività e report su misura dei tuoi processi." },
            { t: "Cataloghi digitali", d: "Prodotti e listini sempre aggiornati e consultabili da telefono." },
            { t: "Soluzioni per aziende", d: "Strumenti interni personalizzati, dal modulo all'area riservata." },
          ]} />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <p className="sl-eyebrow">Capire la differenza</p>
          <h2 className="sl-h2">Sito web, web app o app nativa?</h2>
          <div className="sl-compare">
            <div className="sl-card"><span className="sl-tag am">Presenta</span><h3>Sito web</h3><p>Informa e fa conoscere l&apos;attività. Si legge, non si usa per lavorare.</p></div>
            <div className="sl-card hl"><span className="sl-tag">Usa</span><h3>Web app</h3><p>Si apre dal browser, senza installare nulla, su Android, iOS e computer. Prenota, gestisce, archivia.</p></div>
            <div className="sl-card"><span className="sl-tag am">Store</span><h3>App nativa</h3><p>Si scarica dagli store. La pubblicazione negli store non è inclusa, salvo accordo specifico nel progetto.</p></div>
          </div>
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <p className="sl-eyebrow">Esempi concreti</p>
          <h2 className="sl-h2">Come potrebbe funzionare per te</h2>
          <Cards cols="c3" items={[
            { t: "Centro estetico", d: "Clienti prenotano il trattamento, ricevono il promemoria e accumulano punti." },
            { t: "Officina", d: "Schede veicolo, interventi e scadenze con avviso al cliente." },
            { t: "Negozio", d: "Catalogo digitale con disponibilità e carta fedeltà sul telefono." },
          ]} />
          <p className="sl-lead" style={{ marginTop: 14 }}>Scenari illustrativi per mostrare le possibilità, non progetti di clienti.</p>
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <p className="sl-eyebrow">Come lavoriamo</p>
          <h2 className="sl-h2">Dal confronto al progetto</h2>
          <Steps items={[
            { t: "Ascolto", d: "Ci spieghi come lavori oggi e cosa ti fa perdere tempo." },
            { t: "Definiamo la tua soluzione", d: "Ti mostriamo le funzioni comprese nell’attivazione a 399 € + IVA e i relativi costi tecnici di funzionamento." },
            { t: "Sviluppo", d: "Ti mostriamo l'avanzamento e raccogliamo le tue indicazioni." },
            { t: "Messa in uso", d: "Pubblichiamo la web app e concordiamo l'assistenza successiva." },
          ]} />
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <VerifiedReviews />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <h2 className="sl-h2">Domande frequenti</h2>
          <Faq items={[
            { t: "Anche le app e i gestionali costano 399 €?", d: "Sì. L’offerta a 399 € + IVA di attivazione definitiva riguarda siti web, web app e gestionali. Prima di iniziare definiamo insieme la soluzione e le funzioni comprese." },
            { t: "Cosa pago dopo l’attivazione?", d: "Solo i costi tecnici necessari al funzionamento della soluzione, da 9,90 € al mese. L’importo dipende dal progetto e dalle risorse necessarie e viene comunicato prima dell’attivazione. Eventuali servizi aggiuntivi richiesti vengono indicati separatamente." },
            { t: "E se ho bisogno di un progetto più articolato?", d: "Possiamo realizzare anche sviluppi e integrazioni aggiuntive, con una proposta dedicata concordata prima di procedere." },
            { t: "E dopo la consegna?", d: "Manutenzione e assistenza vengono definite insieme, in base alle esigenze." },
          ]} />
        </div>
      </section>
      <Contact service="web-app" title="Parliamo del tuo progetto" lead="Lascia tre dati: ti ricontattiamo per capire insieme cosa ti serve." />
    </>
  );
}

function MenuDigitali() {
  return (
    <>
      <Hero
        service="menu-digitali" kicker="Menu digitali per ristoranti"
        h1={<>Il tuo menu digitale QR a soli <b>99 € + IVA.</b></>}
        sub="I clienti inquadrano il QR code e consultano il menu direttamente dallo smartphone."
        price={["99 €", "+ IVA · Attivazione definitiva"]}
        note="Costi tecnici di funzionamento da 9,90 € al mese, in base al progetto. Importo comunicato prima dell’attivazione."
        side={<MenuDemo />}
      />
      <section className="sl-section">
        <div className="marketing-container">
          <p className="sl-eyebrow">Perché funziona</p>
          <h2 className="sl-h2">Semplice per chi mangia, comodo per te</h2>
          <Cards items={[
            { t: "Si legge da smartphone", d: "Testi grandi, categorie chiare, niente zoom e niente PDF." },
            { t: "Accesso con QR code", d: "Il cliente inquadra, il menu si apre. Nessuna app da scaricare." },
            { t: "Grafica professionale", d: "Impaginazione ordinata, coerente con il tuo locale." },
          ]} />
        </div>
      </section>
      <section className="sl-section dark">
        <div className="marketing-container sl-demo-wrap">
          <div>
            <p className="sl-eyebrow">Prova pratica</p>
            <h2 className="sl-h2">Sfoglia l&apos;esempio</h2>
            <p className="sl-lead">Tocca le categorie nel telefono: è questo il gesto che farà il tuo cliente. Una demo illustrativa, non il menu di un cliente.</p>
            <div className="sl-qrrow">
              <a href={appPath("/menu-demo")} target="_blank" rel="noopener noreferrer" aria-label="Apri il menu dimostrativo">
                <img src={`${import.meta.env.BASE_URL}menu-demo-qr.svg`} width={110} height={110} alt="QR code scansionabile del menu dimostrativo su PromoApp.it" className="rounded-xl" />
              </a>
              <span>Inquadra il QR o toccalo per aprire il menu dimostrativo.</span>
            </div>
            <a className="whatsapp-link" href={appPath("/menu-demo")} data-testid="link-menu-demo">Apri la demo completa</a>
          </div>
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <p className="sl-eyebrow">Prezzo e extra</p>
          <h2 className="sl-h2">99 € + IVA, attivazione definitiva</h2>
          <Scope title="Nel prezzo base" inc={[
            "Menu consultabile da smartphone",
            "Accesso tramite QR code",
            "Layout professionale",
          ]} ext={[
            "Ordinazioni e pagamenti dal menu",
            "Modifica autonoma del menu (area admin)",
            "Versioni in più lingue",
            "Costi tecnici di funzionamento da 9,90 € al mese per i servizi necessari, come database e hosting. L’importo varia in base alla soluzione e alle risorse richieste e viene comunicato prima dell’attivazione.",
            "Manutenzione e assistenza: condizioni concordate a parte",
          ]} />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <p className="sl-eyebrow">Come funziona</p>
          <h2 className="sl-h2">Dal tuo menu al QR</h2>
          <Steps items={[
            { t: "Ci invii il menu", d: "Foto, PDF o testo su WhatsApp, con logo e colori se li hai." },
            { t: "Impaginiamo", d: "Prepariamo il menu digitale e lo vedi prima della pubblicazione." },
            { t: "Ricevi il QR", d: "Lo stampi o lo esponi sui tavoli e il menu è consultabile." },
          ]} />
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <VerifiedReviews />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <h2 className="sl-h2">Domande frequenti</h2>
          <Faq items={[
            { t: "Come funziona il menu con QR code?", d: "Il cliente inquadra il QR e consulta piatti e bevande dal browser dello smartphone, senza installare un'app." },
            { t: "Posso modificare piatti e prezzi?", d: "Modalità e costi degli aggiornamenti vengono chiariti nel preventivo. Non sono promesse modifiche illimitate; l'area di modifica autonoma si quota separatamente." },
            { t: "Cosa pago dopo l’attivazione del menu?", d: "Il Menu QR mantiene il prezzo di 99 € + IVA di attivazione definitiva. Costi tecnici di funzionamento da 9,90 € al mese per i servizi necessari, come database e hosting. L’importo varia in base alla soluzione e alle risorse richieste e viene comunicato prima dell’attivazione. Dominio, aggiornamenti, assistenza e funzioni aggiuntive seguono le condizioni concordate." },
          ]} />
        </div>
      </section>
      <Contact service="menu-digitali" title="Richiedi il tuo menu digitale" lead="Lasciaci i tuoi dati e ti rispondiamo direttamente, oppure scrivici su WhatsApp." />
    </>
  );
}

export default function ServiceLanding({ service }: { service: Service }) {
  useMobileFormVisibility(service);
  return (
    <MarketingLayout service={service}>
      {service === "siti-web" && <SitiWeb />}
      {service === "web-app" && <WebApp />}
      {service === "menu-digitali" && <MenuDigitali />}
    </MarketingLayout>
  );
}
