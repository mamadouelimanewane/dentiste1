"use client";

import React, { useState } from "react";
import { PatientJourneyStepper } from "@/components/PatientJourneyStepper";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { ClinicalNotes } from "@/components/ClinicalNotes";
import { MedicalQuestionnaire } from "@/components/MedicalQuestionnaire";
import { 
  Activity, 
  User, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { id: 1, title: "Accueil & Prise en charge", desc: "Enregistrement et vérification des droits." },
    { id: 2, title: "Arrivée au Cabinet", desc: "Pointage et questionnaire médical." },
    { id: 3, title: "Consultation Clinique", desc: "Diagnostic et plan de traitement." },
    { id: 4, title: "Réalisation des Actes", desc: "Soins et interventions techniques." },
    { id: 5, title: "Gestion Administrative", desc: "Facturation et règlements." },
    { id: 6, title: "Suivi & Archivage", desc: "Clôture et planification futurs RDV." },
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Lite Header */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">D</div>
          <span className="font-black tracking-tighter uppercase italic">Dentiste<span className="text-blue-600">Lite</span></span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Activity className="h-4 w-4 text-blue-600" /> Workflow v1.0
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto py-12 space-y-12 max-w-4xl">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Pilotage <span className="text-blue-600">Simplifié</span></h1>
          <p className="text-slate-500 font-medium">Gérez le parcours de vos patients étape par étape.</p>
        </div>

        {/* Stepper Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          <PatientJourneyStepper currentPhase={currentStep} />
        </div>

        {/* Current Phase Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">{currentStep}</span>
              <h2 className="text-2xl font-black tracking-tight">{steps[currentStep-1].title}</h2>
            </div>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              {steps[currentStep-1].desc}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 h-12 rounded-2xl border border-slate-200 font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button 
                onClick={() => setCurrentStep(prev => Math.min(prev + 1, 6))}
                disabled={currentStep === 6}
                className="flex-1 flex items-center justify-center gap-2 px-6 h-12 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              >
                Phase Suivante <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <ClinicalNotes phaseId={currentStep} />
            
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                <Zap className="h-32 w-32 text-blue-500" />
              </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Lite Intelligence</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight">Focus du Moment</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Optimisez chaque interaction patient pour un cabinet plus fluide. 
                Utilisez le workflow pour ne manquer aucune étape administrative ou clinique.
              </p>
              <div className="pt-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Patient Actuel</p>
                  <p className="text-sm font-black text-white">Mamadou Diallo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Phase-Specific Content */}
        {currentStep === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-rose-600 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Module Médical</span>
            </div>
            <MedicalQuestionnaire />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-1 w-8 bg-blue-600 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Module Devis Lite</span>
            </div>
            <QuoteBuilder />
          </motion.div>
        )}

        {/* Footer */}
        <footer className="h-12 bg-slate-900 flex items-center justify-center px-8 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 rounded-2xl">
          Dentiste Lite v1.0 — Powered by Workflow Engine
        </footer>
      </div>
    </main>
  );
}
