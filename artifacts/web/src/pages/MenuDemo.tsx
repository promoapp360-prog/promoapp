import { useState } from "react";
import { Link } from "wouter";
import "../styles/commercial.css";

const MENU = {
  Antipasti: [{ name: "Tagliere della casa", text: "Salumi e formaggi del territorio", price: "14,00" }, { name: "Caponata", text: "Verdure di stagione", price: "8,00" }],
  Primi: [{ name: "Tonnarelli cacio e pepe", text: "Pecorino romano, pepe nero", price: "12,00" }, { name: "Gnocchi al pomodoro", text: "Basilico fresco", price: "10,00" }],
  Secondi: [{ name: "Tagliata di manzo", text: "Rucola e scaglie di grana", price: "18,00" }],
  Dolci: [{ name: "Tiramisù", text: "Ricetta classica", price: "6,00" }, { name: "Panna cotta", text: "Frutti rossi", price: "5,50" }],
};
export default function MenuDemo() {
  const [category, setCategory] = useState<keyof typeof MENU>("Antipasti");
  return <main className="marketing-page p-5" style={{ background: "#16123f" }}>
    <div className="max-w-xl mx-auto">
      <Link href="/menu-digitali" className="inline-block text-emerald-300 text-sm font-semibold mb-6">← Torna ai menu PromoApp</Link>
      <div className="bg-white rounded-3xl overflow-hidden">
        <header className="px-6 py-8 bg-[#2b2370] text-white">
          <p className="text-emerald-300 text-xs uppercase tracking-wider mb-3">Esempio illustrativo · non è un locale cliente</p>
          <h1 className="text-3xl font-bold">Trattoria Esempio</h1><p className="mt-3 text-indigo-200 text-sm">Il nostro menu digitale</p>
        </header>
        <div className="p-5">
          <div role="group" aria-label="Categorie del menu" className="flex flex-wrap gap-2 mb-6">
            {(Object.keys(MENU) as (keyof typeof MENU)[]).map((item) => <button key={item} type="button" aria-pressed={category === item}
              onClick={() => setCategory(item)} className={`px-4 py-3 rounded-full text-xs font-bold ${category === item ? "bg-[#2b2370] text-white" : "bg-gray-100 text-gray-600"}`}>{item}</button>)}
          </div>
          <h2 className="text-xl font-bold mb-5">{category}</h2>
          <div>{MENU[category].map((dish) => <article key={dish.name} className="flex justify-between gap-4 py-5 border-b border-gray-100">
            <div><h3 className="font-bold text-base">{dish.name}</h3><p className="text-sm text-gray-500 mt-2">{dish.text}</p></div>
            <p className="font-bold text-sm whitespace-nowrap">{dish.price} €</p>
          </article>)}</div>
          <p className="text-xs text-gray-500 mt-6">Piatti, ingredienti e prezzi sono dimostrativi. Nessun ordine o pagamento viene raccolto.</p>
        </div>
      </div>
      <p className="text-center text-indigo-200 text-xs mt-5">Realizzato come esempio di navigazione · PromoApp.it</p>
    </div>
  </main>;
}
