"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
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
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Questionnaire Médical</h3>
        <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-wider">Alerte Médicale</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {QUESTIONS.map((q) => (
          <motion.div
            key={q.id}
            whileHover={{ x: 5 }}
            onClick={() => toggle(q.id)}
            className={cn(
              "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2",
              answers[q.id] 
                ? "border-rose-200 bg-rose-50" 
                : "border-slate-50 bg-slate-50 hover:border-slate-100"
            )}
          >
            <span className={cn(
              "text-xs font-bold transition-colors",
              answers[q.id] ? "text-rose-900" : "text-slate-600"
            )}>
              {q.label}
            </span>
            <div className={cn(
              "h-6 w-6 rounded-lg flex items-center justify-center transition-all",
              answers[q.id] ? "bg-rose-600 text-white" : "bg-white border-2 border-slate-200"
            )}>
              {answers[q.id] && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="h-4 w-4" /></motion.div>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="pt-4 space-y-4">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Observations Particulières</label>
        <textarea 
          placeholder="Ex: Asthme, Épilepsie, Traitement spécifique..."
          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-rose-200 transition-all min-h-[100px]"
        />
      </div>

      <button className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
        Valider le Questionnaire
      </button>
    </div>
  );
}
