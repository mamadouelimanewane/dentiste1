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

export function Odontogram({ selectedTooth, onSelectTooth, toothStates = {} }: OdontogramProps) {
  return (
    <div className="flex flex-col items-center gap-8 py-6 w-full max-w-4xl mx-auto overflow-x-auto">
      {/* Mâchoire supérieure */}
      <div className="flex items-end justify-center gap-1 sm:gap-2 min-w-max px-4">
        {UPPER_TEETH.map((t) => (
          <React.Fragment key={t}>
            <ToothSvg
              number={t}
              isSelected={selectedTooth === t}
              state={toothStates[t] || "healthy"}
              onClick={() => onSelectTooth(t)}
            />
            {t === 11 && <div className="w-4 border-r-2 border-dashed border-slate-200 h-10 mr-4" />}
          </React.Fragment>
        ))}
      </div>

      <div className="w-full h-px bg-slate-200" />

      {/* Mâchoire inférieure */}
      <div className="flex items-start justify-center gap-1 sm:gap-2 min-w-max px-4">
        {LOWER_TEETH.map((t) => (
          <React.Fragment key={t}>
            <ToothSvg
              number={t}
              isSelected={selectedTooth === t}
              state={toothStates[t] || "healthy"}
              onClick={() => onSelectTooth(t)}
            />
            {t === 41 && <div className="w-4 border-r-2 border-dashed border-slate-200 h-10 mr-4" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
