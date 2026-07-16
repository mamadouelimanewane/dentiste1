"use client";

import React, { useState, useEffect } from "react";
import { QuoteBuilder } from "@/components/QuoteBuilder";
import { ClinicalNotes } from "@/components/ClinicalNotes";
import { MedicalQuestionnaire } from "@/components/MedicalQuestionnaire";
import { PatientRegistration } from "@/components/PatientRegistration";
import { ProcedureExecution } from "@/components/ProcedureExecution";
import { BillingManager } from "@/components/BillingManager";
import { PatientFollowUp } from "@/components/PatientFollowUp";
import { PractitionerHub } from "@/components/PractitionerHub";
import { AccountingDashboard } from "@/components/AccountingDashboard";
import { UserManagement } from "@/components/UserManagement";
import { Teleconsultation } from "@/components/Teleconsultation";
import { VoiceDictation } from "@/components/VoiceDictation";
import { AgendaModule } from "@/components/AgendaModule";
import { AiRadioLab } from "@/components/AiRadioLab";
import { SmileDesignStudio } from "@/components/SmileDesignStudio";
import { ProstheticsLab } from "@/components/ProstheticsLab";
import { PrescriptionEditor } from "@/components/PrescriptionEditor";
import { CommunicationCenter } from "@/components/CommunicationCenter";
import { InventoryManager } from "@/components/InventoryManager";
import { ClinicSettings } from "@/components/ClinicSettings";
import { AdminHub } from "@/components/AdminHub";
import { InsuranceManager } from "@/components/InsuranceManager";
import { NewDossier } from "@/components/NewDossier";
import { StatsDashboard } from "@/components/StatsDashboard";
import { PatientDirectory } from "@/components/PatientDirectory";
import { NeuralAssistant } from "@/components/NeuralAssistant";
import { NeuralLogsDashboard } from "@/components/NeuralLogsDashboard";
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
  LogOut,
  Stethoscope,
  FileText,
  History,
  CheckCircle2,
  Menu,
  Calculator,
  Users,
  Video,
  Brain,
  Calendar,
  Scan,
  Smile,
  Layers,
  Pill,
  MessageSquare,
  Package,
  FolderOpen,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePatient } from "@/lib/context";
import { useAuth, type Role } from "@/lib/auth-context";
import { hasPermission, type ModulePermissions } from "@/lib/modules";

const steps = [
  { id: 1, title: "Accueil", fullTitle: "Accueil & Prise en charge", desc: "Enregistrement et vérification des droits.", icon: UserPlus },
  { id: 2, title: "Arrivée", fullTitle: "Arrivée au Cabinet", desc: "Pointage et questionnaire médical.", icon: LogIn },
  { id: 3, title: "Nouv. Dossier", fullTitle: "Initialisation Dossier", desc: "Réinitialisation et nouveau cycle patient.", icon: RotateCcw },
  { id: 4, title: "Consultation", fullTitle: "Consultation Clinique", desc: "Diagnostic et plan de traitement.", icon: Stethoscope },
  { id: 5, title: "Réalisation", fullTitle: "Réalisation des Actes", desc: "Soins et interventions techniques.", icon: Activity },
  { id: 6, title: "Administration", fullTitle: "Gestion Administrative", desc: "Facturation et règlements.", icon: FileText },
  { id: 7, title: "Suivi", fullTitle: "Suivi & Archivage", desc: "Clôture et planification futurs RDV.", icon: History },
  { id: 8, title: "Comptabilité", fullTitle: "Comptabilité & Finances", desc: "Registre, factures et destinataires.", icon: Calculator },
  { id: 9, title: "Mutuelles", fullTitle: "Gestion des Mutuelles", desc: "Prises en charge, IPM et Assurances.", icon: ShieldCheck },
  { id: 10, title: "Utilisateurs", fullTitle: "Gestion des Utilisateurs", desc: "Rôles, privilèges et comptes.", icon: Users },
  { id: 11, title: "Téléconsult", fullTitle: "Médecine à Distance", desc: "Consultations vidéo et suivi à distance.", icon: Video },
  { id: 12, title: "Dictée IA", fullTitle: "Neural Dictation Suite", desc: "Dictée vocale intelligente et structuration IA.", icon: Brain },
  { id: 13, title: "Agenda", fullTitle: "Elite Planner Pro", desc: "Gestion des rendez-vous et ressources.", icon: Calendar },
  { id: 14, title: "Radio IA", fullTitle: "Advanced Neural Imaging", desc: "Diagnostic assisté par ordinateur.", icon: Scan },
  { id: 15, title: "Smile Design", fullTitle: "Smile Design Studio Pro", desc: "Simulation esthétique par IA.", icon: Smile },
  { id: 16, title: "Labo & CFAO", fullTitle: "Prosthetics Lab Center", desc: "Gestion des flux numériques et travaux prothétiques.", icon: Layers },
  { id: 17, title: "Ordonnances", fullTitle: "Éditeur d'Ordonnance", desc: "Création et impression d'ordonnances.", icon: Pill },
  { id: 18, title: "Communication", fullTitle: "WhatsApp & SMS Hub", desc: "Gestion automatisée des rendez-vous et rappels.", icon: MessageSquare },
  { id: 19, title: "Stocks", fullTitle: "Inventory Manager Pro", desc: "Gestion des consommables et commandes.", icon: Package },
  { id: 20, title: "Recherche", fullTitle: "Base de Données Centralisée", desc: "Recherche et indexation des dossiers patients.", icon: FolderOpen },
  { id: 21, title: "Configuration", fullTitle: "Paramètres du Cabinet", desc: "Configuration du profil, logo et infos légales.", icon: Settings },
  { id: 22, title: "Super Admin", fullTitle: "Centre d'Administration Sécurisé", desc: "Utilisateurs, Logs, Catalogue et BI.", icon: ShieldAlert },
  { id: 23, title: "Statistiques", fullTitle: "Tableau de Bord Stratégique", desc: "Analyse de performance et pilotage confidentiel.", icon: Calculator },
  { id: 24, title: "Neural Center", fullTitle: "Data Brain Monitoring", desc: "Logs IA et activité asynchrone en temps réel.", icon: Database },
];

// Source de vérité unique pour la visibilité des étapes : privilège "view"
// du rôle sur le module (table roles, gérable depuis l'admin), plus un
// rôle en dur.
function stepsForPermissions(permissions: ModulePermissions) {
  return steps.filter(s => hasPermission(permissions, s.id, 'view'));
}

export default function Home() {
  const { currentPatient } = usePatient();
  const { user, signOut } = useAuth();
  const role = user.role;
  const permissions = user.permissions;

  const [currentStep, setCurrentStep] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Sur mobile/tablette, la sidebar (menu plein écran en overlay) démarre
    // fermée pour ne pas écraser le contenu dans le peu d'espace restant.
    setIsSidebarOpen(window.innerWidth >= 1024);
    const saved = localStorage.getItem("dentiste_lite_step");
    if (saved) setCurrentStep(parseInt(saved));
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("dentiste_lite_step", currentStep.toString());
    }
  }, [currentStep, isMounted]);

  const visibleSteps = stepsForPermissions(permissions);

  // Si les privilèges du compte connecté ne donnent plus accès à l'étape
  // courante (ex. un admin a modifié le rôle pendant la session), on se
  // replie sur la première étape accessible.
  useEffect(() => {
    if (isMounted && !visibleSteps.find(s => s.id === currentStep)) {
      setCurrentStep(visibleSteps[0]?.id ?? 1);
    }
  }, [isMounted, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIndex = visibleSteps.findIndex(s => s.id === currentStep);

  const nextStep = () => {
    if (currentIndex < visibleSteps.length - 1) setCurrentStep(visibleSteps[currentIndex + 1].id);
  };
  const prevStep = () => {
    if (currentIndex > 0) setCurrentStep(visibleSteps[currentIndex - 1].id);
  };
  const reset = () => {
    // Clear all storage before reload
    const keysToRemove = [
      "dentiste_lite_step",
      "dentiste_lite_notes",
      "dentiste_lite_executed",
      "dentiste_lite_patient",
      "dentiste_lite_dictations"
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Reset local state for immediate feedback before reload
    setCurrentStep(1);
    setShowResetModal(false);

    // Delay slightly to allow state to settle, then hard reload
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  if (!isMounted) return null;

  return (
    <>
    <div className="min-h-screen bg-[#F1F5F9] flex overflow-hidden font-sans">
      {/* Fond assombri derrière la sidebar en overlay mobile — tap pour fermer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}
      {/* PROFESSIONAL SIDEBAR (NAVY BLUE) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 transition-transform duration-200 transform lg:relative lg:translate-x-0 flex flex-col border-r border-blue-900/20",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="p-6 space-y-8 flex-1">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white">
              <Activity className="h-5 w-5" />
            </div>
            <h1 className="font-bold tracking-tight text-white text-base">
              Elite ERP <span className="text-blue-400">Cap Vert</span>
            </h1>
          </div>

          <nav className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 mb-4">Navigation</p>
            {visibleSteps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setCurrentStep(step.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all text-sm font-medium",
                    isActive
                      ? "bg-blue-600/20 text-blue-400 border-r-2 border-blue-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive ? "text-blue-400" : isCompleted ? "text-emerald-500" : "text-slate-500")} />
                  <span className="text-sm">{step.title}</span>
                  {isCompleted && <CheckCircle2 className="h-4 w-4 ml-auto text-emerald-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full h-12 rounded bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 text-sm font-bold text-white shadow-lg shadow-blue-900/20"
          >
            <RotateCcw className="h-4 w-4" /> Nouveau Dossier
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
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full transition-all border",
                currentPatient
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              )}>
                {currentPatient ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                  />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                <span className="text-xs font-black uppercase tracking-wider">
                  {currentPatient ? `Patient Actif : ${currentPatient.name}` : "Aucun Patient Sélectionné"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right mr-2 border-l border-slate-200 pl-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{user.roleLabel}</span>
              <span className="text-sm font-black text-slate-900 tracking-tight">{user.fullName}</span>
            </div>
            <button
              onClick={signOut}
              title="Déconnexion"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-300 uppercase bg-slate-50 px-2 py-1 border border-slate-100 rounded">v1.3.1</span>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 no-scrollbar bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Phase Header */}
            <div className="border-b border-slate-200 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Étape {currentStep}</span>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="text-xs font-medium text-slate-400 uppercase">{steps[currentStep-1].desc}</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {steps[currentStep-1].fullTitle}
              </h2>
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {currentStep === 1 && <PatientRegistration />}
                    {currentStep === 2 && <MedicalQuestionnaire />}
                    {currentStep === 3 && <NewDossier />}
                    {currentStep === 4 && <QuoteBuilder />}

                    {currentStep === 5 && <ProcedureExecution />}
                    {currentStep === 6 && <BillingManager />}
                    {currentStep === 7 && <PatientFollowUp />}
                    {currentStep === 8 && <AccountingDashboard />}
                    {currentStep === 9 && <InsuranceManager />}
                    {currentStep === 10 && <UserManagement />}
                    {currentStep === 11 && <Teleconsultation />}
                    {currentStep === 12 && <VoiceDictation />}
                    {currentStep === 13 && <AgendaModule />}
                    {currentStep === 14 && <AiRadioLab />}
                    {currentStep === 15 && <SmileDesignStudio />}
                    {currentStep === 16 && <ProstheticsLab />}
                    {currentStep === 17 && <PrescriptionEditor />}
                    {currentStep === 18 && <CommunicationCenter />}
                    {currentStep === 19 && <InventoryManager />}
                    {currentStep === 20 && <PatientDirectory />}
                    {currentStep === 21 && <ClinicSettings />}
                    {currentStep === 22 && <AdminHub />}
                    {currentStep === 23 && <StatsDashboard />}
                    {currentStep === 24 && <NeuralLogsDashboard />}

                    {![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].includes(currentStep) && (
                      <div className="bg-white rounded-lg p-12 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                        <Activity className="h-10 w-10 text-slate-200" />
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-slate-900">Phase en attente</h3>
                          <p className="text-sm text-slate-500">Documentez les actes dans les notes cliniques.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
              </div>

              <div className="space-y-6">
                {hasPermission(permissions, 5, 'view') && <PractitionerHub />}
                {hasPermission(permissions, 5, 'view') && <ClinicalNotes phaseId={currentStep} />}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 px-6 z-40 flex items-center justify-between lg:pl-72 lg:pr-12">
          <button
            onClick={prevStep}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 h-9 rounded border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Précédent
          </button>

          <div className="flex items-center gap-1.5">
            {visibleSteps.map(s => (
              <div key={s.id} className={cn("h-1.5 w-1.5 rounded-full", s.id === currentStep ? "bg-blue-600" : "bg-slate-200")} />
            ))}
          </div>

          <button
            onClick={nextStep}
            disabled={currentIndex === visibleSteps.length - 1}
            className="flex items-center gap-2 px-6 h-9 rounded bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-30 transition-all shadow-sm"
          >
            {currentIndex === visibleSteps.length - 1 ? "Terminer le parcours" : "Étape Suivante"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* MODAL NOUVEAU DOSSIER */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">Créer un Nouveau Dossier ?</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Cette action va clôturer le dossier en cours et réinitialiser toutes les étapes (Arrivée, Consultation, Facturation). Les données non sauvegardées seront perdues.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded bg-blue-600 text-white text-xs font-bold shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmer et Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    <NeuralAssistant />
    </>
  );
}
