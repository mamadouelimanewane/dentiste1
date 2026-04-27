"use client";

import React, { useState } from "react";
import { Smile, Sparkles, UploadCloud, History, Download, Image as ImageIcon, Camera, Wand2, PaintBucket, MoveUpRight, Eye, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SmileDesignStudio() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationDone, setSimulationDone] = useState(false);

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationDone(true);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER BAR - DASHBOARD STYLE */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <Smile className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Smile Design Studio Pro</h2>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Esthetic Simulation Engine</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input type="text" placeholder="Rechercher un module, patient..." className="bg-transparent border-none text-[10px] font-bold uppercase outline-none w-48" />
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-900">22:37</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase">Dr. Diallo</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xs">
              DR
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0F172A] text-white p-6 rounded-sm flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h3 className="text-lg font-black uppercase tracking-widest text-amber-300">Simulation Esthétique par IA</h3>
          <p className="text-slate-300 text-xs font-medium">Montrez le futur sourire à vos patients avant même de commencer le traitement.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/20 to-transparent" />
        <Wand2 className="absolute -right-4 -top-4 h-32 w-32 text-amber-500 opacity-20" />
      </div>

      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-sm shadow-sm">
        <div className="flex gap-2">
          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded transition-colors">
            <History className="h-4 w-4" /> Historique
          </button>
        </div>
        <div>
           <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded transition-colors">
            <Download className="h-4 w-4" /> Exporter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* MAIN IMAGE UPLOAD / PREVIEW */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm min-h-[450px] p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            {simulationDone ? (
              <div className="absolute inset-0 flex">
                 <div className="w-1/2 h-full bg-slate-100 border-r border-slate-300 relative overflow-hidden flex items-center justify-center">
                    <p className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded backdrop-blur-sm">Avant</p>
                    <Smile className="h-24 w-24 text-slate-300 opacity-50" />
                 </div>
                 <div className="w-1/2 h-full bg-blue-50 relative overflow-hidden flex items-center justify-center">
                    <p className="absolute top-4 right-4 bg-amber-500 text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded shadow-lg shadow-amber-500/40">Après (IA)</p>
                    <Smile className="h-24 w-24 text-amber-400" />
                    {/* Simulation shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                 </div>
                 {/* Drag handle line */}
                 <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-amber-500 -ml-[0.5px] shadow-[0_0_10px_rgba(245,158,11,0.5)] cursor-ew-resize flex items-center justify-center">
                    <div className="h-8 w-6 bg-white border-2 border-amber-500 rounded-full flex items-center justify-center shadow-md">
                      <div className="h-4 w-0.5 bg-amber-500 rounded-full" />
                    </div>
                 </div>
              </div>
            ) : (
              <div className="text-center space-y-6 z-10">
                <div className="h-24 w-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform cursor-pointer">
                  <Camera className="h-10 w-10 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cliquez pour importer</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Portrait Patient</p>
                  <p className="text-xs text-slate-400 mt-3 max-w-sm mx-auto font-medium leading-relaxed">
                    Importez une photo de face. Notre IA analysera automatiquement les paramètres esthétiques.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4 pt-4">
                  <button 
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white px-6 py-3 rounded-sm text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
                  >
                    {isSimulating ? <Sparkles className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-amber-400" />}
                    {isSimulating ? "Analyse en cours..." : "Générer Simulation IA"}
                  </button>
                  <button className="text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-blue-600 transition-colors underline underline-offset-4">
                    Essayer avec une démo
                  </button>
                </div>
              </div>
            )}
            {!simulationDone && <ImageIcon className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-50 rotate-12" />}
          </div>
        </div>

        {/* ANALYSIS PANELS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-3 relative overflow-hidden group">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 bg-amber-50 rounded flex items-center justify-center">
                 <PaintBucket className="h-4 w-4 text-amber-500" />
               </div>
               <div>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analyse de Teinte</h4>
                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Suggéré : Vita 3D Master OM3</p>
               </div>
            </div>
            <p className="text-xs text-slate-600 font-medium italic">
              L'IA préconise cette teinte pour un rendu naturel sur la carnation détectée.
            </p>
            <div className="absolute right-0 top-0 h-full w-2 bg-amber-400" />
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 bg-emerald-50 rounded flex items-center justify-center">
                 <MoveUpRight className="h-4 w-4 text-emerald-500" />
               </div>
               <div>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Symétrie Gingivale</h4>
                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Optimisée (+1.2mm)</p>
               </div>
            </div>
            <p className="text-xs text-slate-600 font-medium italic">
              Correction de la ligne de sourire pour aligner les collets.
            </p>
            <div className="absolute right-0 top-0 h-full w-2 bg-emerald-400" />
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
               <div className="h-8 w-8 bg-blue-50 rounded flex items-center justify-center">
                 <Eye className="h-4 w-4 text-blue-500" />
               </div>
               <div>
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rendu Visuel 3D</h4>
                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Photoréalisme : 98.4%</p>
               </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1 mb-2">
              <div className="h-full bg-blue-500 w-[98.4%]" />
            </div>
            <p className="text-xs text-slate-600 font-medium italic">
              L'éclairage a été harmonisé pour correspondre aux sources de lumière réelles.
            </p>
            <div className="absolute right-0 top-0 h-full w-2 bg-blue-500" />
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL - PLAN DE SOIN OPTIQUE */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-100">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Plan de Soin Optique</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="p-6 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Teinte sélectionnée</p>
            <p className="text-sm font-black text-slate-900 uppercase">OM3 (Blanchiment)</p>
          </div>
          <div className="p-6 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nb de Facettes</p>
            <p className="text-sm font-black text-slate-900 uppercase">8 Unités (14 à 24)</p>
          </div>
          <div className="p-6 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Forme des dents</p>
            <p className="text-sm font-black text-slate-900 uppercase">Ovalaire / Soft Esthetic</p>
          </div>
          <div className="p-6 bg-amber-50/50 flex flex-col justify-center items-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Impact prévisionnel du sourire</p>
            </div>
            <div className="flex items-end gap-1">
               <span className="text-3xl font-black text-emerald-600">+42%</span>
            </div>
            <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest mt-1">Confiance en soi estimée (AI Score)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
