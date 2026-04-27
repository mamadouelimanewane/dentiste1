"use client";

import React, { useState } from "react";
import { Layers, Activity, Search, Filter, Plus, Box, Database, ShieldCheck, RefreshCw, Printer, Circle, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProstheticsLab() {
  const [activeTab, setActiveTab] = useState<"En Cours" | "Matériaux" | "Stocks">("En Cours");
  const [activeTeinte, setActiveTeinte] = useState("A2");

  const labJobs = [
    { id: 1, patient: "Mariama Sow", act: "Couronne Zircone", teinte: "A2", material: "Zircone Multicouche High-Trans", lab: "DentiLab Pro 3D", delivery: "13/03/2026", status: "production" },
    { id: 2, patient: "Ousmane Gueye", act: "COURONNE_ZIRCONE", teinte: "A2", material: "Zircone", lab: "Laboratoire Elite ProDakar", delivery: "Non définie", status: "pending" },
    { id: 3, patient: "Ousmane Gueye", act: "COURONNE_ZIRCONE", teinte: "A2", material: "Zircone", lab: "Laboratoire Elite ProDakar", delivery: "Non définie", status: "pending" },
    { id: 4, patient: "Ousmane Gueye", act: "COURONNE_ZIRCONE", teinte: "A2", material: "Zircone", lab: "Laboratoire Elite ProDakar", delivery: "Non définie", status: "pending" }
  ];

  const teintes = ["A1", "A2", "A3", "A3.5"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER BAR - DASHBOARD STYLE */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <Layers className="h-6 w-6 text-sky-300" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Prosthetics Lab Center</h2>
            <div className="flex items-center gap-2">
              <Printer className="h-3 w-3 text-sky-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Liaison Labo & CFAO Digitale</p>
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
              <p className="text-[10px] font-black text-slate-900">22:47</p>
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
          <h3 className="text-lg font-black uppercase tracking-widest text-sky-300">Gestion des flux numériques</h3>
          <p className="text-slate-300 text-xs font-medium">Gestion des flux numériques (STL), suivi des travaux et catalogue de matériaux.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/20 to-transparent" />
        <Box className="absolute -right-4 -top-4 h-32 w-32 text-sky-500 opacity-20" />
      </div>

      {/* TOOLBAR */}
      <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-sm shadow-sm flex-wrap gap-4">
        <div className="flex gap-2 bg-slate-50 p-1 rounded-sm border border-slate-100">
          {["En Cours", "Matériaux", "Stocks"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                activeTab === tab ? "bg-white text-blue-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div>
           <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-sm transition-colors shadow-md shadow-blue-900/20">
            <Plus className="h-4 w-4" /> Nouveau Travail
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* MAIN LIST */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-sm w-64 shadow-sm">
               <Search className="h-4 w-4 text-slate-400" />
               <input type="text" placeholder="Rechercher patient ou labo..." className="bg-transparent border-none text-[10px] font-bold outline-none w-full uppercase" />
             </div>
             <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-sm text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 shadow-sm">
               <Filter className="h-3.5 w-3.5" /> Trier par Date
             </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {labJobs.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 hover:border-blue-300 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between md:justify-start gap-4">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{job.patient}</h4>
                    <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase tracking-widest">
                      {job.act} • {job.teinte}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5"><Box className="h-3.5 w-3.5 text-slate-400" /> {job.material}</span>
                    <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-slate-400" /> Lab: {job.lab}</span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[150px]">
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Livraison Prévue</p>
                   <p className={cn(
                     "text-sm font-black",
                     job.delivery === "Non définie" ? "text-amber-500 italic" : "text-emerald-600"
                   )}>
                     {job.delivery}
                   </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-sm shadow-sm p-5 text-white relative overflow-hidden">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Status Gateway CFAO
            </h4>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-sky-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Cloud Sync STL</span>
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-current" /> Online
                </span>
              </div>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Liaison Labo Pro</span>
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                  Encrypted
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">File d'attente</span>
                </div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  3 fichiers
                </span>
              </div>
            </div>
            <Printer className="absolute -bottom-6 -right-6 h-32 w-32 text-slate-800 opacity-50" />
          </div>

          <button className="w-full bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-sm shadow-sm p-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all">
            <RefreshCw className="h-4 w-4" /> Synchroniser Scanner ITero
          </button>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
               Sélecteur de Teintes Smart
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {teintes.map(teinte => (
                <button 
                  key={teinte}
                  onClick={() => setActiveTeinte(teinte)}
                  className={cn(
                    "h-10 rounded border text-[10px] font-black transition-all flex items-center justify-center",
                    activeTeinte === teinte 
                      ? "bg-amber-100 border-amber-300 text-amber-800 shadow-sm" 
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white"
                  )}
                >
                  {teinte}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
