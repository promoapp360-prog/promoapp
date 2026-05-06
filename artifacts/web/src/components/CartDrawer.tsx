import { useCart } from "../lib/CartContext";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";

export default function CartDrawer() {
  const { item, removeItem, isOpen, closeCart } = useCart();
  const [, navigate] = useLocation();
  const { isSignedIn } = useUser();

  if (!isOpen) return null;

  function procedi() {
    closeCart();
    if (isSignedIn) {
      navigate(`/checkout?piano=${item?.id ?? "base"}`);
    } else {
      navigate(`/registrazione?piano=${item?.id ?? "base"}`);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[9999] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-shopping-cart text-indigo-600"></i>
            Il tuo Carrello
          </h2>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Contenuto */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!item ? (
            <div className="text-center py-16">
              <i className="fas fa-shopping-cart text-4xl text-gray-200 mb-4 block"></i>
              <p className="text-gray-400">Il carrello è vuoto</p>
              <button
                onClick={closeCart}
                className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
              >
                Scopri i nostri piani →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card prodotto */}
              <div className="border border-indigo-100 rounded-2xl p-5 bg-indigo-50/50 relative">
                <button
                  onClick={removeItem}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition text-sm"
                  title="Rimuovi"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                    <i className="fas fa-mobile-alt text-white"></i>
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">{item.nome}</div>
                    <div className="text-xs text-gray-500 mt-0.5">App personalizzata + gestionale</div>
                    <div className="mt-2">
                      <span className="text-2xl font-extrabold text-indigo-700">{item.prezzo}€</span>
                      <span className="text-xs text-gray-400"> una tantum</span>
                    </div>
                    <div className="text-xs text-indigo-600 font-medium">+ {item.mensile}€/mese · hosting & assistenza</div>
                  </div>
                </div>
              </div>

              {/* Promo 6+6 */}
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl p-4 text-sm flex items-center gap-2">
                <i className="fas fa-fire text-yellow-300"></i>
                <span><strong>PROMO:</strong> Paghi 6 mesi, altri 6 sono <strong className="text-yellow-300">GRATIS</strong></span>
              </div>

              {/* Riepilogo */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>App una tantum</span>
                  <span className="font-semibold">{item.prezzo}€</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Canone mensile</span>
                  <span className="font-semibold">{item.mensile}€/mese</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
                  <span>Totale ora</span>
                  <span className="text-indigo-700 text-base">{item.prezzo}€</span>
                </div>
              </div>

              <div className="text-xs text-gray-400 text-center">
                🔒 Nessun addebito automatico sui canoni mensili
              </div>
            </div>
          )}
        </div>

        {/* Footer con CTA */}
        {item && (
          <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-4">
            <button
              onClick={procedi}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-base flex items-center justify-center gap-2"
            >
              <i className="fas fa-arrow-right"></i>
              Procedi all'acquisto
            </button>
            <button
              onClick={closeCart}
              className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition"
            >
              Continua a navigare
            </button>
          </div>
        )}
      </div>
    </>
  );
}
