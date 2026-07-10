"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";

export function PortalDocumentUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/portal/documents", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white border border-dashed border-slate-300 rounded p-5 text-center">
      <label className="cursor-pointer flex flex-col items-center gap-2">
        <Upload className="h-6 w-6 text-slate-400" />
        <span className="text-xs font-bold text-slate-600">
          {uploading ? "Envoi en cours…" : "Envoyer un document au cabinet"}
        </span>
        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
