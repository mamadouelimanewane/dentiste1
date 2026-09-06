"use client";

import React from "react";
import { cn } from "@/lib/utils";

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

interface OdontogramProps {
  selectedTooth: number | null;
  onSelectTooth: (tooth: number) => void;
  // Optionnel : un objet pour les états des dents (soigné, carie, absent)
  toothStates?: Record<number, "healthy" | "caries" | "filled" | "missing">;
}

// Composant pour dessiner une dent (simplifiée en 5 faces)
function ToothSvg({
  number,
  isSelected,
  state = "healthy",
  onClick,
}: {
  number: number;
  isSelected: boolean;
  state?: "healthy" | "caries" | "filled" | "missing";
  onClick: () => void;
}) {
  const isUpper = number < 30;
  
  // Couleurs selon l'état
  let baseColor = "white";
  let strokeColor = "#cbd5e1"; // slate-300
  
  if (state === "caries") baseColor = "#fecaca"; // red-200
  if (state === "filled") baseColor = "#bfdbfe"; // blue-200
  if (state === "missing") baseColor = "#f1f5f9"; // slate-100 (and transparent outline)

  if (isSelected) {
    strokeColor = "#2563eb"; // blue-600
  }

  // Path SVG simplifié (couronne carrée aux bords arrondis pour illustration)
  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer flex flex-col items-center gap-1 transition-all",
        isSelected ? "scale-110" : "hover:scale-105"
      )}
    >
      {isUpper && <span className={cn("text-[10px] font-bold", isSelected ? "text-blue-600" : "text-slate-400")}>{number}</span>}
      {/* Taille fixée en classes plutôt qu'en attributs : la dent s'agrandit
          sur les écrans qui ont la place, sans changer le tracé. */}
      <svg viewBox="0 0 24 32" className="w-6 h-8 lg:w-7 lg:h-9 drop-shadow-sm">
        <g stroke={strokeColor} strokeWidth={isSelected ? "2" : "1"} fill={baseColor}>
          {/* Racine */}
          {isUpper ? (
            <path d="M 6 14 Q 6 2 12 2 Q 18 2 18 14 Z" fill={state === 'missing' ? 'transparent' : '#f8fafc'} />
          ) : (
            <path d="M 6 18 Q 6 30 12 30 Q 18 30 18 18 Z" fill={state === 'missing' ? 'transparent' : '#f8fafc'} />
          )}
          {/* Couronne */}
          <rect x="4" y="12" width="16" height="10" rx="3" fill={state === 'missing' ? 'transparent' : baseColor} />
          
          {/* Lignes pour simuler les faces si non manquant */}
          {state !== 'missing' && (
            <>
              <path d="M 4 12 L 8 16" />
              <path d="M 20 12 L 16 16" />
              <path d="M 4 22 L 8 18" />
              <path d="M 20 22 L 16 18" />
              <rect x="8" y="16" width="8" height="2" fill={strokeColor} opacity={0.3} />
            </>
          )}
        </g>
        {state === "missing" && (
          <path d="M 4 12 L 20 22 M 20 12 L 4 22" stroke="#94a3b8" strokeWidth="1.5" />
        )}
      </svg>
      {!isUpper && <span className={cn("text-[10px] font-bold", isSelected ? "text-blue-600" : "text-slate-400")}>{number}</span>}
    </div>
  );
}

// Une hémi-arcade : huit dents d'un même côté.
function HemiArcade({
  dents,
  selectedTooth,
  onSelectTooth,
  toothStates,
  alignement,
}: {
  dents: number[];
  selectedTooth: number | null;
  onSelectTooth: (t: number) => void;
  toothStates: Record<number, "healthy" | "caries" | "filled" | "missing">;
  alignement: string;
}) {
  return (
    <div className={cn("flex gap-0.5 sm:gap-1.5", alignement)}>
      {dents.map((t) => (
        <ToothSvg
          key={t}
          number={t}
          isSelected={selectedTooth === t}
          state={toothStates[t] || "healthy"}
          onClick={() => onSelectTooth(t)}
        />
      ))}
    </div>
  );
}

export function Odontogram({ selectedTooth, onSelectTooth, toothStates = {} }: OdontogramProps) {
  // L'arcade était une seule ligne de seize dents en largeur fixe, dans un
  // cadre à défilement horizontal : sur téléphone la moitié sortait du champ
  // et seule une fine barre grise le signalait. On ne voyait jamais la bouche
  // entière — précisément sur l'écran qu'on tient à la main au fauteuil.
  //
  // Les hémi-arcades sont désormais des blocs autonomes : côte à côte quand
  // la place existe, l'une sous l'autre quand elle manque. Chaque quadrant
  // tient alors dans la largeur, sans défilement, et sans rétrécir les dents
  // au point qu'on ne puisse plus les viser au doigt.
  const commun = { selectedTooth, onSelectTooth, toothStates };

  return (
    <div className="flex flex-col items-center gap-6 py-6 w-full max-w-4xl mx-auto px-2">
      {/* Maxillaire */}
      <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-5">
        <HemiArcade dents={UPPER_TEETH.slice(0, 8)} alignement="items-end" {...commun} />
        <div className="hidden sm:block border-r-2 border-dashed border-slate-200 h-10 self-end" />
        <HemiArcade dents={UPPER_TEETH.slice(8)} alignement="items-end" {...commun} />
      </div>

      <div className="w-full h-px bg-slate-200" />

      {/* Mandibule */}
      <div className="flex flex-wrap items-start justify-center gap-x-3 gap-y-5">
        <HemiArcade dents={LOWER_TEETH.slice(0, 8)} alignement="items-start" {...commun} />
        <div className="hidden sm:block border-r-2 border-dashed border-slate-200 h-10 self-start" />
        <HemiArcade dents={LOWER_TEETH.slice(8)} alignement="items-start" {...commun} />
      </div>
    </div>
  );
}
