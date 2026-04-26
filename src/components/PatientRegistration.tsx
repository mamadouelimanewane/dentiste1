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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Fiche d'Enregistrement</h3>
          <p className="text-slate-500 text-[10px] font-medium">Informations administratives du patient.</p>
        </div>
        <User className="h-5 w-5 text-slate-400" />
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nom & Prénom */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Nom Complet</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Ex: Mamadou Diallo"
                className="w-full bg-white border border-slate-200 rounded-md py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Date de Naissance */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Date de Naissance</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="date" 
                className="w-full bg-white border border-slate-200 rounded-md py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                required
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="tel" 
                placeholder="+221 ..."
                className="w-full bg-white border border-slate-200 rounded-md py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* N° Assuré / ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Référence Dossier</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="ID-8829-X"
                className="w-full bg-white border border-slate-200 rounded-md py-2.5 pl-9 pr-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Adresse */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Adresse</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            <textarea 
              placeholder="Quartier, Ville..."
              className="w-full bg-white border border-slate-200 rounded-md p-2.5 pl-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit"
            className={cn(
              "h-10 px-8 rounded font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2",
              isSaved 
                ? "bg-emerald-600 text-white" 
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            {isSaved ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Enregistré
              </motion.div>
            ) : (
              <>
                <Save className="h-4 w-4" /> Valider l'Enregistrement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

