"use client";

import React, { useState } from "react";
import { 
  Brain, 
  Activity, 
  UploadCloud, 
  ShieldCheck, 
  Search, 
  Image as ImageIcon, 
  FileText, 
  ChevronRight, 
  Scan,
  Zap,
  Eye,
  EyeOff,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function AiRadioLab() {
  const [selectedImage, setSelectedImage] = useState<string | null>("1");
  const [language, setLanguage] = useState<"FR" | "WO">("FR");
  const [showOverlays, setShowOverlays] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "caries" | "perio" | "bone">("all");

  const scans = [
    { id: 1, type: "PANO", title: "Panoramique Patient Jean V.", date: "24 Jan 2026", status: "analysed", reliability: 98 },
    { id: 2, type: "CBCT", title: "CBCT 3D - Secteur 4", date: "20 Jan 2026", status: "analysed", reliability: 94 },
    { id: 3, type: "RX", title: "Rétro-alvéolaire 36-37", date: "15 Jan 2026", status: "analysed", reliability: 99 }
  ];

  const findings = [
    { id: "f1", type: "caries", tooth: "46", severity: "high", desc: "Carie occlusale profonde avec suspicion d'atteinte pulpaire.", status: "confirmed" },
    { id: "f2", type: "perio", tooth: "36", severity: "medium", desc: "Lésion péri-apicale suspectée (ostéite).", status: "pending" },
    { id: "f3", type: "bone", tooth: "Secteur 2", severity: "low", desc: "Légère résorption osseuse horizontale.", status: "dismissed" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ELITE HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 bg-slate-900 text-emerald-400 rounded flex items-center justify-center shadow-xl shadow-slate-900/10 border border-slate-800">
            <Brain className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter">Advanced Neural Imaging</h2>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="h-3 w-3 text-emerald-500 fill-current" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Diagnostic Assisté par IA Core v4.2</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all">
            <Download className="h-4 w-4" /> Exporter DICOM
          </button>
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/20">
            <UploadCloud className="h-4 w-4 text-emerald-400" /> Nouvel Examen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR - HISTORY */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Historique Radio</h4>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="p-2 space-y-1">
                 {scans.map((scan) => (
                   <button 
                    key={scan.id}
                    onClick={() => setSelectedImage(scan.id.toString())}
                    className={cn(
                      "w-full text-left p-3 rounded-sm border transition-all flex items-center gap-3 group relative overflow-hidden",
                      selectedImage === scan.id.toString() 
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20" 
                        : "bg-white border-transparent hover:bg-slate-50 text-slate-600"
                    )}
                   >
                     <div className={cn(
                       "h-9 w-9 rounded flex items-center justify-center font-black text-[9px] border transition-colors",
                       selectedImage === scan.id.toString() ? "bg-slate-800 border-slate-700 text-emerald-400" : "bg-slate-100 border-slate-200 text-slate-500"
                     )}>
                       {scan.type}
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black uppercase truncate tracking-tight">{scan.title}</p>
                       <p className={cn("text-[9px] font-bold mt-0.5", selectedImage === scan.id.toString() ? "text-slate-400" : "text-slate-400")}>{scan.date}</p>
                     </div>
                     {selectedImage === scan.id.toString() && (
                       <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" />
                     )}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* MAIN VIEWER */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-sm shadow-2xl overflow-hidden relative min-h-[500px] flex items-center justify-center group">
            {/* TOOLBAR OVERLAY */}
            <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20">
               <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-sm border border-white/10">
                  <button 
                    onClick={() => setShowOverlays(!showOverlays)}
                    className={cn("p-2 rounded-sm transition-all", showOverlays ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-white")}
                  >
                    {showOverlays ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  {["all", "caries", "perio", "bone"].map((f) => (
                    <button 
                      key={f}
                      onClick={() => setActiveFilter(f as any)}
                      className={cn(
                        "px-3 py-1.5 text-[9px] font-black uppercase rounded-sm transition-all",
                        activeFilter === f ? "bg-white/20 text-white" : "text-slate-500 hover:text-white"
                      )}
                    >
                      {f === "all" ? "Neural All" : f}
                    </button>
                  ))}
               </div>
               <button className="p-2 bg-black/60 backdrop-blur-md rounded-sm border border-white/10 text-slate-400 hover:text-white transition-all">
                  <Maximize2 className="h-4 w-4" />
               </button>
            </div>

            {/* VIEWER CONTENT */}
            <div className="relative w-full h-full flex items-center justify-center p-12">
               <div className="w-full h-80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-sm border border-white/5 relative overflow-hidden flex items-center justify-center">
                  <Scan className="h-48 w-48 text-emerald-500/10 animate-pulse" />
                  
                  <AnimatePresence>
                    {showOverlays && selectedImage === "1" && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute top-[30%] left-[25%] w-16 h-16 border-2 border-emerald-500 bg-emerald-500/10 rounded-sm"
                        >
                           <div className="absolute -top-6 left-0 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-lg shadow-emerald-900/50">
                              <Zap className="h-2 w-2 fill-current" /> DENT 46 - CARIE (98%)
                           </div>
                        </motion.div>
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="absolute bottom-[20%] right-[30%] w-20 h-12 border-2 border-amber-500 bg-amber-500/10 rounded-sm"
                        >
                           <div className="absolute -top-6 left-0 bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-lg shadow-amber-900/50">
                              <AlertCircle className="h-2 w-2" /> DENT 36 - LÉSION (85%)
                           </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
               </div>
            </div>

            {/* STATUS BAR */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-sm">
               <div className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-emerald-500" /> GPU Acceleré</div>
               <div className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-blue-500" /> DICOM v3.0 Confirme</div>
            </div>
          </div>

          {/* REPORT SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* FINDINGS TABLE */}
             <div className="md:col-span-2 bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rapport d'Intelligence</h4>
                   </div>
                   <div className="flex bg-white border border-slate-200 p-0.5 rounded-sm">
                      <button 
                        onClick={() => setLanguage("FR")}
                        className={cn("px-2 py-1 text-[8px] font-black uppercase rounded-sm transition-all", language === "FR" ? "bg-slate-900 text-white" : "text-slate-400")}
                      >
                        Français
                      </button>
                      <button 
                        onClick={() => setLanguage("WO")}
                        className={cn("px-2 py-1 text-[8px] font-black uppercase rounded-sm transition-all", language === "WO" ? "bg-blue-600 text-white" : "text-slate-400")}
                      >
                        Wolof
                      </button>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-100">
                         <tr className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                            <th className="p-3">Localisation</th>
                            <th className="p-3">Observation Neural</th>
                            <th className="p-3">Sévérité</th>
                            <th className="p-3 text-right">Action Praticien</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {findings.map((f, i) => (
                           <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-black text-slate-900 text-[10px]">DENT {f.tooth}</td>
                              <td className="p-3">
                                 <p className="text-[10px] font-bold text-slate-600">
                                   {language === "FR" ? f.desc : "Gaanaay gu nekk ci bëñ bi."}
                                 </p>
                              </td>
                              <td className="p-3">
                                 <span className={cn(
                                   "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm tracking-tighter",
                                   f.severity === "high" ? "bg-rose-100 text-rose-700" : 
                                   f.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                 )}>
                                   {f.severity}
                                 </span>
                              </td>
                              <td className="p-3 text-right">
                                 <div className="flex justify-end gap-1">
                                    <button className="p-1.5 rounded-sm bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                       <CheckCircle2 className="h-3 w-3" />
                                    </button>
                                    <button className="p-1.5 rounded-sm bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                       <Activity className="h-3 w-3" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* DIAGNOSTIC SUMMARY */}
             <div className="bg-[#0F172A] text-white rounded-sm shadow-xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10 space-y-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Conclusion Automatique</h4>
                   <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
                     "L'analyse neurale indique un besoin prioritaire d'intervention sur le secteur 4. Suspicion de pathologie apicale sur 36 nécessitant une confirmation clinique."
                   </p>
                   <div className="pt-4 border-t border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confiance IA</span>
                         <span className="text-[10px] font-black text-emerald-400">97.8%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 w-[97%]" />
                      </div>
                   </div>
                </div>
                <button className="w-full mt-6 py-3 bg-white text-slate-900 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-400/10">
                   Valider le Plan
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
