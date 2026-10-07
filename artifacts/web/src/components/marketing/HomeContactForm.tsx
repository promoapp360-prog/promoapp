import type { ChangeEvent, FormEvent } from "react";
import { appPath, whatsappUrl } from "../../lib/marketing";
import { trackWhatsApp } from "../../lib/analytics";

type Fields = { nome_attivita: string; email: string; whatsapp: string; settore: string; messaggio: string };
type Props = {
  form: Fields;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  sent: boolean;
  loading: boolean;
  error: string;
  privacy: boolean;
  onPrivacyChange: (checked: boolean) => void;
  sectors: readonly string[];
  placement?: "hero" | "final";
};

// Both placements use the homepage's existing request state and submit handler.
// Unique IDs keep labels and validation independent; success prevents resubmission.
export default function HomeContactForm({
  form, onChange, onSubmit, sent, loading, error, privacy, onPrivacyChange, sectors, placement = "hero",
}: Props) {
  const prefix = placement === "final" ? "final-" : "";
  if (sent) return <div className="bg-white rounded-3xl p-8 text-center shadow-2xl" data-testid={`${prefix}message-sent`}>
    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
      <i className="fas fa-check text-white text-2xl" aria-hidden="true" />
    </div>
    <h3 className="text-2xl font-black text-gray-900 mb-2">Richiesta inviata!</h3>
    <p className="text-gray-500 mb-6 leading-relaxed text-sm">Grazie. Ti ricontatteremo ai recapiti indicati per parlare del tuo progetto.</p>
    <a href={whatsappUrl()} onClick={() => trackWhatsApp("generale", `${placement}-thanks`)}
      target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-md"
      data-testid={`${prefix}link-whatsapp-thanks`}>
      <i className="fab fa-whatsapp text-lg" aria-hidden="true" /> Scrivici su WhatsApp
    </a>
  </div>;
  return <form onSubmit={onSubmit}
    className="bg-white rounded-3xl p-6 shadow-[0_32px_80px_rgba(0,0,0,0.35)] space-y-3.5"
    data-testid={`${prefix}form-preventivo`}>
    <div className="pb-1 border-b border-gray-100">
      <h2 className="text-lg font-black text-gray-900">Fai il primo passo: raccontaci la tua attività</h2>
      <p className="text-xs text-gray-400 mt-0.5">Parla direttamente con chi realizza il progetto.</p>
    </div>
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor={`${prefix}nome_attivita`}>
        Nome / attività <span className="text-red-500">*</span>
      </label>
      <input id={`${prefix}nome_attivita`} name="nome_attivita" type="text" required minLength={2} maxLength={160} autoComplete="name"
        value={form.nome_attivita} onChange={onChange} placeholder="Es. Parrucchiere Mario Rossi"
        className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm placeholder:text-gray-300"
        data-testid={`${prefix}input-nome-attivita`} />
    </div>
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor={`${prefix}settore`}>
        Tipo di attività <span className="text-red-500">*</span>
      </label>
      <select id={`${prefix}settore`} name="settore" required value={form.settore} onChange={onChange}
        className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm"
        data-testid={`${prefix}select-settore`}>
        <option value="">Seleziona...</option>
        {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor={`${prefix}email`}>Email (facoltativa)</label>
        <input id={`${prefix}email`} name="email" type="email" maxLength={254} autoComplete="email"
          value={form.email} onChange={onChange} placeholder="nome@email.it"
          className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm placeholder:text-gray-300"
          data-testid={`${prefix}input-email`} />
      </div>
      <div>
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor={`${prefix}whatsapp`}>
          WhatsApp <span className="text-red-500">*</span>
        </label>
        <input id={`${prefix}whatsapp`} name="whatsapp" type="tel" required minLength={6} maxLength={30} autoComplete="tel"
          value={form.whatsapp} onChange={onChange} placeholder="+39 340..."
          className="w-full border-2 border-gray-100 focus:border-emerald-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm placeholder:text-gray-300"
          data-testid={`${prefix}input-whatsapp`} />
      </div>
    </div>
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5" htmlFor={`${prefix}messaggio`}>
        Cosa ti serve? <span className="text-red-500">*</span>
      </label>
      <textarea id={`${prefix}messaggio`} name="messaggio" required rows={3} minLength={10} maxLength={5000}
        value={form.messaggio} onChange={onChange} placeholder="Raccontaci cosa ti serve: sito web, web app, gestionale o menu digitale..."
        className="w-full border-2 border-gray-100 focus:border-indigo-500 bg-gray-50 focus:bg-white rounded-xl px-3.5 py-2.5 text-gray-900 outline-none transition text-sm resize-none placeholder:text-gray-300"
        data-testid={`${prefix}textarea-messaggio`} />
    </div>
    <label className="flex items-start gap-2 text-[10px] text-gray-500">
      <input type="checkbox" required checked={privacy} onChange={(e) => onPrivacyChange(e.target.checked)} className="mt-1 accent-indigo-600" />
      <span>Ho letto l'<a href={appPath("/privacy.html")} target="_blank" rel="noopener noreferrer" className="underline text-indigo-700">informativa privacy</a> e acconsento al trattamento per ricevere risposta alla richiesta. Nessuna iscrizione pubblicitaria.</span>
    </label>
    {error && <p className="text-red-500 text-xs font-semibold flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2" role="alert" data-testid={`${prefix}text-error`}>
      <i className="fas fa-exclamation-circle" aria-hidden="true" /> {error}
    </p>}
    <button type="submit" disabled={loading}
      className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60 text-white py-3.5 rounded-xl font-black text-sm tracking-wide transition shadow-lg shadow-indigo-900/40 hover:shadow-indigo-500/30 active:scale-[0.98]"
      data-testid={`${prefix}button-submit`}>
      {loading ? <><i className="fas fa-spinner fa-spin mr-2" aria-hidden="true" />Invio in corso...</>
        : <><i className="fas fa-paper-plane mr-2" aria-hidden="true" />Richiedi Consulenza Gratuita</>}
    </button>
    <div className="text-center pt-0.5">
      <a href={whatsappUrl()} onClick={() => trackWhatsApp("generale", `${placement}-form`)} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 text-sm font-bold transition"
        data-testid={`${prefix}link-whatsapp-alt`}>
        <i className="fab fa-whatsapp text-base" aria-hidden="true" /> Oppure scrivici su WhatsApp
      </a>
    </div>
  </form>;
}
