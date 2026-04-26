"use client";

import React, { useState, useEffect } from "react";
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
  Zap,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("dentiste_lite_step");
    if (saved) setCurrentStep(parseInt(saved));
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("dentiste_lite_step", currentStep.toString());
    }
  }, [currentStep, isMounted]);

  const steps = [
    { id: 1, title: "Accueil & Prise en charge", desc: "Enregistrement et vérification des droits." },
    { id: 2, title: "Arrivée au Cabinet", desc: "Pointage et questionnaire médical." },
    { id: 3, title: "Consultation Clinique", desc: "Diagnostic et plan de traitement." },
    { id: 4, title: "Réalisation des Actes", desc: "Soins et interventions techniques." },
    { id: 5, title: "Gestion Administrative", desc: "Facturation et règlements." },
    { id: 6, title: "Suivi & Archivage", desc: "Clôture et planification futurs RDV." },
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const reset = () => {
    if (confirm("Voulez-vous réinitialiser le parcours patient ?")) {
      setCurrentStep(1);
      localStorage.removeItem("dentiste_lite_notes");
    }
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col pb-32">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-black tracking-tighter uppercase italic leading-none text-lg">
              Dentiste<span className="text-blue-600">Lite</span>
            </h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Workflow Engine v1.2</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 py-2 px-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient en cours</p>
              <p className="text-xs font-bold text-slate-900">Mamadou Diallo</p>
            </div>
          </div>
          <button onClick={reset} className="p-3 text-slate-400 hover:text-rose-500 transition-colors" title="Réinitialiser">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 container mx-auto py-12 px-6 space-y-12 max-w-5xl">
        {/* Progress Section */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                <Sparkles className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-wider">Étape {currentStep} sur 6</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                {steps[currentStep-1].title}
              </h2>
              <p className="text-slate-500 font-medium text-lg">{steps[currentStep-1].desc}</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white">
            <PatientJourneyStepper currentPhase={currentStep} />
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Module Area */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 2 && <MedicalQuestionnaire />}
                {currentStep === 3 && <QuoteBuilder />}
                
                {/* Fallback for other steps or empty state */}
                {![2, 3].includes(currentStep) && (
                  <div className="bg-white rounded-[2.5rem] p-12 border border-slate-100 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                      <Activity className="h-10 w-10 text-slate-300" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-900">Phase Opérationnelle</h3>
                      <p className="text-slate-500 max-w-sm mx-auto">
                        Utilisez les notes cliniques à droite pour documenter cette étape du parcours patient.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar / Auxiliary Area */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-32">
            <ClinicalNotes phaseId={currentStep} />
            
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                <Zap className="h-32 w-32 text-blue-500" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Lite Intelligence</span>
                </div>
                <h3 className="text-lg font-bold tracking-tight">Le saviez-vous ?</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">
                  Le passage fluide entre les étapes réduit l'anxiété du patient de 30% en moyenne.
                </p>
                <div className="h-px bg-white/10 w-full" />
                <button className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 group/btn">
                  Voir statistiques <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED NAVIGATION BAR */}
      <div className="fixed bottom-0 inset-x-0 z-[60] p-6 pointer-events-none">
        <div className="container mx-auto max-w-5xl pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-4 shadow-2xl shadow-slate-900/10 flex items-center justify-between gap-6">
            <button 
              onClick={prevStep}
              disabled={currentStep === 1}
              className={cn(
                "flex items-center gap-3 px-8 h-16 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                currentStep === 1 
                  ? "bg-slate-50 text-slate-300 cursor-not-allowed" 
                  : "bg-white border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200"
              )}
            >
              <ChevronLeft className="h-5 w-5" /> Précédent
            </button>
            
            <div className="hidden md:flex flex-1 items-center justify-center gap-2">
              {steps.map((s) => (
                <div 
                  key={s.id} 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-500",
                    s.id === currentStep ? "w-8 bg-blue-600" : s.id < currentStep ? "w-2 bg-blue-200" : "w-2 bg-slate-100"
                  )}
                />
              ))}
            </div>

            <button 
              onClick={nextStep}
              disabled={currentStep === 6}
              className={cn(
                "flex-1 md:flex-none flex items-center justify-center gap-3 px-12 h-16 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20",
                currentStep === 6
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02] active:scale-95"
              )}
            >
              {currentStep === 6 ? "Terminé" : "Phase Suivante"} 
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <footer className="py-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
          Dentiste Lite — Systèmes Intelligents de Santé
        </p>
      </footer>
    </main>
  );
}

