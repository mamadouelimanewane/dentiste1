"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function PortalLogoutButton() {
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/portal/logout", { method: "POST" });
    } finally {
      // On quitte vers l'écran "lien invalide" : la session est fermée, le lien
      // d'origine reste utilisable tant qu'il n'a pas expiré.
      window.location.href = "/portal/invalid";
    }
  };

  return (
    <button
      onClick={logout}
      disabled={busy}
      title="Fermer ma session"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-white/10 hover:bg-white/20 border border-white/15 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
    >
      <LogOut className="h-3.5 w-3.5" />
      {busy ? "Fermeture..." : "Se déconnecter"}
    </button>
  );
}
