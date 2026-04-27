"use client";

import React, { useState, useEffect } from "react";
import { Save, Zap, FileText, Check, StickyNote } from "lucide-react";
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
    <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden flex flex-col min-h-[350px]">
      {/* Header - Card Style */}
      <div className="bg-[#1E3A8A] p-5 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-blue-400" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Notes de Séance</h3>
        </div>
        <div className="h-6 w-6 border border-slate-700 rounded flex items-center justify-center">
          <span className="text-[9px] font-bold text-slate-500">{phaseId}</span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col space-y-4">
        <div className="flex-1 relative">
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Observations cliniques..."
            className="w-full h-full bg-slate-50 border-none rounded-none p-4 text-xs font-bold text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none resize-none leading-relaxed italic"
          />
          {/* Subtle watermark style lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex flex-col gap-[24px] p-4 pt-10">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-px bg-slate-900 w-full" />)}
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-emerald-500" />
            <span className="text-[9px] font-bold text-blue-700 uppercase tracking-widest">Auto-Archive</span>
          </div>
          <button 
            onClick={saveNote}
            disabled={isSaving}
            className={cn(
              "h-8 px-5 rounded-sm font-bold text-[9px] uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm",
              status === 'success' 
                ? "bg-emerald-600 text-white" 
                : "bg-slate-900 text-white hover:bg-black disabled:opacity-50"
            )}
          >
            {isSaving ? "Sync..." : status === 'success' ? "Archivé" : "Sauvegarder"}
            {status === 'success' ? <Check className="h-3 w-3" /> : !isSaving && <Save className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}


