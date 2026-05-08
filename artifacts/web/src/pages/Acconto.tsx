import { useEffect } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Acconto() {
  useEffect(() => {
    window.location.replace(`${basePath}/pagamenti`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Reindirizzamento...</p>
    </div>
  );
}
