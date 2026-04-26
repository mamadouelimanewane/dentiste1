"use client";

import React, { useState, useEffect } from "react";
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
  RotateCcw,
  UserPlus,
  LogIn,
  Stethoscope,
  FileText,
  History,
  CheckCircle2,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: 1, title: "Accueil", fullTitle: "Accueil & Prise en charge", desc: "Enregistrement et vérification des droits.", icon: UserPlus },
  { id: 2, title: "Arrivée", fullTitle: "Arrivée au Cabinet", desc: "Pointage et questionnaire médical.", icon: LogIn },
  { id: 3, title: "Consultation", fullTitle: "Consultation Clinique", desc: "Diagnostic et plan de traitement.", icon: Stethoscope },
  { id: 4, title: "Réalisation", fullTitle: "Réalisation des Actes", desc: "Soins et interventions techniques.", icon: Activity },
  { id: 5, title: "Administration", fullTitle: "Gestion Administrative", desc: "Facturation et règlements.", icon: FileText },
  { id: 6, title: "Suivi", fullTitle: "Suivi & Archivage", desc: "Clôture et planification futurs RDV.", icon: History },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const reset = () => {
    if (confirm("Réinitialiser le parcours patient ?")) {
      setCurrentStep(1);
      localStorage.removeItem("dentiste_lite_notes");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden">
      {/* SIDEBAR */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 transform lg:relative lg:translate-x-0 flex flex-col",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="p-8 space-y-8 flex-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-black tracking-tighter uppercase italic leading-none text-lg">
                Dentiste<span className="text-blue-600">Lite</span>
              </h1>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Workflow Engine</p>
            </div>
          </div>

          <nav className="space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Parcours Patient</p>
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative overflow-hidden",
                    isActive 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                    isActive ? "bg-white/20" : isCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-500"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-wider leading-none mb-1">{step.title}</p>
                    <p className={cn("text-[9px] font-medium opacity-60", isActive ? "text-white" : "text-slate-500")}>
                      {isActive ? "En cours" : isCompleted ? "Terminé" : "À venir"}
                    </p>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute right-0 top-0 bottom-0 w-1 bg-white"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Système Prêt</p>
            </div>
            <button 
              onClick={reset}
              className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <RotateCcw className="h-3 w-3" /> Nouveau Patient
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-900"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Patient Actuel</p>
                <p className="text-sm font-bold text-slate-900">Mamadou Diallo</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Live Workflow v1.3</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 no-scrollbar pb-32">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Phase Intro */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Phase Opérationnelle</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                {steps[currentStep-1].fullTitle}
              </h2>
              <p className="text-slate-500 text-xl font-medium max-w-2xl">{steps[currentStep-1].desc}</p>
            </section>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStep === 2 && <MedicalQuestionnaire />}
                    {currentStep === 3 && <QuoteBuilder />}
                    
                    {![2, 3].includes(currentStep) && (
                      <div className="bg-white rounded-[3rem] p-16 border border-slate-100 flex flex-col items-center justify-center text-center space-y-8 shadow-xl shadow-slate-200/20">
                        <div className="h-24 w-24 bg-blue-50 rounded-[2rem] flex items-center justify-center rotate-3 group hover:rotate-0 transition-transform">
                          <Activity className="h-12 w-12 text-blue-600" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Prêt pour l'action</h3>
                          <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
                            Cette étape nécessite une attention particulière sur les notes cliniques et le suivi administratif.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <ClinicalNotes phaseId={currentStep} />
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                    <Zap className="h-32 w-32 text-blue-500" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Lite AI</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed font-medium">
                      "Un sourire est le chemin le plus court entre deux personnes."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="absolute bottom-0 inset-x-0 z-[60] p-6 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-4 shadow-2xl shadow-slate-900/10 flex items-center justify-between gap-6">
              <button 
                onClick={prevStep}
                disabled={currentStep === 1}
                className={cn(
                  "flex items-center gap-3 px-10 h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all",
                  currentStep === 1 
                    ? "text-slate-200 cursor-not-allowed" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <ChevronLeft className="h-5 w-5" /> Précédent
              </button>
              
              <div className="flex-1 flex justify-center">
                <div className="bg-slate-50 px-6 py-2 rounded-full border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Phase <span className="text-blue-600">{currentStep}</span> / 6
                  </p>
                </div>
              </div>

              <button 
                onClick={nextStep}
                disabled={currentStep === 6}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-3 px-14 h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20",
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
      </div>
    </div>
  );
}


