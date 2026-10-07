import { useEffect } from "react";
import { Link } from "wouter";
import { getReceipt, markReceiptViewed } from "../lib/lead-receipt";
import { trackEvent, trackWhatsApp } from "../lib/analytics";
import { whatsappUrl, appPath } from "../lib/marketing";
import { commercialIncentive } from "../lib/commercial";
import "../styles/commercial.css";
export default function ThankYou() {
  const receipt = getReceipt();
  useEffect(() => {
    if (receipt && !receipt.viewed) {
      trackEvent("thank_you_view", receipt.service, "thanks", receipt.slug, receipt.leadId);
      markReceiptViewed();
    }
  }, [receipt]);
  return <main className="min-h-screen bg-indigo-950 text-white px-5 py-20 flex items-center justify-center">
    <section className="max-w-xl w-full bg-white rounded-3xl p-8 text-gray-900 shadow-2xl text-center">
      <p className="font-black text-emerald-600 mb-4">PromoApp.it</p>
      <h1 className="text-3xl font-black mb-4">{receipt ? "Richiesta ricevuta!" : "Parliamo della tua attività"}</h1>
      <p className="text-gray-600 mb-6">{receipt ? `La tua richiesta è stata salvata. ${receipt.offerConfirmation ?? commercialIncentive().confirmation}` :
        "Puoi richiedere un’anteprima gratuita e senza impegno dal modulo della homepage."}</p>
      {receipt?.notification === "pending" && <p className="text-sm text-gray-500 mb-6">La richiesta è registrata; la notifica interna è in attesa. Non occorre inviare nuovamente il modulo.</p>}
      <a className="inline-flex items-center gap-2 bg-emerald-500 text-white font-bold px-6 py-3 rounded-full" href={whatsappUrl(receipt?.service, receipt?.slug)}
        target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsApp(receipt?.service ?? "generale", "thanks", receipt?.slug)}>
        <i className="fab fa-whatsapp" aria-hidden="true" /> Scrivici su WhatsApp
      </a>
      <p className="mt-6"><Link href="/">Torna alla homepage</Link></p>
      <a className="block mt-4 text-xs text-gray-500 underline" href={appPath("/privacy.html")}>Informativa privacy</a>
    </section>
  </main>;
}
