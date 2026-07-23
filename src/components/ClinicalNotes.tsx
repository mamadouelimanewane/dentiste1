"use client";

import React, { useState, useEffect } from "react";
import { Save, Zap, Check, StickyNote, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { useToast } from "@/lib/ToastContext";

interface ClinicalNotesProps {
  phaseId: number;
}

export function ClinicalNotes({ phaseId }: ClinicalNotesProps) {
  const { currentPatient } = usePatient();
  const { toast } = useToast();
  
  const [currentNote, setCurrentNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  // Load notes from DB
  useEffect(() => {
    async function loadNotes() {
      if (!currentPatient) {
        setCurrentNote("");
        return;
      }
      try {
        const res = await fetch(`/api/clinical-notes?patientId=${currentPatient.id}`);
        if (res.ok) {
          const data = await res.json();
          // Find the latest note of this phase type (we can use phaseId as type)
          const phaseNote = data.notes?.find((n: any) => n.type === `phase_${phaseId}`);
          if (phaseNote) {
            setCurrentNote(phaseNote.content);
          } else {
            setCurrentNote("");
          }
        }
      } catch (err) {
        console.error("Erreur chargement notes", err);
      }
    }
    loadNotes();
  }, [phaseId, currentPatient]);

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

        <div className="flex-1 relative">
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Observations cliniques..."
            disabled={!currentPatient}
            className="w-full h-full bg-slate-50 border-none rounded-none p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 outline-none resize-none leading-relaxed italic"
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
            {isSaving ? "Sync..." : status === 'success' ? "Archivé" : "Sauvegarder"}
            {status === 'success' ? <Check className="h-4 w-4" /> : !isSaving && <Save className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
