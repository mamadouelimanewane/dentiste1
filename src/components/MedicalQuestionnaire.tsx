"use client";

import React, { useState } from "react";
import { Check, AlertCircle, QrCode, Smartphone, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const QUESTIONS = [
  { id: "heart", label: "Problèmes cardiaques" },
  { id: "bp", label: "Hypertension artérielle" },
  { id: "diabetes", label: "Diabète" },
  { id: "allergy", label: "Allergies (Anesthésie, Antibiotiques...)" },
  { id: "blood", label: "Problèmes de coagulation" },
  { id: "pregnancy", label: "Grossesse en cours" },
  { id: "meds", label: "Traitement médical en cours" },
];

export function MedicalQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Enregistrement Rapide</h3>
          </div>
          <h4 className="text-xl font-black tracking-tight">Check-in via QR Code</h4>
          <p className="text-xs text-slate-400 max-w-sm">Scannez pour synchroniser vos antécédents médicaux depuis votre application mobile.</p>
        </div>
        <div className="bg-white p-3 rounded shadow-xl flex flex-col items-center gap-2">
          <QrCode className="h-20 w-20 text-slate-900" />
          <span className="text-[8px] font-black uppercase text-slate-400">Scan Me - Sync Pro</span>
        </div>
      </div>

      <div className="p-5 border-b border-slate-100 bg-rose-50/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Antécédents Médicaux</h3>
        </div>
        <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded uppercase">Points de vigilance</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {QUESTIONS.map((q) => (
            <div
              key={q.id}
              onClick={() => toggle(q.id)}
              className={cn(
                "flex items-center justify-between p-3 rounded border transition-all cursor-pointer select-none",
                answers[q.id] 
                  ? "border-rose-200 bg-rose-50/50" 
                  : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
              )}
            >
              <span className={cn(
                "text-xs font-black uppercase tracking-tight",
                answers[q.id] ? "text-rose-900" : "text-blue-900"
              )}>
                {q.label}
              </span>
              <div className={cn(
                "h-5 w-5 rounded flex items-center justify-center border transition-all",
                answers[q.id] ? "bg-rose-600 border-rose-600 text-white" : "bg-white border-slate-200"
              )}>
                {answers[q.id] && <Check className="h-3.5 w-3.5" />}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-b-2 border-blue-100 pb-3 mt-8">
          <label className="text-sm font-black text-blue-900 uppercase tracking-tight ml-1">Observations Supplémentaires</label>
          <textarea 
            placeholder="Détaillez ici toute autre pathologie ou traitement..."
            className="w-full bg-transparent border-none rounded-none p-2 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 outline-none min-h-[80px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}

