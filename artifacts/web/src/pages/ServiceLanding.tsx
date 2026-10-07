import { useState } from "react";
import "../styles/commercial.css";
import MarketingLayout from "../components/marketing/MarketingLayout";
import LeadForm from "../components/marketing/LeadForm";
import VerifiedReviews from "../components/marketing/VerifiedReviews";
import WhatsAppLink from "../components/marketing/WhatsAppLink";
import { appPath } from "../lib/marketing";

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

function Scope({ inc, ext, title }: { inc: string[]; ext: string[]; title: string }) {
  return (
    <div className="sl-scope">
      <div className="sl-box in"><h3>{title}</h3><List items={inc} /></div>
      <div className="sl-box out"><h3>Da quotare a parte</h3><List items={ext} extra /></div>
    </div>
  );
}

function Contact({ service, title, lead }: { service: Service; title: string; lead: string }) {
  return (
    <section className="sl-section" id="preventivo">
      <div className="marketing-container sl-contact">
        <div className="sl-alt">
          <p className="sl-eyebrow">Contatto diretto</p>
          <h2 className="sl-h2">{title}</h2>
          <p className="sl-lead">{lead}</p>
          <div><WhatsAppLink service={service} placement="form" className="whatsapp-link">Scrivici su WhatsApp</WhatsAppLink></div>
        </div>
        <LeadForm service={service} />
      </div>
    </section>
  );
}

function Hero({ service, kicker, h1, sub, price, priceNote, cta, note, side }: {
  service: Service; kicker: string; h1: React.ReactNode; sub: string; price?: [string, string];
  priceNote?: string; cta: string; note: string; side?: React.ReactNode;
}) {
  return (
    <section className="sl-hero">
      <div className="marketing-container">
        <div className="sl-reveal">
          <span className="sl-kicker">{kicker}</span>
          <h1>{h1}</h1>
          <p className="sl-sub">{sub}</p>
          {price && (
            <div className="sl-price"><strong>{price[0]}</strong><span>{price[1]}{priceNote ? ` · ${priceNote}` : ""}</span></div>
          )}
          <div className="sl-cta">
            <WhatsAppLink service={service} placement="hero" className="whatsapp-link">{cta}</WhatsAppLink>
            <a href="#preventivo" className="sl-ghost" data-testid="link-to-form">Compila il modulo</a>
          </div>
          <p className="sl-note">{note}</p>
        </div>
        {side}
      </div>
    </section>
  );
}

function SitiWeb() {
  return (
    <>
      <Hero
        service="siti-web" kicker="Siti web per attività italiane"
        h1={<>Il tuo sito web professionale a partire da <b>399 €</b></>}
        sub="Fai conoscere la tua attività online con un sito moderno, veloce e perfetto anche da smartphone. Raccontaci il tuo progetto e richiedi un preventivo."
        price={["399 €", "+ IVA"]} priceNote="hosting e dominio a parte"
        cta="Chiedi un preventivo su WhatsApp" note="Parli direttamente con chi realizza il sito."
      />
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
            { t: "Ricevi il preventivo", d: "Ti diciamo cosa è compreso e quali eventuali extra servono, in chiaro." },
            { t: "Costruiamo il sito", d: "Tu ci invii testi e foto; noi lo realizziamo e lo condividiamo per le tue correzioni." },
            { t: "Online", d: "Pubblichiamo il sito su hosting e dominio concordati." },
          ]} />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <p className="sl-eyebrow">Cosa comprende il prezzo</p>
          <h2 className="sl-h2">399 € + IVA, scritto chiaro</h2>
          <p className="sl-lead">Prezzo di partenza per un sito istituzionale. Il preventivo conferma i dettagli.</p>
          <Scope title="Compreso" inc={[
            "Fino a 5 pagine istituzionali",
            "Design responsive per smartphone, tablet e computer",
            "Modulo di contatto funzionante",
            "SEO di base",
            "Stile del brand e collegamenti ai social",
            "Testi e foto forniti da te",
          ]} ext={[
            "Hosting e dominio: preventivati a parte, con costo ricorrente",
            "E-commerce e vendita online",
            "Area riservata con login",
            "Integrazioni di prenotazione",
            "Pagine e funzioni aggiuntive",
          ]} />
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <p className="sl-eyebrow">Recensioni</p>
          <h2 className="sl-h2">Cosa dicono i clienti</h2>
          <VerifiedReviews />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <h2 className="sl-h2">Domande frequenti</h2>
          <Faq items={[
            { t: "Cosa mi serve per iniziare?", d: "Logo se lo hai, testi delle pagine, alcune foto e i dati di contatto dell'attività." },
            { t: "Chi si occupa di hosting e dominio?", d: "Li preventiviamo a parte: sono costi ricorrenti che definiamo insieme prima di partire." },
            { t: "Posso vendere online dal sito?", d: "Il sito base presenta la tua attività. E-commerce e login si valutano e quotano separatamente." },
            { t: "Posso avere più di 5 pagine?", d: "Sì, le pagine aggiuntive si quotano a parte in base alle necessità." },
            { t: "Il prezzo include l'IVA?", d: "No, 399 € è più IVA." },
          ]} />
        </div>
      </section>
      <Contact service="siti-web" title="Richiedi il tuo preventivo" lead="Quattro campi e ti rispondiamo direttamente. Oppure scrivici subito su WhatsApp." />
    </>
  );
}

function WebApp() {
  return (
    <>
      <Hero
        service="web-app" kicker="Web app e strumenti su misura"
        h1={<>La tua idea diventa un&apos;applicazione <b>su misura.</b></>}
        sub="Prenotazioni, clienti, fidelity e gestione: costruiamo lo strumento digitale che serve davvero alla tua attività, usabile da qualsiasi smartphone o computer."
        price={["Su preventivo", "ambito, tempi e manutenzione definiti sul progetto"]}
        cta="Racconta la tua idea su WhatsApp" note="Nessun pacchetto standard: parti dal tuo caso concreto."
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
            { t: "Proposta", d: "Definiamo funzioni, ambito e preventivo, compresi tempi e manutenzione." },
            { t: "Sviluppo", d: "Ti mostriamo l'avanzamento e raccogliamo le tue indicazioni." },
            { t: "Messa in uso", d: "Pubblichiamo la web app e concordiamo l'assistenza successiva." },
          ]} />
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <p className="sl-eyebrow">Recensioni</p>
          <h2 className="sl-h2">Cosa dicono i clienti</h2>
          <VerifiedReviews />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <h2 className="sl-h2">Domande frequenti</h2>
          <Faq items={[
            { t: "Quanto costa una web app?", d: "Dipende dalle funzioni richieste. Dopo un confronto ti inviamo un preventivo specifico." },
            { t: "Quanto tempo serve?", d: "I tempi dipendono dal progetto e li indichiamo nel preventivo." },
            { t: "Sarà negli store?", d: "Una web app si usa dal browser. La pubblicazione negli store è possibile solo se concordata a parte." },
            { t: "E dopo la consegna?", d: "Manutenzione e assistenza vengono definite insieme, in base alle esigenze." },
          ]} />
        </div>
      </section>
      <Contact service="web-app" title="Parliamo del tuo progetto" lead="Descrivi l'idea in poche righe: ti rispondiamo con le domande giuste." />
    </>
  );
}

function MenuDigitali() {
  return (
    <>
      <Hero
        service="menu-digitali" kicker="Menu digitali per ristoranti"
        h1={<>Il menu digitale del tuo ristorante a partire da <b>99 €.</b></>}
        sub="Il tuo menu sullo smartphone dei clienti: si apre con un QR code, è leggibile subito e ha una grafica curata."
        price={["99 €", "+ IVA una tantum"]}
        cta="Richiedi il tuo menu digitale" note="Prezzo base una tantum. Extra e costi periodici sono indicati sotto."
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
          <MenuDemo />
        </div>
      </section>
      <section className="sl-section">
        <div className="marketing-container">
          <p className="sl-eyebrow">Prezzo e extra</p>
          <h2 className="sl-h2">99 € + IVA, una tantum</h2>
          <Scope title="Nel prezzo base" inc={[
            "Menu consultabile da smartphone",
            "Accesso tramite QR code",
            "Layout professionale",
          ]} ext={[
            "Ordinazioni e pagamenti dal menu",
            "Modifica autonoma del menu (area admin)",
            "Versioni in più lingue",
            "Hosting e dominio: costo ricorrente concordato",
            "Manutenzione: servizio periodico concordato a parte",
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
          <p className="sl-eyebrow">Recensioni</p>
          <h2 className="sl-h2">Cosa dicono i clienti</h2>
          <VerifiedReviews />
        </div>
      </section>
      <section className="sl-section alt">
        <div className="marketing-container">
          <h2 className="sl-h2">Domande frequenti</h2>
          <Faq items={[
            { t: "Il prezzo è mensile?", d: "No, 99 € + IVA è il prezzo base una tantum. Hosting, dominio e manutenzione sono costi ricorrenti da concordare a parte." },
            { t: "Posso cambiare i piatti?", d: "Le modifiche si gestiscono su richiesta. L'area di modifica autonoma è un extra da quotare." },
            { t: "Si possono ordinare i piatti?", d: "Ordinazioni e pagamenti non sono nel prezzo base e si preventivano separatamente." },
            { t: "Serve un'app per i clienti?", d: "No, il menu si apre dal browser inquadrando il QR." },
          ]} />
        </div>
      </section>
      <Contact service="menu-digitali" title="Richiedi il tuo menu digitale" lead="Lasciaci i tuoi dati e ti rispondiamo direttamente, oppure scrivici su WhatsApp." />
    </>
  );
}

export default function ServiceLanding({ service }: { service: Service }) {
  return (
    <MarketingLayout service={service}>
      {service === "siti-web" && <SitiWeb />}
      {service === "web-app" && <WebApp />}
      {service === "menu-digitali" && <MenuDigitali />}
    </MarketingLayout>
  );
}
