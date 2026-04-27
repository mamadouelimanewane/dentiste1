"use client";

import React, { useState } from "react";
import { Brain, Activity, UploadCloud, ShieldCheck, Search, Image as ImageIcon, FileText, ChevronRight, Scan } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiRadioLab() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [language, setLanguage] = useState<"FR" | "WO">("FR");

  const scans = [
    { id: 1, type: "PANO", title: "Panoramique Patient Jean V.", date: "24 Jan 2026", status: "analysed" },
    { id: 2, type: "CBCT", title: "CBCT 3D - Secteur 4", date: "20 Jan 2026", status: "pending" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER BAR - DASHBOARD STYLE */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-900 text-white rounded flex items-center justify-center shadow-lg shadow-slate-900/20">
            <Brain className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">AI Radio Lab</h2>
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Advanced Neural Imaging</p>
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
              <p className="text-[10px] font-black text-slate-900">22:27</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase">Dr. Diallo</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xs">
              DR
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1E3A8A] text-white p-6 rounded-sm flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h3 className="text-lg font-black uppercase tracking-widest">Diagnostic Assisté</h3>
          <p className="text-blue-200 text-xs font-medium">Diagnostic assisté par ordinateur et détection automatique de pathologies.</p>
        </div>
        <Scan className="absolute -right-4 -top-4 h-32 w-32 text-blue-800 opacity-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR - ANALYSIS LOG & IMPORTS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Journal d'Analyse</h4>
              <button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1">
                <Brain className="h-3 w-3" /> Charger Core V2.4
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {scans.map((scan) => (
                <button 
                  key={scan.id}
                  onClick={() => setSelectedImage(scan.id.toString())}
                  className={cn(
                    "w-full text-left p-3 rounded-sm border transition-all flex items-start gap-3 group",
                    selectedImage === scan.id.toString() 
                      ? "bg-blue-50 border-blue-200 shadow-sm" 
                      : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded flex items-center justify-center flex-shrink-0 font-black text-[9px]",
                    scan.type === "PANO" ? "bg-indigo-100 text-indigo-700" : "bg-cyan-100 text-cyan-700"
                  )}>
                    {scan.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{scan.title}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{scan.date}</p>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity", selectedImage === scan.id.toString() ? "opacity-100 text-blue-600" : "text-slate-300")} />
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all shadow-md">
                <UploadCloud className="h-4 w-4 text-slate-300" />
                Importer DICOM
              </button>
            </div>
          </div>
        </div>

        {/* MAIN VIEWER & INTELLIGENCE REPORT */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-sm shadow-sm overflow-hidden flex items-center justify-center relative min-h-[400px]">
            {selectedImage ? (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Mock Image Representation */}
                <div className="w-full h-full bg-slate-800 animate-pulse opacity-20" />
                <Scan className="absolute h-32 w-32 text-emerald-500/30 animate-pulse" />
                
                {/* Simulated Bounding Boxes / Findings */}
                {selectedImage === "1" && (
                  <>
                    <div className="absolute top-1/3 left-1/4 w-12 h-12 border-2 border-amber-500 rounded-sm shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                      <span className="absolute -top-5 -right-2 bg-amber-500 text-white text-[8px] font-black px-1 py-0.5 rounded uppercase">Carie 46</span>
                    </div>
                    <div className="absolute bottom-1/4 right-1/3 w-16 h-10 border-2 border-rose-500 rounded-sm shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                      <span className="absolute -top-5 -right-2 bg-rose-500 text-white text-[8px] font-black px-1 py-0.5 rounded uppercase">Lésion Apicale</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Veuillez sélectionner un examen<br/>pour lancer l'analyse IA
                </p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col min-h-[180px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Rapport d'Intelligence</h4>
              </div>
              <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-sm">
                <button 
                  onClick={() => setLanguage("FR")}
                  className={cn("px-2 py-0.5 text-[9px] font-black uppercase rounded-sm transition-all", language === "FR" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-700")}
                >
                  FR
                </button>
                <button 
                  onClick={() => setLanguage("WO")}
                  className={cn("px-2 py-0.5 text-[9px] font-black uppercase rounded-sm transition-all", language === "WO" ? "bg-amber-500 text-white" : "text-slate-400 hover:text-slate-700")}
                >
                  WO (Wolof)
                </button>
              </div>
            </div>
            <div className="p-6 flex-1 flex items-center justify-center bg-slate-50/50">
              {selectedImage ? (
                <div className="w-full space-y-3">
                  {language === "FR" ? (
                     <>
                      <p className="text-sm text-slate-800 font-medium"><strong className="text-rose-600">Alerte IA:</strong> Lésion péri-apicale suspectée sur la dent 36.</p>
                      <p className="text-sm text-slate-800 font-medium"><strong className="text-amber-500">Observation:</strong> Carie occlusale profonde sur la 46. Proximité pulpaire confirmée.</p>
                     </>
                  ) : (
                     <>
                      <p className="text-sm text-slate-800 font-medium"><strong className="text-rose-600">Xam-xam IA:</strong> Gaanaay gu nekk ci suufu bëñ bi 36.</p>
                      <p className="text-sm text-slate-800 font-medium"><strong className="text-amber-500">Setlu:</strong> Bëñ bu yàqu ci kaw 46 bi. Daafa jege lool xolub bëñ bi.</p>
                     </>
                  )}
                </div>
              ) : (
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">
                  En attente de données
                </p>
              )}
            </div>
            
            <div className="bg-emerald-50 border-t border-emerald-100 p-3 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-[0.2em]">HDS Compliance Shield</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
