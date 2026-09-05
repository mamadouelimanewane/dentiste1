"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Scan,
  Image as ImageIcon,
  Maximize2,
  X,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Contrast,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePatient } from "@/lib/context";

interface ImageRecord {
  id: string;
  blob_url: string;
  type: string;
  notes: string | null;
  created_at: string;
}

const FILTRES = ["Toutes", "Panoramique", "Intra-orale", "Céphalométrique", "Esthétique"];

// Visionneuse de clichés. Ce module affichait auparavant de faux résultats
// d'analyse ("DENT 46 - CARIE (98%)", scores de fiabilité, recommandations
// diagnostiques) alors qu'aucun traitement d'image n'était effectué : les
// superpositions étaient codées en dur et s'affichaient quel que soit le
// cliché. Aucune aide au diagnostic n'est proposée ici — uniquement la
// consultation des radiographies réellement importées pour le patient.
export function AiRadioLab() {
  const { currentPatient } = usePatient();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtre, setFiltre] = useState("Toutes");
  const [selected, setSelected] = useState<ImageRecord | null>(null);
  const [zoom, setZoom] = useState(1);
  // Distingue « ce patient n'a pas de cliché » de « je n'ai pas pu les lire ».
  const [erreur, setErreur] = useState<string | null>(null);
  const [contraste, setContraste] = useState(100);

  const load = useCallback((patientId: string) => {
    setLoading(true);
    setErreur(null);
    fetch(`/api/patient-images?patientId=${patientId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Clichés non chargés.");
        return r.json();
      })
      .then((d) => setImages(d.images || []))
      // Vider la liste sur erreur revenait à afficher « aucun cliché » pour un
      // patient qui en a : le praticien pouvait conclure qu'aucune imagerie
      // n'existe et demander un nouveau cliché — donc une irradiation inutile.
      .catch(() =>
        setErreur("Les clichés n'ont pas pu être chargés. Rechargez avant de conclure qu'il n'y en a pas.")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (currentPatient) load(currentPatient.id);
    else setImages([]);
  }, [currentPatient, load]);

  const resetVue = () => {
    setZoom(1);
    setContraste(100);
  };

  if (!currentPatient) {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <Scan className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Visionneuse de Clichés</h2>
        <p className="text-sm text-slate-500 mt-2">Sélectionnez un patient pour consulter ses radiographies.</p>
      </div>
    );
  }

  const affichees = filtre === "Toutes" ? images : images.filter((i) => i.type === filtre);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 bg-slate-900 text-sky-400 rounded flex items-center justify-center shadow-xl border border-slate-800">
            <Scan className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter">Visionneuse de Clichés</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
              {currentPatient.name} · {images.length} cliché(s)
            </p>
          </div>
        </div>
      </div>

      {/* AVERTISSEMENT HONNETE */}
      <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Aucune analyse automatisée n&apos;est réalisée.</strong> Ce module sert uniquement à
          consulter les clichés importés dans le dossier du patient (module Imagerie). L&apos;interprétation
          radiologique et le diagnostic relèvent exclusivement du praticien.
        </p>
      </div>

      {/* FILTRES */}
      <div className="flex gap-2 p-2 bg-slate-100/50 rounded-lg overflow-x-auto no-scrollbar">
        {FILTRES.map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={cn(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
              filtre === f ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* GALERIE */}
      {erreur && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-bold text-rose-800">
          {erreur}
        </div>
      )}
      {loading && <p className="text-xs text-slate-400 text-center py-10">Chargement des clichés...</p>}
      {!loading && !erreur && affichees.length === 0 && (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center">
          <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Aucun cliché pour ce patient</p>
          <p className="text-xs text-slate-400 mt-1">
            Importez une radiographie depuis le module Imagerie pour la consulter ici.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {affichees.map((img) => (
          <div
            key={img.id}
            onClick={() => { setSelected(img); resetVue(); }}
            className="group bg-slate-900 rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-300 transition-all cursor-pointer"
          >
            <div className="relative h-56 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.blob_url} alt={img.notes || img.type} className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs font-bold flex items-center gap-1">
                  <Maximize2 className="h-4 w-4" /> Agrandir
                </span>
              </div>
              <div className="absolute top-3 left-3 bg-white/90 text-slate-900 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">
                {img.type}
              </div>
            </div>
            <div className="p-4 bg-white">
              <p className="text-sm font-bold text-slate-800 line-clamp-1">{img.notes || "Sans légende"}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                {new Date(img.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* VISIONNEUSE PLEIN ECRAN */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 text-white gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{selected.notes || "Sans légende"}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                  {selected.type} · {new Date(selected.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} title="Dézoomer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><ZoomOut className="h-5 w-5" /></button>
                <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} title="Zoomer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><ZoomIn className="h-5 w-5" /></button>
                <button onClick={() => setContraste((c) => (c >= 200 ? 60 : c + 35))} title="Contraste"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><Contrast className="h-5 w-5" /></button>
                <button onClick={resetVue} title="Réinitialiser"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><RotateCcw className="h-5 w-5" /></button>
                <button onClick={() => setSelected(null)} title="Fermer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.blob_url}
                alt={selected.notes || selected.type}
                style={{ transform: `scale(${zoom})`, filter: `contrast(${contraste}%)` }}
                className="max-w-full max-h-full object-contain transition-transform duration-150"
              />
            </div>
            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest pb-4">
              Zoom {Math.round(zoom * 100)}% · Contraste {contraste}% — outils d&apos;affichage uniquement
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
