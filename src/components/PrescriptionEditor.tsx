"use client";

import React, { useState } from "react";
import { ArrowLeft, History, Printer, Save, Plus, Pill, Star, Search, User, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { rappelsAllergie } from "@/lib/allergies";
import { useAuth } from "@/lib/auth-context";
import dynamic from "next/dynamic";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);
import { PrescriptionPDF } from "./PrescriptionPDF";

interface Med {
  id: number;
  name: string;
  dosage: string;
  duration: string;
  posology: string;
}

export function PrescriptionEditor() {
  const { currentPatient } = usePatient();
  const { user } = useAuth();
  const [meds, setMeds] = useState<Med[]>([]);
  const [currentMed, setCurrentMed] = useState({ name: "", dosage: "", duration: "", posology: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const favoris = [
    "Amoxicilline",
    "Paracétamol",
    "Ibuprofène",
    "Bain de bouche Eludril",
    "Prednisolone"
  ];

  const addMed = () => {
    if (currentMed.name) {
      setMeds([...meds, { ...currentMed, id: Date.now() }]);
      setCurrentMed({ name: "", dosage: "", duration: "", posology: "" });
    }
  };

  const removeMed = (id: number) => {
    setMeds(meds.filter(m => m.id !== id));
  };

  // Modèle d'ordonnance après extraction ou pose d'implant.
  //
  // Ce bouton s'appelait « Copilot IA » et le commentaire du code disait
  // « Simulation Copilot IA » : il insère en réalité trois lignes fixes,
  // identiques pour tout patient. Sous un nom d'IA, un praticien peut croire
  // que le logiciel a tenu compte du dossier, des allergies ou du poids — il
  // n'en fait rien. C'est un modèle à relire, et il est nommé comme tel.
  const appliquerModelePostExtraction = () => {
    setMeds([
      { id: Date.now(), name: "Amoxicilline", dosage: "1g", duration: "6 jours", posology: "1 comprimé matin et soir au cours des repas" },
      { id: Date.now() + 1, name: "Paracétamol", dosage: "1000mg", duration: "3 jours", posology: "1 comprimé en cas de douleur, max 3/jour" },
      { id: Date.now() + 2, name: "Bain de bouche Eludril", dosage: "Flacon", duration: "7 jours", posology: "1 bain de bouche 2 fois par jour, après brossage" }
    ]);
  };

  const rappels = rappelsAllergie(currentPatient?.allergies, meds);

  const handleSave = async () => {
    if (!currentPatient || meds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentPatient.id,
          medications: meds.map(({ id, ...rest }) => rest),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'enregistrement.");
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER BAR - DASHBOARD STYLE */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Bouton « Retour » supprimé : il n'avait aucune action et il n'y
              a nulle part où revenir, la navigation se fait par le menu. */}
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" /> Ordonnance
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
           {/* « Modèles récents » supprimé : aucun historique de modèles
               n'existe derrière ce bouton, qui n'avait pas d'action. */}
          <button
            onClick={appliquerModelePostExtraction}
            title="Insère un modèle fixe, identique pour tout patient. À relire et à adapter."
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-sm transition-colors shadow-md shadow-slate-900/20"
          >
            <FileText className="h-4 w-4" /> Modèle post-extraction
          </button>
          
          {currentPatient && meds.length > 0 ? (
            <PDFDownloadLink
              document={
                <PrescriptionPDF
                  patientName={currentPatient.name}
                  practitionerName={user.fullName}
                  medications={meds}
                />
              }
              fileName={`Ordonnance_${currentPatient.name}.pdf`}
            >
              {/* @ts-ignore */}
              {({ loading }) => (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-sm transition-colors shadow-md disabled:opacity-60",
                    saved ? "bg-emerald-600 text-white shadow-emerald-900/20" : "bg-[#1E3A8A] hover:bg-blue-900 text-white shadow-blue-900/20"
                  )}
                >
                  <Save className="h-4 w-4" /> <Printer className="h-4 w-4" />
                  {saving ? "Enregistrement…" : loading ? "Génération…" : saved ? "Ordonnance Enregistrée" : "Sauvegarder & Imprimer"}
                </button>
              )}
            </PDFDownloadLink>
          ) : (
            <button
              disabled
              title={!currentPatient ? "Sélectionnez un patient (étape Accueil)" : "Ajoutez au moins un médicament"}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-300 text-white px-5 py-2.5 rounded-sm cursor-not-allowed"
            >
              <Save className="h-4 w-4" /> <Printer className="h-4 w-4" /> Sauvegarder & Imprimer
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN - EDITOR */}
        <div className="space-y-6">
          {/* Patient Selection */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" /> Identification Patient
            </h3>
            {currentPatient ? (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded p-3">
                <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                  {currentPatient.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{currentPatient.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Patient actif</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">Sélectionnez un patient depuis l'étape Accueil pour rédiger une ordonnance.</p>
            )}
          </div>

          {/* Prescription Form */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2">
              <Pill className="h-4 w-4 text-emerald-500" /> Prescription Médicamenteuse
            </h3>
            
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400" /> Favoris fréquents
              </p>
              <div className="flex flex-wrap gap-2">
                {favoris.map(fav => (
                  <button 
                    key={fav}
                    onClick={() => setCurrentMed({ ...currentMed, name: fav })}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors"
                  >
                    {fav}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Médicament</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Amoxicilline"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={currentMed.name}
                    onChange={(e) => setCurrentMed({ ...currentMed, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dosage</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 500mg"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={currentMed.dosage}
                    onChange={(e) => setCurrentMed({ ...currentMed, dosage: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Durée</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 7 jours"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={currentMed.duration}
                    onChange={(e) => setCurrentMed({ ...currentMed, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Posologie / Instructions</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 1 matin et soir"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={currentMed.posology}
                    onChange={(e) => setCurrentMed({ ...currentMed, posology: e.target.value })}
                  />
                </div>
              </div>

              <button 
                onClick={addMed}
                disabled={!currentMed.name}
                className="w-full bg-slate-900 hover:bg-black text-white px-4 py-3 rounded text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Ajouter à la liste
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - A4 PREVIEW */}
        <div className="bg-slate-100 p-6 rounded-sm border border-slate-200 flex items-start justify-center overflow-auto min-h-[600px]">
          {/* A4 Paper */}
          <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-xl p-10 md:p-14 relative font-serif text-slate-800">
             {/* Header */}
             <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
               <h1 className="text-2xl font-bold uppercase tracking-wider text-[#1E3A8A]">{user.fullName}</h1>
               <p className="text-sm font-semibold tracking-widest mt-1">{user.roleLabel}</p>
               <div className="mt-4 text-xs space-y-1 text-slate-600">
                 <p>Cabinet Dentaire du Cap Vert — Dakar, Sénégal</p>
               </div>
             </div>

             {/* Date */}
             <div className="text-right mb-12">
               <p className="text-sm italic">Dakar, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
             </div>

             {/* Patient */}
             <div className="mb-12">
               <p className="text-sm font-bold">
                 Prescription pour : <span className="font-normal border-b border-dotted border-slate-400 pb-0.5 inline-block min-w-[250px]">{currentPatient?.name || ""}</span>
               </p>
             </div>

             {/* Prescription Content */}
             <div className="space-y-6">
                {meds.length === 0 && (
                  <div className="text-center py-20 text-slate-300 italic">
                    L'ordonnance est vide. Ajoutez des médicaments.
                  </div>
                )}
                {meds.map((med, index) => (
                  <div key={med.id} className="group relative pr-10">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-lg">{med.name} {med.dosage}</span>
                    </div>
                    <div className="pl-4 mt-1 space-y-0.5 text-sm">
                      <p>QSP : {med.duration}</p>
                      <p className="italic">{med.posology}</p>
                    </div>
                    {/* Retrait d'une ligne. Le bouton n'apparaissait qu'au
                        survol : sur une tablette, un praticien ayant saisi le
                        mauvais médicament ne pouvait pas le retirer de
                        l'ordonnance. Toujours visible à l'écran, jamais
                        imprimé (print:hidden). */}
                    <button
                      onClick={() => removeMed(med.id)}
                      title={`Retirer ${med.name} de l'ordonnance`}
                      className="absolute right-0 top-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-full print:hidden transition-colors"
                    >
                      X
                    </button>
                  </div>
                ))}
             </div>

             {/* Signature Space */}
             <div className="absolute bottom-20 right-20 text-center">
               <p className="text-sm font-bold mb-16">Signature</p>
               <p className="text-xs text-slate-400 italic">Cachet & Signature</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
