import { useRef, type ChangeEvent, type FormEvent } from "react";
import { appPath, whatsappUrl } from "../../lib/marketing";
import { trackEvent, trackWhatsApp } from "../../lib/analytics";
import { commercialIncentive } from "../../lib/commercial";

type Fields = { nome_attivita: string; email: string; whatsapp: string; settore: string; messaggio: string; website: string };
type Props = {
  form: Fields;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  sent: boolean; loading: boolean; error: string; privacy: boolean;
  onPrivacyChange: (checked: boolean) => void; sectors: readonly string[];
};
export default function HomeContactForm({ form, onChange, onSubmit, sent, loading, error, privacy, onPrivacyChange, sectors }: Props) {
  const started = useRef(false);
  const incentive = commercialIncentive();
  if (sent) return <div className="bg-white rounded-3xl p-8 text-center shadow-2xl" role="status">Richiesta salvata. Ti ricontatteremo al numero indicato.</div>;
  const inputClass = "w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-base sm:text-sm placeholder:text-gray-300";
  return <form onSubmit={onSubmit}
    onFocusCapture={() => { if (!started.current) { trackEvent("form_start", "generale", "homepage"); started.current = true; } }}
    className="bg-white rounded-3xl p-6 shadow-[0_32px_80px_rgba(0,0,0,0.35)] space-y-3.5" data-testid="form-preventivo">
    <div className="pb-1 border-b border-gray-100">
      <h2 className="text-lg font-black text-gray-900">Fai il primo passo: raccontaci la tua attività</h2>
      <p className="text-xs text-gray-500 mt-0.5">Tre dati, nessun impegno. {incentive.promise}</p>
    </div>
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="nome_attivita">Nome attività <span className="text-red-500">*</span></label>
      <input id="nome_attivita" name="nome_attivita" required minLength={2} maxLength={160} autoComplete="organization"
        value={form.nome_attivita} onChange={onChange} placeholder="Es. Salone Mario Rossi" className={inputClass} data-testid="input-nome-attivita" />
    </div>
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="settore">Tipo di attività <span className="text-red-500">*</span></label>
      <select id="settore" name="settore" required value={form.settore} onChange={onChange} className={inputClass} data-testid="select-settore">
        <option value="">Seleziona...</option>{sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
      </select>
    </div>
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor="whatsapp">WhatsApp <span className="text-red-500">*</span></label>
      <input id="whatsapp" name="whatsapp" type="tel" required minLength={6} maxLength={30} autoComplete="tel" inputMode="tel"
        value={form.whatsapp} onChange={onChange} placeholder="+39 340..." className={inputClass} data-testid="input-whatsapp" />
    </div>
    <div className="lead-honeypot" aria-hidden="true"><label htmlFor="home-website">Lascia vuoto</label>
      <input id="home-website" name="website" autoComplete="off" tabIndex={-1} value={form.website} onChange={onChange} /></div>
    <label className="flex items-start gap-2 text-[10px] text-gray-500">
      <input type="checkbox" required checked={privacy} onChange={(e) => onPrivacyChange(e.target.checked)} className="mt-1 accent-indigo-600" />
      <span>Ho letto l'<a href={appPath("/privacy.html")} target="_blank" rel="noopener noreferrer" className="underline text-indigo-700">informativa privacy</a> e acconsento al trattamento per ricevere risposta alla richiesta. Nessuna iscrizione pubblicitaria.</span>
    </label>
    {error && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2" role="alert" data-testid="text-error">{error}</p>}
    <button type="submit" disabled={loading}
      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-black text-sm tracking-wide transition shadow-lg shadow-indigo-900/40 hover:shadow-indigo-500/30 active:scale-[0.98]" data-testid="button-submit">
      {loading ? "Invio in corso..." : incentive.formCta}
    </button>
    <p className="text-xs text-gray-500">{incentive.responseNote}</p>
    <div className="text-center pt-0.5">
      <a href={whatsappUrl()} onClick={() => trackWhatsApp("generale", "hero-form")} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm font-bold transition">
        <i className="fab fa-whatsapp text-base" aria-hidden="true" /> Scrivici su WhatsApp
      </a>
    </div>
  </form>;
}
