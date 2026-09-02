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
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
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
  ChevronDown,
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
  Database,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePatient } from "@/lib/context";
import { useAuth, type Role } from "@/lib/auth-context";
import { hasPermission, type ModulePermissions } from "@/lib/modules";
import { DENTAL_MODULE_GROUPS } from "@/lib/dentalModules";

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
  { id: 12, title: "Dictée vocale", fullTitle: "Dictée Vocale", desc: "Reconnaissance vocale du navigateur, sauvegarde locale.", icon: Brain },
  { id: 13, title: "Agenda", fullTitle: "Elite Planner Pro", desc: "Gestion des rendez-vous et ressources.", icon: Calendar },
  { id: 14, title: "Imagerie", fullTitle: "Visionneuse de Clichés", desc: "Consultation des radiographies du patient.", icon: Scan },
  { id: 15, title: "Comparaison", fullTitle: "Comparaison de clichés", desc: "Superposition de deux photographies du dossier.", icon: Smile },
  { id: 16, title: "Labo & CFAO", fullTitle: "Prosthetics Lab Center", desc: "Gestion des flux numériques et travaux prothétiques.", icon: Layers },
  { id: 17, title: "Ordonnances", fullTitle: "Éditeur d'Ordonnance", desc: "Création et impression d'ordonnances.", icon: Pill },
  { id: 18, title: "Communication", fullTitle: "WhatsApp & SMS Hub", desc: "Gestion automatisée des rendez-vous et rappels.", icon: MessageSquare },
  { id: 19, title: "Stocks", fullTitle: "Inventory Manager Pro", desc: "Gestion des consommables et commandes.", icon: Package },
  { id: 20, title: "Recherche", fullTitle: "Base de Données Centralisée", desc: "Recherche et indexation des dossiers patients.", icon: FolderOpen },
  { id: 21, title: "Configuration", fullTitle: "Paramètres du Cabinet", desc: "Configuration du profil, logo et infos légales.", icon: Settings },
  { id: 22, title: "Super Admin", fullTitle: "Centre d'Administration Sécurisé", desc: "Utilisateurs, Logs, Catalogue et BI.", icon: ShieldAlert },
  { id: 23, title: "Statistiques", fullTitle: "Tableau de Bord Stratégique", desc: "Analyse de performance et pilotage confidentiel.", icon: Calculator },
  { id: 24, title: "Journal", fullTitle: "Journal d'activité", desc: "Historique des actions enregistrées par l'assistant de saisie.", icon: Database },
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

    // Redirection vers le portail si c'est la vue par défaut choisie
    const homeView = localStorage.getItem("dentiste_home_view");
    if (!homeView || homeView === "portal") {
      window.location.replace("/dashboard/apps");
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("dentiste_lite_step", currentStep.toString());
    }
  }, [currentStep, isMounted]);

  const allVisibleSteps = stepsForPermissions(permissions);
  
  const activeGroup = DENTAL_MODULE_GROUPS.find(g => g.modules.some(m => m.id === currentStep));
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  // Le groupe de l'étape courante s'ouvre automatiquement.
  useEffect(() => {
    if (activeGroup && !openGroups.includes(activeGroup.label)) {
      setOpenGroups(prev => [...prev, activeGroup.label]);
    }
  }, [activeGroup?.label]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeGroupModuleIds = activeGroup ? activeGroup.modules.map(m => m.id) : [];

  const visibleSteps = allVisibleSteps.filter(s => activeGroupModuleIds.includes(s.id));

  // Groupes réellement accessibles au compte connecté, avec leurs étapes.
  const authorizedGroups = DENTAL_MODULE_GROUPS
    .map(g => ({
      label: g.label,
      steps: allVisibleSteps.filter(s => g.modules.some(m => m.id === s.id)),
    }))
    .filter(g => g.steps.length > 0);

  // Si les privilèges du compte connecté ne donnent plus accès à l'étape
  // courante (ex. un admin a modifié le rôle pendant la session), on se
  // replie sur la première étape accessible.
  useEffect(() => {
    if (isMounted && !allVisibleSteps.find(s => s.id === currentStep)) {
      setCurrentStep(allVisibleSteps[0]?.id ?? 1);
    }
  }, [isMounted, role, currentStep, allVisibleSteps]);

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
      window.location.href = '/dashboard/apps';
    }, 100);
  };

  if (!isMounted) return null;

  return (
    <>
    <div className="min-h-screen bg-background flex overflow-hidden font-sans">
      {/* Fond assombri derrière la sidebar en overlay mobile — tap pour fermer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      )}
      {/* PROFESSIONAL SIDEBAR (DEEP NAVY / GLASS) */}
      <aside
        style={{ transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)" }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 glass-dark text-slate-300 transition-transform duration-300 ease-out lg:relative lg:!transform-none flex flex-col border-r border-white/5",
          !isSidebarOpen && "lg:hidden"
        )}
      >
        <div className="p-8 space-y-8 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-4 px-1 justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white">
                <Activity className="h-5 w-5" />
              </div>
              <h1 className="font-bold tracking-tight text-white text-base">
                Elite ERP <span className="text-blue-400">Cap Vert</span>
              </h1>
            </div>
            <button
              onClick={() => {
                localStorage.setItem("dentiste_home_view", "portal");
                window.location.href = "/dashboard/apps";
              }}
              title="Portail des modules"
              className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-white/5 transition-colors flex-shrink-0"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* La barre latérale n'affichait que le groupe courant : depuis la
              Consultation, atteindre la Comptabilité imposait un détour par le
              portail des modules. Tous les groupes autorisés sont désormais
              présents, celui en cours étant déplié. */}
          <nav className="space-y-4">
            {authorizedGroups.map((groupe) => {
              const ouvert = openGroups.includes(groupe.label);
              return (
                <div key={groupe.label} className="space-y-1">
                  <button
                    onClick={() =>
                      setOpenGroups((prev) =>
                        prev.includes(groupe.label)
                          ? prev.filter((g) => g !== groupe.label)
                          : [...prev, groupe.label]
                      )
                    }
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    <span>{groupe.label}</span>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform duration-200", ouvert && "rotate-180")}
                    />
                  </button>

                  {ouvert &&
                    groupe.steps.map((step) => {
                      const Icon = step.icon;
                      const isActive = currentStep === step.id;
                      return (
                        <button
                          key={step.id}
                          onClick={() => {
                            setCurrentStep(step.id);
                            if (window.innerWidth < 1024) setIsSidebarOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 text-sm font-semibold micro-bounce",
                            isActive
                              ? "bg-blue-600/15 text-blue-400 shadow-[inset_4px_0_0_0_#60a5fa]"
                              : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 transition-transform duration-300",
                              isActive ? "text-blue-400 scale-110" : "text-slate-500 group-hover:scale-110"
                            )}
                          />
                          <span className="text-sm tracking-wide">{step.title}</span>
                        </button>
                      );
                    })}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-white/5">
          <button
            onClick={() => setShowResetModal(true)}
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)] micro-bounce"
          >
            <RotateCcw className="h-4 w-4" /> Nouveau Dossier
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 glass-panel border-b-0 flex items-center justify-between px-8 flex-shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all border",
                currentPatient
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                  : "bg-slate-100/50 border-slate-200 text-slate-500"
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
                <span className="text-xs font-black uppercase tracking-wider mr-2">
                  {currentPatient ? `Patient Actif : ${currentPatient.name}` : "Aucun Patient Sélectionné"}
                </span>
                {currentPatient?.allergies && (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-100 bg-red-600/80 px-2 py-0.5 rounded-full" title={`Allergies : ${currentPatient.allergies}`}>
                    <ShieldAlert className="h-3 w-3" />
                    {currentPatient.allergies}
                  </span>
                )}
                {/* Points de vigilance du questionnaire d'arrivée : visibles
                    partout, y compris en consultation et en réalisation. */}
                {currentPatient?.vigilances?.map((v) => (
                  <span
                    key={v}
                    title="Antécédent signalé lors de l'accueil"
                    className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full"
                  >
                    <ShieldAlert className="h-3 w-3" />
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Ce bouton émettait un événement `quick-action-emergency` que
                personne n'écoutait, puis annonçait « Fonctionnalité Urgence
                activée ». Sur un bouton d'urgence, annoncer une action qui
                n'a pas lieu est le pire des défauts : il ouvre désormais
                réellement l'écran d'accueil, où l'on enregistre un patient
                qui se présente en urgence. */}
            <button
              onClick={() => {
                setCurrentStep(1);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              title="Urgence — ouvrir l'écran d'enregistrement"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition-colors border border-rose-700 shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Urgence</span>
            </button>
            <div className="hidden md:flex flex-col text-right mr-2 border-l border-slate-200 pl-4">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{user.roleLabel}</span>
              <span className="text-sm font-black text-slate-900 tracking-tight">{user.fullName}</span>
            </div>
            {/* Bouton Portail */}
            <button
              onClick={() => {
                localStorage.setItem("dentiste_home_view", "portal");
                window.location.href = "/dashboard/apps";
              }}
              title="Portail des modules"
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <ThemeSwitcher compact />
            <button
              onClick={signOut}
              title="Déconnexion"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-3 py-1.5 rounded-full">v1.4.0</span>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          <div className="max-w-5xl mx-auto space-y-10 pb-24">
            {/* Phase Header */}
            <div className="border-b border-foreground/10 pb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Étape {currentStep}</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
                  <span className="text-xs font-medium text-foreground/50 uppercase">{steps[currentStep-1].desc}</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {steps[currentStep-1].fullTitle}
                </h2>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all micro-bounce"
              >
                <UserPlus className="h-4 w-4" />
                Nouveau Dossier
              </button>
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={cn("space-y-6", currentStep === 13 ? "lg:col-span-3" : "lg:col-span-2")}>
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

              {currentStep !== 13 && (
                <div className="space-y-6">
                  {hasPermission(permissions, 5, 'view') && <PractitionerHub onNavigate={(step) => setCurrentStep(step)} />}
                  {hasPermission(permissions, 5, 'view') && <ClinicalNotes phaseId={currentStep} />}
                </div>
              )}
            </div>
          </div>
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
