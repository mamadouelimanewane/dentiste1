"use client";

import React, { useState, useEffect } from "react";
import { Save, Zap, FileText, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalNotesProps {
  phaseId: number;
}

export function ClinicalNotes({ phaseId }: ClinicalNotesProps) {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [currentNote, setCurrentNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  useEffect(() => {
    const saved = localStorage.getItem("dentiste_lite_notes");
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotes(parsed);
      setCurrentNote(parsed[phaseId] || "");
    }
  }, [phaseId]);

  const saveNote = () => {
    setIsSaving(true);
    const newNotes = { ...notes, [phaseId]: currentNote };
    setNotes(newNotes);
    localStorage.setItem("dentiste_lite_notes", JSON.stringify(newNotes));
    
    setTimeout(() => {
      setIsSaving(false);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    }, 800);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[320px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notes Cliniques</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Sync</span>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col space-y-4">
        <textarea
          value={currentNote}
          onChange={(e) => setCurrentNote(e.target.value)}
          placeholder="Saisissez les observations pour cette phase..."
          className="flex-1 w-full bg-white border border-slate-200 rounded-md p-3 text-xs font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none leading-relaxed"
        />
        
        <button 
          onClick={saveNote}
          disabled={isSaving}
          className={cn(
            "h-10 w-full rounded font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            status === 'success' 
              ? "bg-emerald-600 text-white" 
              : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          )}
        >
          {isSaving ? "Enregistrement..." : status === 'success' ? "Note Enregistrée" : "Sauvegarder"}
          {status === 'success' ? <Check className="h-3.5 w-3.5" /> : !isSaving && <Save className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

