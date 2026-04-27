"use client";

import React, { useState } from "react";
import { Zap, Activity, Users, Clock, BrainCircuit, Calendar, X, Pill, Stethoscope, Syringe, BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function PractitionerHub() {
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);

  return (
    <>
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
          {/* Quick Stats & Agenda Button */}
          <div className="space-y-3">
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
            
            <button 
              onClick={() => setIsAgendaOpen(true)}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              Voir mon Agenda
            </button>
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

          {/* Trousseau du Praticien */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Trousseau Clinique</span>
              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px]">RACCOURCIS</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Odontogramme", icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Ordonnance", icon: Pill, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Anesthésie", icon: Syringe, color: "text-rose-600", bg: "bg-rose-50" },
                { label: "Protocoles", icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50" },
              ].map((tool, idx) => (
                <button key={idx} className="flex items-center gap-2 p-2 rounded-sm border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group">
                  <div className={cn("p-1.5 rounded flex-shrink-0", tool.bg)}>
                    <tool.icon className={cn("h-3 w-3", tool.color)} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-700 uppercase tracking-tight flex-1">{tool.label}</span>
                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-slate-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agenda Modal */}
      <AnimatePresence>
        {isAgendaOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setIsAgendaOpen(false)}
          >
            <motion.div 
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F8FAFC] rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-[#0F172A] p-6 text-white flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight">Agenda du Jour</h2>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Dr. Diallo • 12 Patients Prévus</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAgendaOpen(false)} 
                  className="h-10 w-10 bg-slate-800 hover:bg-rose-500 rounded flex items-center justify-center transition-colors text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-3 flex-1">
                 {[
                   { time: "09:00", patient: "Aissatou Sow", type: "Consultation de routine", status: "Terminé", active: false },
                   { time: "10:30", patient: "Mamadou Diallo", type: "Urgence / Soins Conservateurs", status: "En cours", active: true },
                   { time: "11:45", patient: "Oumar Ndiaye", type: "Contrôle Post-Opératoire", status: "En attente", active: false },
                   { time: "14:00", patient: "Fatou Diop", type: "Détartrage & Polissage", status: "Prévu", active: false },
                   { time: "15:30", patient: "Cheikh Fall", type: "Pose d'Implant (Phase 1)", status: "Prévu", active: false },
                   { time: "17:00", patient: "Ndeye Sylla", type: "Orthodontie (Ajustement)", status: "Prévu", active: false },
                 ].map((apt, i) => (
                   <div 
                     key={i} 
                     className={cn(
                       "flex items-center p-4 border rounded-md gap-6 transition-all", 
                       apt.active ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                     )}
                   >
                     <div className="text-2xl font-black text-slate-800 w-20 tracking-tighter">
                       {apt.time}
                     </div>
                     <div className="flex-1">
                       <p className="text-base font-black text-slate-900 uppercase tracking-tight">{apt.patient}</p>
                       <div className="flex items-center gap-2 mt-1">
                         <Activity className="h-3.5 w-3.5 text-slate-400" />
                         <p className="text-[11px] font-bold text-slate-500 uppercase">{apt.type}</p>
                       </div>
                     </div>
                     <div className="text-right flex-shrink-0 w-32">
                       <span className={cn(
                         "text-[10px] font-black uppercase px-3 py-1.5 rounded-sm tracking-widest inline-block text-center w-full", 
                         apt.status === "Terminé" ? "bg-slate-100 text-slate-500" :
                         apt.status === "En cours" ? "bg-blue-600 text-white shadow-md shadow-blue-200" :
                         apt.status === "En attente" ? "bg-rose-100 text-rose-700" :
                         "bg-slate-50 text-slate-400 border border-slate-100"
                       )}>
                         {apt.status}
                       </span>
                     </div>
                   </div>
                 ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
