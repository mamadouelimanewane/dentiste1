"use client";

import React from "react";
import { UserPlus, RotateCcw, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function NewDossier() {
  const handleReset = () => {
    localStorage.removeItem("dentiste_lite_step");
    localStorage.removeItem("dentiste_lite_notes");
    localStorage.removeItem("dentiste_lite_executed");
    localStorage.removeItem("dentiste_lite_patient");
    window.location.reload();
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500 py-12">
      <div className="bg-white border border-slate-200 rounded-sm shadow-xl p-10 text-center space-y-6">
        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto border-2 border-blue-100">
           <RotateCcw className="h-10 w-10 text-blue-600" />
        </div>
        
        <div className="space-y-2">
           <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Nouveau Cycle</h3>
           </div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight">Initialiser un Nouveau Dossier ?</h2>
           <p className="text-sm text-slate-500 leading-relaxed px-6">
              Cette action va clôturer la session actuelle et préparer l'interface pour le prochain patient. Toutes les données temporaires seront archivées.
           </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
           <button 
            onClick={handleReset}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-sm font-black uppercase tracking-[0.1em] text-xs shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3"
           >
             <UserPlus className="h-4 w-4" /> Confirmer & Commencer
           </button>
           {/* « Gérer les dossiers en attente » supprimé : ce bouton n'avait
               aucune action, et il n'existe pas de file de dossiers en attente
               dans l'application. Il promettait un écran inexistant. */}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="bg-slate-900 p-4 rounded-sm border border-slate-800 text-white flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Archive Automatique Activée</span>
         </div>
         <div className="bg-emerald-50 p-4 rounded-sm border border-emerald-100 text-emerald-900 flex items-center gap-3">
            <ArrowRight className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-tight">Prochain: M. Ndiaye (11:30)</span>
         </div>
      </div>
    </div>
  );
}
