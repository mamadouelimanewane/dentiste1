"use client";

import React, { useState } from "react";
import { 
  Smile, 
  Sparkles, 
  UploadCloud, 
  History, 
  Download, 
  Image as ImageIcon, 
  Camera, 
  Wand2, 
  PaintBucket, 
  MoveUpRight, 
  Eye, 
  TrendingUp, 
  Search,
  Maximize2,
  CheckCircle2,
  Zap,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function SmileDesignStudio() {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationDone, setSimulationDone] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationDone(true);
    }, 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ELITE HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 bg-blue-900 text-amber-400 rounded flex items-center justify-center shadow-xl shadow-blue-900/10">
            <Smile className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter">Smile Design Studio Pro</h2>
            <div className="flex items-center gap-2 mt-1">
              <Sparkles className="h-3 w-3 text-amber-500 fill-current" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Esthetic Simulation Engine v2.0</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all">
            <History className="h-4 w-4" /> Historique
          </button>
          <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20">
            <Download className="h-4 w-4" /> Exporter Simulation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* MAIN VIEWER */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-sm shadow-2xl min-h-[500px] relative overflow-hidden flex flex-col">
            
            {simulationDone ? (
              <div className="relative flex-1 group">
                {/* BEFORE (UNDER) */}
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center overflow-hidden">
                   <div className="opacity-40 grayscale blur-sm">
                      <Smile className="h-48 w-48 text-slate-400" />
                   </div>
                   <p className="absolute top-6 left-6 bg-black/60 text-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-sm backdrop-blur-md border border-white/10">État Initial</p>
                </div>

                {/* AFTER (OVER) */}
                <div 
                  className="absolute inset-0 bg-blue-50/5 flex items-center justify-center overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                >
                   <div className="flex flex-col items-center">
                      <Smile className="h-48 w-48 text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]" />
                      <div className="mt-4 flex gap-1">
                         {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className="h-8 w-4 bg-white/90 rounded-sm border border-slate-200" />
                         ))}
                      </div>
                   </div>
                   <p className="absolute top-6 right-6 bg-amber-500 text-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-sm shadow-xl border border-amber-400">Rendu IA Elite</p>
                </div>

                {/* SLIDER HANDLE */}
                <div 
                   className="absolute top-0 bottom-0 w-1 bg-amber-500 cursor-ew-resize z-20 group"
                   style={{ left: `${sliderPos}%` }}
                >
                   <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={sliderPos}
                      onChange={(e) => setSliderPos(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                   />
                   <div className="absolute top-1/2 -left-3 -translate-y-1/2 h-6 w-6 bg-white border-2 border-amber-500 rounded-full flex items-center justify-center shadow-2xl">
                      <div className="flex gap-0.5">
                         <div className="w-0.5 h-3 bg-amber-500 rounded-full" />
                         <div className="w-0.5 h-3 bg-amber-500 rounded-full" />
                      </div>
                   </div>
                </div>

                {/* OVERLAY CONTROLS */}
                <div className="absolute bottom-6 inset-x-6 flex justify-between items-center z-10">
                   <div className="flex gap-2">
                      <button onClick={() => setSimulationDone(false)} className="p-2 bg-black/40 hover:bg-black/60 rounded-sm border border-white/10 text-white transition-all">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <button className="p-2 bg-black/40 hover:bg-black/60 rounded-sm border border-white/10 text-white transition-all">
                        <Maximize2 className="h-4 w-4" />
                      </button>
                   </div>
                   <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 px-3 py-1.5 rounded-sm flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Optimisé par DeepSmile AI</span>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8">
                <div className="relative group">
                   <div className="h-32 w-32 bg-slate-800 rounded-full flex items-center justify-center border-2 border-dashed border-slate-700 group-hover:border-amber-400 transition-all cursor-pointer">
                      <Camera className="h-12 w-12 text-slate-500 group-hover:text-amber-400" />
                   </div>
                   <motion.div 
                     animate={{ scale: [1, 1.2, 1] }}
                     transition={{ repeat: Infinity, duration: 2 }}
                     className="absolute -top-2 -right-2 h-8 w-8 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-900/20"
                   >
                     <Plus className="h-5 w-5" />
                   </motion.div>
                </div>
                
                <div className="max-w-xs space-y-2">
                   <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Capture de Portrait</h3>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed">
                     Importez un cliché haute résolution pour une analyse biométrique et esthétique.
                   </p>
                </div>

                <button 
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className="relative group overflow-hidden bg-white text-slate-900 px-8 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl hover:bg-amber-400 hover:text-white disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isSimulating ? <Sparkles className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    {isSimulating ? "Traitement Neural..." : "Lancer le Smile Studio"}
                  </span>
                  <AnimatePresence>
                    {isSimulating && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="absolute inset-0 bg-blue-600 z-0"
                        transition={{ duration: 2.5 }}
                      />
                    )}
                  </AnimatePresence>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ANALYSIS PANELS */}
        <div className="lg:col-span-2 space-y-4">
           <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                 <Zap className="h-4 w-4 text-amber-500" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paramètres IA</h4>
              </div>
              <div className="p-5 space-y-5">
                 {[
                   { label: "Teinte (Shade)", value: "Vita Master OM3", icon: PaintBucket, color: "text-amber-500", bg: "bg-amber-50" },
                   { label: "Architecture Gingivale", value: "Optimisation +1.2mm", icon: MoveUpRight, color: "text-emerald-500", bg: "bg-emerald-50" },
                   { label: "Forme des Dents", value: "Ovalaire Esthétique", icon: Smile, color: "text-blue-500", bg: "bg-blue-50" }
                 ].map((p, i) => (
                   <div key={i} className="flex items-center gap-4 group cursor-pointer">
                      <div className={cn("h-10 w-10 rounded flex items-center justify-center transition-all group-hover:scale-110", p.bg)}>
                         <p.icon className={cn("h-5 w-5", p.color)} />
                      </div>
                      <div className="flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{p.label}</p>
                         <p className="text-xs font-black text-slate-900 uppercase mt-0.5">{p.value}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-[#0F172A] text-white rounded-sm shadow-xl p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Impact Prévisionnel</h4>
                 </div>
                 <div className="flex items-end gap-2">
                    <span className="text-4xl font-black tracking-tighter text-white">+42%</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase pb-1.5">Score Confiance</span>
                 </div>
                 <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                    "L'alignement neural et la correction chromatique suggèrent une amélioration significative de la ligne de sourire."
                 </p>
                 <button className="w-full mt-2 py-3 bg-white text-slate-900 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl">
                    Valider le Design
                 </button>
              </div>
              <Sparkles className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5" />
           </div>
        </div>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
    </div>
    </div>
  );
}
