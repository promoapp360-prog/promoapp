import type { Sector } from "../../lib/commercial";

/** A single configurable illustration, not a working client application. */
export default function SectorMockup({ sector, businessName = "" }: { sector: Sector; businessName?: string }) {
  const preview = sector.mockup;
  return <figure className="sector-example" data-testid="sector-mockup">
    <div className={`sector-device sector-device-${preview.kind}`}>
      <div className="sector-device-top" aria-hidden="true"><span /> <span>Anteprima</span><span>●</span></div>
      <header className="sector-device-header">
        <small>Esempio illustrativo</small>
        <strong>{businessName.trim().slice(0, 160) || "La tua attività"}</strong>
        <p>{preview.title}</p>
      </header>
      <div className="sector-device-tabs" aria-label="Sezioni dell'esempio">
        {preview.tabs.map((tab, index) => <span className={index === 0 ? "selected" : ""} key={tab}>{tab}</span>)}
      </div>
      {preview.kind === "calendar" && <div className="sector-week" aria-label="Settimana dimostrativa">
        {["Lun", "Mar", "Mer", "Gio", "Ven"].map((day, index) => <span className={index === 1 ? "selected" : ""} key={day}>{day}<b>{index + 12}</b></span>)}
      </div>}
      <div className="sector-device-rows">
        {preview.rows.map((row, index) => <div className="sector-device-row" key={row.title}>
          {["stock", "properties"].includes(preview.kind) && <span className="sector-row-icon" aria-hidden="true">{preview.kind === "properties" ? "⌂" : "▣"}</span>}
          <div><strong>{row.title}</strong><p>{row.detail}</p></div>
          <span className={`sector-row-badge badge-${index}`}>{row.badge}</span>
        </div>)}
      </div>
      <div className="sector-device-bottom">Schermata dimostrativa · nessuna operazione reale</div>
    </div>
    <figcaption><strong>Esempio illustrativo</strong><p>{sector.example}</p>
      <small>Contenuti, prezzi e disponibilità dell'esempio sono dimostrativi. Funzioni e costi della soluzione si definiscono nel preventivo.</small>
    </figcaption>
  </figure>;
}
