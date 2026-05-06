import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [url, setUrl] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`preview_${id}`);
    if (!stored) {
      navigate("/");
      return;
    }
    setUrl(stored);
  }, [id, navigate]);

  function handleLoad() {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) setBlocked(true);
    } catch {
      setBlocked(true);
    }
  }

  function handleBack() {
    sessionStorage.removeItem(`preview_${id}`);
    navigate("/");
  }

  if (!url) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900 z-50">
      {/* Barra superiore — mostra sempre promoapp.it */}
      <div className="flex items-center gap-3 bg-gray-900 border-b border-gray-700 px-4 py-2 shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Torna a PromoApp.it</span>
        </button>
        <div className="flex-1 flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 max-w-md mx-auto">
          <i className="fas fa-lock text-emerald-400 text-xs"></i>
          <span className="text-white/60 text-sm truncate select-none">promoapp.it/lavori/{id}</span>
        </div>
        <div className="text-indigo-400 font-bold text-sm hidden md:block">
          Promo<span className="text-emerald-400">App</span>.it
        </div>
      </div>

      {/* Iframe a schermo intero */}
      {blocked ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white gap-4 px-4 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center text-3xl mb-2">
            <i className="fas fa-shield-alt text-yellow-400"></i>
          </div>
          <h2 className="text-xl font-bold">Anteprima non disponibile</h2>
          <p className="text-gray-400 max-w-sm font-light">
            Questo progetto non consente l'incorporamento. Aprilo direttamente nel browser.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition"
          >
            Apri in una nuova scheda <i className="fas fa-external-link-alt ml-2"></i>
          </a>
          <button onClick={handleBack} className="text-gray-500 hover:text-white text-sm transition mt-2">
            ← Torna alla home
          </button>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={handleLoad}
          onError={() => setBlocked(true)}
          className="flex-1 w-full border-0"
          title="Anteprima progetto"
          allow="fullscreen"
        />
      )}
    </div>
  );
}
