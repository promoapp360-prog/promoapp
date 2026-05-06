import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem(`preview_token_${id}`);
    if (!token) {
      navigate("/");
      return;
    }
    setIframeSrc(`/api/proxy/${id}/?token=${token}`);
  }, [id, navigate]);

  function handleBack() {
    sessionStorage.removeItem(`preview_token_${id}`);
    navigate("/");
  }

  if (!iframeSrc) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      {/* Barra superiore — mostra sempre promoapp.it */}
      <div className="flex items-center gap-3 bg-gray-900 border-b border-gray-700 px-4 py-2 shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition whitespace-nowrap"
        >
          <i className="fas fa-arrow-left"></i>
          <span className="hidden sm:inline">Torna a PromoApp.it</span>
        </button>
        <div className="flex-1 flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 min-w-0">
          <i className="fas fa-lock text-emerald-400 text-xs shrink-0"></i>
          <span className="text-white/60 text-sm truncate select-none">
            promoapp.it/lavori/{id}
          </span>
        </div>
        <div className="text-indigo-400 font-bold text-sm hidden md:block shrink-0">
          Promo<span className="text-emerald-400">App</span>.it
        </div>
      </div>

      {/* Iframe — serve il progetto tramite il nostro proxy */}
      <iframe
        src={iframeSrc}
        className="flex-1 w-full border-0 bg-white"
        title="Anteprima progetto"
        allow="fullscreen"
      />
    </div>
  );
}
