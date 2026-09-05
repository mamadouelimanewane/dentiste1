"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Save, Zap, Check, StickyNote, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { useToast } from "@/lib/ToastContext";

interface ClinicalNotesProps {
  phaseId: number;
}

interface NoteClinique {
  id: string;
  content: string;
  type: string | null;
  created_at: string;
  updated_at: string | null;
  auteur: string | null;
}

// « phase_3 » ne dit rien au praticien qui relit le dossier six mois plus tard.
const LIBELLES_PHASE: Record<string, string> = {
  phase_1: "Accueil",
  phase_2: "Diagnostic",
  phase_3: "Soins",
  phase_4: "Suivi",
  general: "Observation",
};

function libellePhase(type: string | null) {
  if (!type) return "Observation";
  return LIBELLES_PHASE[type] || type.replace("phase_", "Phase ");
}

function dateLisible(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ClinicalNotes({ phaseId }: ClinicalNotesProps) {
  const { currentPatient } = usePatient();
  const { toast } = useToast();
  
  const [currentNote, setCurrentNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');
  const [notes, setNotes] = useState<NoteClinique[]>([]);
  const [chargeErreur, setChargeErreur] = useState<string | null>(null);

  // Historique complet du dossier.
  //
  // L'écran chargeait la dernière note de la phase dans la zone de saisie,
  // puis chaque « sauvegarder » faisait un POST — donc une NOUVELLE ligne.
  // On croyait corriger sa note, on en créait une seconde ; et les notes des
  // séances précédentes n'étaient jamais affichées. Un dossier de soins qui
  // ne montre que son dernier paragraphe n'est pas un dossier.
  //
  // La zone de saisie ne sert donc plus qu'à ajouter une observation datée,
  // et tout ce qui a été écrit reste lisible en dessous, signé.
  const chargerNotes = useCallback(async () => {
    if (!currentPatient) {
      setNotes([]);
      setChargeErreur(null);
      return;
    }
    try {
      const res = await fetch(`/api/clinical-notes?patientId=${currentPatient.id}`);
      const data = await res.json();
      if (res.ok) {
        setNotes(data.notes || []);
        setChargeErreur(null);
      } else {
        // Un échec laissait la liste vide : le dossier paraissait vierge.
        setChargeErreur(data.error || "Les notes de ce dossier n'ont pas pu être chargées. Ne considérez pas ce dossier comme vierge.");
      }
    } catch {
      setChargeErreur("Réseau indisponible : les notes de ce dossier n'ont pas pu être chargées.");
    }
  }, [currentPatient]);

  useEffect(() => {
    chargerNotes();
  }, [chargerNotes]);

  const saveNote = async () => {
    if (!currentPatient) {
      toast("Veuillez sélectionner ou créer un patient d'abord.", "error");
      return;
    }
    if (!currentNote.trim()) {
      toast("La note est vide.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/clinical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentPatient.id,
          content: currentNote,
          type: `phase_${phaseId}`,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

      setStatus('success');
      toast("Note clinique sauvegardée", "success");
      // Le champ se vide : la note vient d'entrer au dossier, elle s'affiche
      // désormais dans l'historique. La laisser en place invitait à la
      // réenregistrer, ce qui la dupliquait.
      setCurrentNote("");
      await chargerNotes();
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      toast("Échec de la sauvegarde", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden flex flex-col min-h-[350px]">
      {/* Header - Card Style */}
      <div className="bg-[#0F172A] p-5 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Notes Cliniques</h3>
        </div>
        <div className="h-8 w-8 border border-slate-700 bg-slate-800 rounded flex items-center justify-center">
          <span className="text-xs font-bold text-slate-400">{phaseId}</span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col space-y-4 relative">
        {!currentPatient && (
          <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
              <StickyNote className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Prêt à documenter ?</p>
            <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
              Sélectionnez un patient depuis l'agenda ou créez un nouveau dossier pour commencer à saisir vos observations cliniques.
            </p>
          </div>
        )}

        {chargeErreur && (
          <div className="flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {chargeErreur}
          </div>
        )}

        <div className="relative">
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Nouvelle observation clinique..."
            disabled={!currentPatient}
            rows={6}
            className="w-full bg-slate-50 border-none rounded-none p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 outline-none resize-none leading-relaxed italic"
          />
          {/* Subtle watermark style lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex flex-col gap-[24px] p-4 pt-10">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-px bg-slate-900 w-full" />)}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Données</span>
          </div>
          <button 
            onClick={saveNote}
            disabled={isSaving || !currentPatient}
            className={cn(
              "h-10 px-6 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm",
              status === 'success' 
                ? "bg-emerald-600 text-white" 
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            )}
          >
            {isSaving ? "Sync..." : status === 'success' ? "Archivé" : "Ajouter au dossier"}
            {status === 'success' ? <Check className="h-4 w-4" /> : !isSaving && <Save className="h-4 w-4" />}
          </button>
        </div>

        {/* Historique du dossier : ce qui a été écrit reste lisible, daté et
            signé. C'est ce qui manquait entièrement. */}
        {currentPatient && (
          <div className="border-t border-slate-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Historique du dossier
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                {notes.length} note{notes.length > 1 ? "s" : ""}
              </span>
            </div>

            {notes.length === 0 && !chargeErreur && (
              <p className="text-xs text-slate-400 italic">Aucune note enregistrée pour ce patient.</p>
            )}

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {notes.map((n) => (
                <div key={n.id} className="border border-slate-200 rounded-sm bg-white">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-700">
                      {libellePhase(n.type)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{dateLisible(n.created_at)}</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {n.auteur ? `Par ${n.auteur}` : "Auteur non renseigné"}
                    </span>
                    {n.updated_at && n.updated_at !== n.created_at && (
                      <span className="text-[10px] font-bold text-amber-700">
                        Rectifiée le {dateLisible(n.updated_at)}
                      </span>
                    )}
                  </div>
                  <p className="px-3 py-2 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {n.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
