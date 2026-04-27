"use client";

import React from "react";
import { Zap, Activity, Users, Clock, BrainCircuit } from "lucide-react";

export function PractitionerHub() {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-[#0F172A] p-5 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-blue-400" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Hub Praticien</h3>
        </div>
        <div className="h-6 w-6 border border-slate-700 rounded flex items-center justify-center">
          <span className="text-[9px] font-bold text-emerald-400">ON</span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-50 p-3 rounded-sm border border-slate-100">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Patients</p>
             <p className="text-xl font-black text-blue-900 mt-0.5">12</p>
           </div>
           <div className="bg-slate-50 p-3 rounded-sm border border-slate-100">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Temps Moyen</p>
             <p className="text-xl font-black text-blue-900 mt-0.5">35<span className="text-[10px] text-slate-400 ml-1">min</span></p>
           </div>
        </div>
        
        {/* Real-time Flow */}
        <div className="space-y-3">
          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Flux Temps Réel</h4>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span className="font-bold text-slate-600">Salle d'attente</span>
              </div>
              <span className="font-black text-rose-600">4</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="font-bold text-slate-600">Au Fauteuil</span>
              </div>
              <span className="font-black text-blue-600">2</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-600">Admin / Sortie</span>
              </div>
              <span className="font-black text-emerald-600">5</span>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="pt-4 border-t border-slate-100">
           <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-sm border border-blue-100">
             <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
             <div className="space-y-1.5">
               <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight">AI Radio Insight</p>
               <p className="text-[10px] font-medium text-slate-600 leading-relaxed">
                 Patient #224 : Anomalie détectée sur la 36 (possible carie interproximale).
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
