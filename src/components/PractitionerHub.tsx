"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, Calendar, X, Pill, Stethoscope, Syringe, BookOpen, ChevronRight, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TodayAppointment {
  id: string;
  patient_name: string;
  type: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  checked_in_at: string | null;
}

function statusLabel(appt: TodayAppointment): string {
  if (appt.status === "cancelled") return "Annulé";
  if (appt.status === "no_show") return "Absent";
  if (appt.status === "completed") return "Terminé";
  if (appt.checked_in_at) return "En attente";
  return "Prévu";
}

export function PractitionerHub({ onNavigate }: { onNavigate?: (stepId: number) => void }) {
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadToday = useCallback(async () => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    try {
      const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      if (res.ok) setTodayAppointments(data.appointments || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const active = todayAppointments.filter(a => a.status !== "cancelled" && a.status !== "no_show");
  const scheduled = active.filter(a => !a.checked_in_at && a.status !== "completed");
  const waiting = active.filter(a => a.checked_in_at && a.status !== "completed");
  const done = active.filter(a => a.status === "completed");

  const avgDuration = active.length
    ? Math.round(active.reduce((sum, a) => sum + (a.duration_minutes || 0), 0) / active.length)
    : null;

  const handleToolClick = (stepId: number) => {
    if (onNavigate) {
      onNavigate(stepId);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0F172A] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Hub Praticien</h3>
          </div>
          <div className="h-8 w-10 border border-slate-700 rounded flex items-center justify-center">
            <span className="text-xs font-bold text-emerald-400">ON</span>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Quick Stats & Agenda Button */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-slate-50 p-4 rounded-sm border border-slate-100">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patients Aujourd&apos;hui</p>
                 <p className="text-2xl font-black text-blue-900 mt-0.5">{loading ? "—" : active.length}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-sm border border-slate-100">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Durée Moyenne</p>
                 <p className="text-2xl font-black text-blue-900 mt-0.5">
                   {avgDuration !== null ? avgDuration : "—"}<span className="text-xs text-slate-400 ml-1">min</span>
                 </p>
               </div>
            </div>

            <button
              onClick={() => setIsAgendaOpen(true)}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Calendar className="h-5 w-5" />
              Voir mon Agenda
            </button>
          </div>

          {/* Real-time Flow */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Flux du Jour</h4>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="font-bold text-slate-600">Programmés</span>
                </div>
                <span className="font-black text-blue-600">{loading ? "—" : scheduled.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <span className="font-bold text-slate-600">Salle d&apos;attente</span>
                </div>
                <span className="font-black text-rose-600">{loading ? "—" : waiting.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-600">Terminés</span>
                </div>
                <span className="font-black text-emerald-600">{loading ? "—" : done.length}</span>
              </div>
            </div>
          </div>

          {/* Radio IA — lien vers le module, pas de fausse alerte patient */}
          <div className="pt-4 border-t border-slate-100">
             <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-sm border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => handleToolClick(14)}>
               <Activity className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
               <div className="space-y-1.5">
                 <p className="text-xs font-black text-blue-900 uppercase tracking-tight">Radio IA</p>
                 <p className="text-xs font-medium text-slate-600 leading-relaxed">
                   Module de démonstration — cliquez pour l&apos;analyse assistée de radiographies.
                 </p>
               </div>
             </div>
          </div>

          {/* Trousseau du Praticien */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Trousseau Clinique</span>
              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">RACCOURCIS</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Odontogramme", icon: Activity, color: "text-blue-600", bg: "bg-blue-50", stepId: 4 },
                { label: "Ordonnance", icon: Pill, color: "text-emerald-600", bg: "bg-emerald-50", stepId: 17 },
                { label: "Anesthésie", icon: Syringe, color: "text-rose-600", bg: "bg-rose-50", stepId: 5 },
                { label: "Protocoles", icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50", stepId: 5 },
              ].map((tool, idx) => (
                <button key={idx} onClick={() => handleToolClick(tool.stepId)} className="flex items-center gap-3 p-3 rounded-sm border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-left group">
                  <div className={cn("p-2 rounded flex-shrink-0", tool.bg)}>
                    <tool.icon className={cn("h-4 w-4", tool.color)} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-tight flex-1">{tool.label}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
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
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                      {active.length} Patient{active.length > 1 ? "s" : ""} Prévu{active.length > 1 ? "s" : ""}
                    </p>
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
                 {active.length === 0 ? (
                   <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
                     <Stethoscope className="h-8 w-8 text-slate-300" />
                     <p className="text-sm font-bold text-slate-500">Aucun rendez-vous prévu aujourd&apos;hui.</p>
                   </div>
                 ) : (
                   active
                     .slice()
                     .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                     .map((apt) => {
                       const label = statusLabel(apt);
                       return (
                         <div
                           key={apt.id}
                           className={cn(
                             "flex items-center p-4 border rounded-md gap-6 transition-all",
                             label === "En attente" ? "border-blue-300 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                           )}
                         >
                           <div className="text-2xl font-black text-slate-800 w-20 tracking-tighter">
                             {new Date(apt.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                           </div>
                           <div className="flex-1">
                             <p className="text-base font-black text-slate-900 uppercase tracking-tight">{apt.patient_name}</p>
                             <div className="flex items-center gap-2 mt-1">
                               <Activity className="h-3.5 w-3.5 text-slate-400" />
                               <p className="text-[11px] font-bold text-slate-500 uppercase">{apt.type || "Consultation"}</p>
                             </div>
                           </div>
                           <div className="text-right flex-shrink-0 w-32">
                             <span className={cn(
                               "text-[10px] font-black uppercase px-3 py-1.5 rounded-sm tracking-widest inline-block text-center w-full",
                               label === "Terminé" ? "bg-slate-100 text-slate-500" :
                               label === "En attente" ? "bg-blue-600 text-white shadow-md shadow-blue-200" :
                               "bg-slate-50 text-slate-400 border border-slate-100"
                             )}>
                               {label}
                             </span>
                           </div>
                         </div>
                       );
                     })
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
