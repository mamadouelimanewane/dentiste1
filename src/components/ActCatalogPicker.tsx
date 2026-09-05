"use client";

import React, { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { DENTAL_NOMENCLATURE, DentalProcedure, D_VALUE, prixSelonD } from "@/lib/pricing";
import { cn } from "@/lib/utils";

// Sélecteur d'actes partagé par la Consultation (devis) et la Réalisation.
// Les deux écrans affichaient les 59 actes en liste plate, sans recherche ni
// regroupement, alors que la nomenclature porte déjà une catégorie : trouver
// un acte imposait de parcourir toute la liste en pleine consultation.
export function ActCatalogPicker({
  onPick,
  ctaLabel,
  // Base tarifaire appliquée. Le catalogue affichait les prix figés à
  // D = 1 200 quelle que soit la convention choisie : un praticien chiffrant
  // pour une IPM à D = 1 000 lisait des montants qui n'étaient pas ceux du
  // devis qu'il était en train de bâtir.
  valeurD = D_VALUE,
}: {
  onPick: (procedure: DentalProcedure) => void;
  ctaLabel?: string;
  valeurD?: number;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Toutes");

  const categories = useMemo(
    () => ["Toutes", ...Array.from(new Set(DENTAL_NOMENCLATURE.map((p) => p.category)))],
    []
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DENTAL_NOMENCLATURE.filter((p) => {
      const okCat = category === "Toutes" || p.category === category;
      const okQuery =
        !q ||
        p.label.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.cotation || "").toLowerCase().includes(q);
      return okCat && okQuery;
    });
  }, [query, category]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-slate-100 space-y-2 bg-white">
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-sm">
          <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un acte (nom, code, cotation)..."
            className="bg-transparent border-none outline-none text-xs font-bold w-full text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-sm whitespace-nowrap transition-all",
                category === c
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        {results.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">Aucun acte ne correspond.</p>
        )}
        {results.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded hover:border-blue-200 hover:bg-blue-50/30 transition-all gap-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900">{p.label}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase">
                {prixSelonD(p, valeurD).toLocaleString("fr-FR")} FCFA
                {p.cotation && <span className="text-slate-400 ml-2">{p.cotation}</span>}
              </p>
            </div>
            <button
              onClick={() => onPick(p)}
              title={ctaLabel || "Ajouter"}
              className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded bg-slate-50 border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-slate-500"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          {results.length} acte(s) sur {DENTAL_NOMENCLATURE.length}
        </p>
      </div>
    </div>
  );
}
