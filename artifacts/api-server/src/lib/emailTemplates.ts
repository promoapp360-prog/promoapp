export interface EmailRicevutaParams {
  nome: string;
  cognome: string;
  progetto: string;
  importo: number;
  id: string;
  paidAt: string;
  tipo: string;
  ragioneSociale?: string | null;
  piva?: string | null;
  tipoPagamento: string;
  importoTotale?: number | null;
  saldoRimanente?: number;
  metodoPagamento?: "paypal" | "stripe";
}

export function emailRicevuta(a: EmailRicevutaParams): string {
  const importoFmt = (a.importo / 100).toFixed(2).replace(".", ",");
  const dataFmt = new Date(a.paidAt).toLocaleDateString("it-IT", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const intestazione =
    a.tipo === "azienda" && a.ragioneSociale
      ? a.ragioneSociale
      : `${a.nome} ${a.cognome}`;
  const isSaldo = a.tipoPagamento === "saldo";
  const headerLabel = isSaldo ? "Ricevuta Pagamento Saldo" : "Ricevuta Acconto";
  const color = isSaldo ? "#10b981" : "#6366f1";
  const metodoLabel =
    a.metodoPagamento === "stripe"
      ? "Carta di credito (Stripe)"
      : a.metodoPagamento === "paypal"
        ? "PayPal"
        : "";

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${headerLabel} — PromoApp.it</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#0ea5e9 50%,#10b981 100%);padding:40px 32px;text-align:center;">
        <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-1px;margin-bottom:4px;">Promo<span style="color:#fbbf24;">App</span>.it</div>
        <div style="color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:2px;text-transform:uppercase;">${headerLabel}</div>
      </td></tr>
      <tr><td style="padding:32px 32px 0;text-align:center;">
        <div style="display:inline-block;background:${isSaldo ? "#dcfce7" : "#ede9fe"};border:2px solid ${color};border-radius:50px;padding:10px 24px;">
          <span style="color:${isSaldo ? "#15803d" : "#5b21b6"};font-size:15px;font-weight:700;">✓ ${isSaldo ? "Saldo pagato — progetto completamente saldato!" : "Acconto ricevuto e confermato"}</span>
        </div>
      </td></tr>
      <tr><td style="padding:28px 32px 0;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px;">
          <div style="font-size:12px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;">Riepilogo transazione</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:50%;">N° ricevuta</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;font-family:monospace;">${a.id.slice(0, 8).toUpperCase()}</td></tr>
            <tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Data</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${dataFmt}</td></tr>
            <tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Intestato a</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${intestazione}</td></tr>
            ${metodoLabel ? `<tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Metodo pagamento</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${metodoLabel}</td></tr>` : ""}
            <tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
            <tr><td style="padding:12px 0 4px;color:#374151;font-size:14px;font-weight:600;vertical-align:top;">Progetto</td><td style="padding:12px 0 4px;color:#111827;font-size:14px;text-align:right;">${a.progetto}</td></tr>
            ${a.importoTotale ? `<tr><td colspan="2" style="border-top:1px solid #e5e7eb;"></td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Totale progetto</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${(a.importoTotale / 100).toFixed(2).replace(".", ",")}€</td></tr>` : ""}
            <tr><td colspan="2" style="border-top:2px solid ${color};margin-top:8px;"></td></tr>
            <tr><td style="padding:16px 0 0;color:#374151;font-size:18px;font-weight:700;">${isSaldo ? "Saldo pagato" : "Acconto versato"}</td><td style="padding:16px 0 0;text-align:right;"><span style="font-size:32px;font-weight:900;color:${color};">${importoFmt}€</span></td></tr>
            ${a.saldoRimanente !== undefined && a.saldoRimanente > 0 ? `<tr><td style="padding:4px 0;color:#6b7280;font-size:13px;">Saldo rimanente</td><td style="padding:4px 0;color:#f59e0b;font-size:15px;font-weight:700;text-align:right;">${(a.saldoRimanente / 100).toFixed(2).replace(".", ",")}€</td></tr>` : ""}
            ${isSaldo ? `<tr><td colspan="2" style="padding-top:8px;"><div style="text-align:center;background:#dcfce7;border-radius:8px;padding:8px;color:#15803d;font-size:12px;font-weight:600;">🎉 Progetto completamente saldato!</div></td></tr>` : ""}
          </table>
        </div>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">Gentile <strong>${a.nome}</strong>,<br><br>${isSaldo ? `il pagamento del saldo di <strong>${importoFmt}€</strong> per il progetto <strong>"${a.progetto}"</strong> è stato ricevuto. Il progetto è ora completamente saldato.` : `abbiamo ricevuto il tuo acconto di <strong>${importoFmt}€</strong> per il progetto <strong>"${a.progetto}"</strong>. Il nostro team ti contatterà a breve.`}</p>
        <div style="margin-top:20px;padding:16px;background:#eff6ff;border-radius:12px;border-left:4px solid #6366f1;">
          <p style="margin:0;color:#1e40af;font-size:13px;">📞 Hai domande? Scrivici su WhatsApp al <strong>+39 379 360 2035</strong></p>
        </div>
      </td></tr>
      <tr><td style="background:#1e1b4b;padding:24px 32px;text-align:center;border-radius:0 0 20px 20px;">
        <div style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;margin-bottom:4px;">PromoApp.it — Sophia 2005 S.r.l.</div>
        <div style="color:rgba(255,255,255,0.5);font-size:11px;">P.IVA 08223951008 · info@promoapp.it</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
