"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Activity, ShieldCheck, Clock } from "lucide-react";
import { DENTAL_NOMENCLATURE } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function ProcedureExecution() {
  const [executedProcedures, setExecutedProcedures] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("dentiste_lite_executed");
    if (saved) setExecutedProcedures(JSON.parse(saved));
  }, []);

  const toggleProcedure = (id: string) => {
    const next = executedProcedures.includes(id)
      ? executedProcedures.filter(pId => pId !== id)
      : [...executedProcedures, id];
    setExecutedProcedures(next);
    localStorage.setItem("dentiste_lite_executed", JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Réalisation des Actes</h3>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase">Séance en cours</span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {DENTAL_NOMENCLATURE.map((p) => {
              const isDone = executedProcedures.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProcedure(p.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-sm border transition-all text-left",
                    isDone 
                      ? "bg-emerald-50 border-emerald-200" 
                      : "bg-slate-50 border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center border",
                      isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300"
                    )}>
                      {isDone ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3 text-slate-200" />}
                    </div>
                    <div>
                      <p className={cn("text-sm font-black uppercase tracking-tight", isDone ? "text-emerald-900" : "text-blue-900")}>
                        {p.label}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{p.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn("text-xs font-bold", isDone ? "text-emerald-600" : "text-slate-500")}>
                        {p.price?.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Temps estimé: 45 min</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocoles validés</span>
          </div>
        </div>
      </div>
    </div>
  );
}
