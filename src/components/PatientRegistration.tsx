"use client";

import React, { useState } from "react";
import { User, Calendar, Shield, MapPin, Phone, Save, CheckCircle2 } from "lucide-react";
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
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/20 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Enregistrement Patient</h3>
          <p className="text-slate-500 text-xs font-medium">Saisissez les informations de base pour la création du dossier.</p>
        </div>
        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
          <User className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nom & Prénom */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nom & Prénom</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Ex: Mamadou Diallo"
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                required
              />
            </div>
          </div>

          {/* Date de Naissance */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date de Naissance</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="date" 
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                required
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="tel" 
                placeholder="+221 ..."
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* N° Assuré / ID */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">N° Dossier / Assuré</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="ID-8829-X"
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Adresse Résidentielle</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-300" />
            <textarea 
              placeholder="Quartier, Ville, Code Postal..."
              className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all min-h-[100px] resize-none"
            />
          </div>
        </div>

        <button 
          type="submit"
          className={cn(
            "w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl",
            isSaved 
              ? "bg-emerald-500 text-white shadow-emerald-500/20" 
              : "bg-slate-900 text-white hover:bg-black shadow-slate-900/20"
          )}
        >
          {isSaved ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Enregistré avec succès
            </motion.div>
          ) : (
            <>
              <Save className="h-5 w-5" /> Créer le Dossier Patient
            </>
          )}
        </button>
      </form>
    </div>
  );
}
