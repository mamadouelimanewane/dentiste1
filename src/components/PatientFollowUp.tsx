"use client";

import React, { useState } from "react";
import { Calendar, Archive, FileCheck, Star, ArrowRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function PatientFollowUp() {
  const [nextAppointment, setNextAppointment] = useState("");
  const [satisfaction, setSatisfaction] = useState(5);
  const [isArchived, setIsArchived] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-[#0F172A] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-emerald-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Clôture du Dossier</h3>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase">Session : #445-2024</span>
        </div>

        <div className="p-8 space-y-10">
          {/* Next Appointment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Prochain Rendez-vous</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="datetime-local" 
                className="bg-slate-50 border border-slate-100 rounded-sm p-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-300"
                value={nextAppointment}
                onChange={(e) => setNextAppointment(e.target.value)}
              />
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-sm">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <p className="text-[9px] font-bold text-blue-800 uppercase leading-tight">Rappel SMS automatique configuré</p>
              </div>
            </div>
          </div>

          {/* Satisfaction */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Expérience Patient</h4>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <button 
                  key={i} 
                  onClick={() => setSatisfaction(i)}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border transition-all",
                    satisfaction >= i ? "bg-yellow-50 border-yellow-200 text-yellow-500" : "bg-slate-50 border-slate-100 text-slate-300"
                  )}
                >
                  <Star className={cn("h-5 w-5", satisfaction >= i ? "fill-current" : "")} />
                </button>
              ))}
              <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">Note: {satisfaction}/5</span>
            </div>
          </div>

          {/* Final Action */}
          <div className="pt-10">
            <button 
              onClick={() => setIsArchived(true)}
              className={cn(
                "w-full h-14 rounded-sm flex items-center justify-center gap-3 transition-all",
                isArchived 
                  ? "bg-emerald-600 text-white cursor-default" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100"
              )}
            >
              {isArchived ? (
                <>
                  <FileCheck className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Dossier Archivé avec Succès</span>
                </>
              ) : (
                <>
                  <Archive className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Finaliser & Archiver la Séance</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Une copie du compte-rendu a été envoyée au patient.
        </p>
      </div>
    </div>
  );
}
