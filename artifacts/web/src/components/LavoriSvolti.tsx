const PILLARS = [
  {
    icon: "fa-flag",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    title: "Azienda italiana reale",
    text: "Sophia 2005 S.r.l. — P.IVA 08223951008. Fatturiamo regolarmente, sei tutelato dalla legge italiana.",
    badge: "P.IVA verificabile",
  },
  {
    icon: "fa-code",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    title: "Codice sorgente tuo",
    text: "Alla consegna ricevi il codice e le credenziali. Non sei mai legato a noi: la tua App è davvero tua.",
    badge: "Sblocco definitivo",
  },
  {
    icon: "fa-shield-halved",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    title: "Hosting in Europa, GDPR",
    text: "Server europei, dati protetti secondo le normative GDPR. Backup quotidiani inclusi.",
    badge: "Conforme alla legge",
  },
  {
    icon: "fa-headset",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "Assistenza diretta",
    text: "Niente call center. Parli direttamente con chi sviluppa la tua App via WhatsApp ed email.",
    badge: "Risposta in poche ore",
  },
];

type Row = { label: string; promo: string; template: string; freelancer: string; agenzia: string; promoOk?: boolean };
const COMPARISON: Row[] = [
  { label: "App davvero personalizzata",   promo: "Sì, su misura",  template: "No, schema fisso",      freelancer: "Variabile",        agenzia: "Sì",            promoOk: true },
  { label: "Tempi di consegna",             promo: "7 giorni",       template: "Subito ma generica",    freelancer: "1-3 mesi",         agenzia: "3-6 mesi",       promoOk: true },
  { label: "Codice sorgente incluso",       promo: "Sì, alla consegna", template: "No",                 freelancer: "A pagamento",      agenzia: "Sì",             promoOk: true },
  { label: "Fattura italiana con P.IVA",    promo: "Sì, sempre",     template: "Spesso no",             freelancer: "Quasi mai",        agenzia: "Sì",             promoOk: true },
  { label: "Hosting e aggiornamenti",       promo: "Inclusi nel canone", template: "A tuo carico",      freelancer: "A tuo carico",     agenzia: "Inclusi",        promoOk: true },
  { label: "Supporto in italiano",          promo: "Diretto via WhatsApp", template: "Forum / email", freelancer: "Spesso difficile",  agenzia: "Sì, ufficio",   promoOk: true },
  { label: "Prezzo realistico",             promo: "Da 890€ una tantum", template: "50-300€",          freelancer: "1.500-3.000€",     agenzia: "5.000-15.000€",  promoOk: true },
];

export default function LavoriSvolti() {
  return (
    <section id="perche" className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            Perché sceglierci
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Perché affidarti a <span className="text-indigo-600">PromoApp.it</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Non un template. Non un freelancer dall'altra parte del mondo. Un partner italiano,
            con <strong>P.IVA verificabile</strong> e responsabilità reale sul lavoro che facciamo per te.
          </p>
        </div>

        {/* Pilastri di fiducia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {PILLARS.map((p, i) => (
            <div key={i} className={`relative bg-white p-6 rounded-2xl border ${p.border} shadow-sm hover:shadow-lg transition group`}>
              <div className={`w-14 h-14 rounded-2xl ${p.bg} ${p.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition transform`}>
                <i className={`fas ${p.icon}`}></i>
              </div>
              <h3 className="font-extrabold text-gray-900 mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{p.text}</p>
              <span className={`inline-block ${p.bg} ${p.color} text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md`}>
                <i className="fas fa-check mr-1"></i>{p.badge}
              </span>
            </div>
          ))}
        </div>

        {/* Tabella confronto */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              PromoApp vs altre soluzioni
            </h3>
            <p className="text-sm text-gray-500">Confronto onesto: qui sotto trovi cosa ottieni davvero scegliendo noi.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Caratteristica</th>
                    <th className="p-4 font-extrabold text-indigo-600 uppercase text-xs tracking-wider bg-indigo-50/50 border-x border-indigo-100">
                      <i className="fas fa-star text-yellow-500 mr-1"></i>PromoApp.it
                    </th>
                    <th className="p-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Template</th>
                    <th className="p-4 font-bold text-gray-400 uppercase text-xs tracking-wider hidden sm:table-cell">Freelancer estero</th>
                    <th className="p-4 font-bold text-gray-400 uppercase text-xs tracking-wider">Agenzia tradizionale</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="p-4 font-semibold text-gray-700">{row.label}</td>
                      <td className="p-4 text-center font-bold text-emerald-700 bg-indigo-50/30 border-x border-indigo-100">
                        <i className="fas fa-check-circle text-emerald-500 mr-1"></i>{row.promo}
                      </td>
                      <td className="p-4 text-center text-gray-500 text-xs">{row.template}</td>
                      <td className="p-4 text-center text-gray-500 text-xs hidden sm:table-cell">{row.freelancer}</td>
                      <td className="p-4 text-center text-gray-500 text-xs">{row.agenzia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Garanzie concrete */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-10 text-white text-center shadow-xl">
          <div className="max-w-3xl mx-auto">
            <i className="fas fa-handshake text-4xl text-yellow-300 mb-3"></i>
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3">
              Le nostre garanzie scritte
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 mt-6 text-left">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <i className="fas fa-clock text-yellow-300 text-xl mb-2"></i>
                <p className="font-bold mb-1">7 giorni di tempo</p>
                <p className="text-xs text-indigo-100">per accettare il progetto dopo aver visto la dashboard</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <i className="fas fa-eye text-yellow-300 text-xl mb-2"></i>
                <p className="font-bold mb-1">Anteprima prima di pagare</p>
                <p className="text-xs text-indigo-100">vedi la tua App navigabile prima di investire un solo euro</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
                <i className="fas fa-key text-yellow-300 text-xl mb-2"></i>
                <p className="font-bold mb-1">Sblocco definitivo</p>
                <p className="text-xs text-indigo-100">l'App resta tua per sempre, anche se cambi fornitore</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#contatti"
                className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-7 py-3 rounded-xl font-extrabold shadow-lg hover:scale-105 transition transform"
              >
                <i className="fas fa-rocket"></i>
                Richiedi un preventivo gratuito
              </a>
              <a
                href="https://wa.me/393793602035"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur border-2 border-white/30 text-white px-7 py-3 rounded-xl font-bold transition"
              >
                <i className="fab fa-whatsapp text-lg"></i>
                Parla con noi
              </a>
            </div>
            <p className="text-xs text-indigo-200 mt-4">
              <i className="fas fa-lock mr-1"></i>
              Sophia 2005 S.r.l. · P.IVA 08223951008 · azienda registrata in Italia
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
