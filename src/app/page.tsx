"use client";

import React, { useState, useEffect } from "react";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { ClinicalNotes } from "@/components/ClinicalNotes";
import { MedicalQuestionnaire } from "@/components/MedicalQuestionnaire";
import { PatientRegistration } from "@/components/PatientRegistration";
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
  Menu
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
    <div className="min-h-screen bg-[#F1F5F9] flex overflow-hidden font-sans">
      {/* PROFESSIONAL SIDEBAR */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#1E293B] text-slate-300 transition-transform duration-200 transform lg:relative lg:translate-x-0 flex flex-col border-r border-slate-800",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="p-6 space-y-8 flex-1">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white">
              <Activity className="h-5 w-5" />
            </div>
            <h1 className="font-bold tracking-tight text-white text-base">
              Dentiste<span className="text-blue-400">Lite</span>
            </h1>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-4">Navigation</p>
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm font-medium",
                    isActive 
                      ? "bg-blue-600/10 text-blue-400 border-r-2 border-blue-400" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-blue-400" : isCompleted ? "text-emerald-500" : "text-slate-500")} />
                  <span>{step.title}</span>
                  {isCompleted && <CheckCircle2 className="h-3 w-3 ml-auto text-emerald-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={reset}
            className="w-full h-9 rounded bg-slate-800 hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-xs font-semibold text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Nouveau Dossier
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="h-4 w-4" />
              <span className="text-xs font-semibold">Patient : <span className="text-slate-900">Mamadou Diallo</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">v1.3 STABLE</span>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Phase Header */}
            <div className="border-b border-slate-200 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Étape {currentStep}</span>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-medium text-slate-400 uppercase">{steps[currentStep-1].desc}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {steps[currentStep-1].fullTitle}
              </h2>
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {currentStep === 1 && <PatientRegistration />}
                    {currentStep === 2 && <MedicalQuestionnaire />}
                    {currentStep === 3 && <QuoteBuilder />}
                    
                    {![1, 2, 3].includes(currentStep) && (
                      <div className="bg-white rounded-lg p-12 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                        <Activity className="h-10 w-10 text-slate-200" />
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-slate-900">Phase en attente</h3>
                          <p className="text-sm text-slate-500">Documentez les actes dans les notes cliniques.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="space-y-6">
                <ClinicalNotes phaseId={currentStep} />
                <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Aide au Diagnostic</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Les antécédents médicaux du patient doivent être vérifiés avant toute intervention chirurgicale ou anesthésie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION (SLIM) */}
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 px-6 z-40 flex items-center justify-between lg:pl-72 lg:pr-12">
          <button 
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 h-9 rounded border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Précédent
          </button>
          
          <div className="flex items-center gap-1.5">
            {steps.map(s => (
              <div key={s.id} className={cn("h-1.5 w-1.5 rounded-full", s.id === currentStep ? "bg-blue-600" : "bg-slate-200")} />
            ))}
          </div>

          <button 
            onClick={nextStep}
            disabled={currentStep === 6}
            className="flex items-center gap-2 px-6 h-9 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-30 transition-all shadow-sm"
          >
            {currentStep === 6 ? "Terminer le parcours" : "Étape Suivante"} 
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}




