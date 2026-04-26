"use client";

import React, { useState } from "react";
import { User, Calendar, Shield, MapPin, Phone, Save, CheckCircle2, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PatientRegistration() {
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-sm max-w-2xl mx-auto overflow-hidden">
      {/* Card Header - Business Card Style */}
      <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Fiche Identification</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Cabinet Dentaire Elite — Dossier Patient</p>
        </div>
        <div className="h-10 w-10 border border-slate-700 rounded flex items-center justify-center">
          <User className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {/* Nom & Prénom */}
          <div className="space-y-1 border-b border-slate-100 pb-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nom & Prénom</label>
            <input 
              type="text" 
              placeholder="Mamadou Diallo"
              className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none"
              required
            />
          </div>

          {/* Date de Naissance */}
          <div className="space-y-1 border-b border-slate-100 pb-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Né(e) le</label>
            <input 
              type="date" 
              className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0 outline-none"
              required
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-1 border-b border-slate-100 pb-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contact</label>
            <input 
              type="tel" 
              placeholder="+221 77 000 00 00"
              className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none"
            />
          </div>

          {/* N° Assuré / ID */}
          <div className="space-y-1 border-b border-slate-100 pb-2">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Référence ID</label>
            <input 
              type="text" 
              placeholder="SN-12345-X"
              className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none"
            />
          </div>
        </div>

        {/* Adresse */}
        <div className="mt-8 space-y-1 border-b border-slate-100 pb-2">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Adresse de Résidence</label>
          <input 
            type="text"
            placeholder="Dakar, Plateau, Rue 12..."
            className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none"
          />
        </div>

        <div className="mt-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Certifié Elite Pro</span>
          </div>
          <button 
            type="submit"
            className={cn(
              "h-9 px-6 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              isSaved 
                ? "bg-emerald-600 text-white" 
                : "bg-slate-900 text-white hover:bg-black"
            )}
          >
            {isSaved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {isSaved ? "Dossier Créé" : "Enregistrer la Fiche"}
          </button>
        </div>
      </form>
    </div>
  );
}


