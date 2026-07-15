"use client";

import React, { useState } from "react";
import { 
  Layers, 
  Activity, 
  Search, 
  Filter, 
  Plus, 
  Box, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Printer, 
  Circle, 
  Settings2,
  Truck,
  CheckCircle2,
  Clock,
  FlaskConical,
  ExternalLink,
  ChevronRight,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function ProstheticsLab() {
  const [activeTab, setActiveTab] = useState<"Travaux" | "Laboratoires" | "CFAO">("Travaux");
  const [activeTeinte, setActiveTeinte] = useState("A2");

  const labJobs = [
    { 
      id: 1, 
      patient: "Mariama Sow", 
      act: "Couronne Zircone Prettau", 
      teinte: "A2", 
      lab: "DentiLab Pro 3D", 
      delivery: "13/05/2026", 
      status: "production",
      progress: 65,
      steps: ["Empreinte", "Scan STL", "Conception", "Usinage", "Finition"]
    },
    { 
      id: 2, 
      patient: "Ousmane Gueye", 
      act: "Bridge Céramo-Métal (3 éléments)", 
      teinte: "A3", 
      lab: "Laboratoire Elite Dakar", 
      delivery: "18/05/2026", 
      status: "shipped",
      progress: 85,
      steps: ["Empreinte", "Modèle", "Coulée", "Céramique", "Expédition"]
    },
    { 
      id: 3, 
      patient: "Aïcha Diallo", 
      act: "Inlay-Onlay Composite", 
      teinte: "B1", 
      lab: "Digital Smile Lab", 
      delivery: "11/05/2026", 
      status: "completed",
      progress: 100,
      steps: ["Scan", "Design", "Fraisage", "Polissage", "Livré"]
    }
  ];

  const teintes = ["A1", "A2", "A3", "A3.5", "B1", "B2", "C1", "D2"];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ELITE HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 bg-[#0F172A] text-sky-400 rounded flex items-center justify-center shadow-xl shadow-blue-900/10 border border-blue-800/20">
            <Layers className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter">Prosthetics & CFAO Center</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Flux Numériques Synchronisés</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            disabled
            title="Module de démonstration — pas encore connecté à un vrai laboratoire"
            className="flex items-center gap-2 bg-slate-300 text-white px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest cursor-not-allowed"
          >
            <Plus className="h-4 w-4" /> Nouvel Ordre Labo
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-sm">
        Module de démonstration — travaux, laboratoires et statuts affichés à titre d'exemple, pas encore reliés à un vrai laboratoire.
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Travaux en cours", value: "12", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Livraisons attendues", value: "4", icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Prêts à l'essayage", value: "3", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Fichiers CFAO", value: "28", icon: Monitor, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TABS & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-sm border border-slate-200 w-full md:w-auto">
          {["Travaux", "Laboratoires", "CFAO"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all",
                activeTab === tab ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-sm text-[10px] font-bold uppercase outline-none w-full md:w-64 focus:border-blue-400 transition-colors" 
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-sm text-slate-500 hover:text-blue-600 transition-colors shadow-sm">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN JOBS LIST */}
        <div className="lg:col-span-2 space-y-4">
          {labJobs.map((job) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={job.id} 
              className="bg-white border border-slate-200 rounded-sm shadow-sm hover:border-blue-300 transition-all group overflow-hidden"
            >
              <div className="p-5 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between md:justify-start gap-3">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{job.patient}</h4>
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                      job.status === "completed" ? "bg-emerald-100 text-emerald-700" : 
                      job.status === "shipped" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {job.status === "completed" ? "Terminé" : job.status === "shipped" ? "Expédié" : "En Production"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Prestation</p>
                      <p className="text-xs font-black text-slate-700">{job.act} • <span className="text-amber-600">{job.teinte}</span></p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Partenaire Labo</p>
                      <div className="flex items-center gap-1.5">
                        <FlaskConical className="h-3 w-3 text-blue-500" />
                        <p className="text-xs font-black text-slate-700">{job.lab}</p>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS STEPPER */}
                  <div className="pt-2">
                    <div className="flex justify-between mb-2">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Progression</p>
                      <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">{job.progress}%</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={cn(
                          "h-full rounded-full transition-all",
                          job.status === "completed" ? "bg-emerald-500" : "bg-blue-600"
                        )}
                      />
                    </div>
                    <div className="flex justify-between mt-2 overflow-x-auto no-scrollbar pb-1">
                       {job.steps.map((step, idx) => (
                         <div key={idx} className="flex flex-col items-center gap-1 min-w-[50px]">
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              (idx / (job.steps.length - 1)) * 100 <= job.progress ? "bg-blue-600" : "bg-slate-200"
                            )} />
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{step}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                  <div className="text-center md:text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Livraison prévue</p>
                    <p className="text-sm font-black text-slate-900">{job.delivery}</p>
                  </div>
                  <button className="w-full mt-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white rounded-sm text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    Détails <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* SIDE PANELS */}
        <div className="space-y-6">
          {/* CFAO STATUS */}
          <div className="bg-[#0F172A] rounded-sm shadow-xl p-5 text-white relative overflow-hidden group">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Database className="h-4 w-4 text-sky-400" /> Status Gateway CFAO
            </h4>
            
            <div className="space-y-5 relative z-10">
              {[
                { label: "Scanner Intraoral ITero", status: "Connecté", color: "text-emerald-400", icon: RefreshCw },
                { label: "Cloud Sync (DEXIS/STL)", status: "Synchronisé", color: "text-emerald-400", icon: ShieldCheck },
                { label: "Imprimante Formlabs", status: "Prête", color: "text-sky-400", icon: Printer },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", item.color)}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
            
            <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
               Ouvrir Visualiseur 3D <ExternalLink className="h-3 w-3" />
            </button>
            <Box className="absolute -right-6 -bottom-6 h-32 w-32 text-slate-800 opacity-20 group-hover:scale-110 transition-transform" />
          </div>

          {/* COLOR SELECTOR */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
               Sélecteur de Teintes (Vita)
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {teintes.map(teinte => (
                <button 
                  key={teinte}
                  onClick={() => setActiveTeinte(teinte)}
                  className={cn(
                    "h-11 rounded border text-[10px] font-black transition-all flex items-center justify-center",
                    activeTeinte === teinte 
                      ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm scale-105 z-10" 
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white"
                  )}
                >
                  {teinte}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest italic">Sélection actuelle : Teinte {activeTeinte}</p>
          </div>

          {/* LAB PARTNERS */}
          <div className="bg-slate-50 border border-slate-200 rounded-sm p-5">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Laboratoires Partenaires</h4>
             <div className="space-y-3">
                {["DentiLab Pro 3D", "Laboratoire Elite Dakar", "Digital Smile Lab"].map((lab, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-white rounded border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-700">{lab}</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                ))}
             </div>
             <button className="w-full mt-4 text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">
               Gérer les prestataires
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
