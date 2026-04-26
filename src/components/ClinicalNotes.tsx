"use client";

import React, { useState, useEffect } from "react";
import { StickyNote, Save, Trash2, Cloud, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClinicalNotesProps {
  phaseId: number;
}

export function ClinicalNotes({ phaseId }: ClinicalNotesProps) {
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [currentNote, setCurrentNote] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load notes from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("dentiste_lite_notes");
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotes(parsed);
      setCurrentNote(parsed[phaseId] || "");
    }
  }, [phaseId]);

  const saveNote = () => {
    const newNotes = { ...notes, [phaseId]: currentNote };
    setNotes(newNotes);
    localStorage.setItem("dentiste_lite_notes", JSON.stringify(newNotes));
    
    // Auto-Sync with Elite DB
    if (currentNote) {
      syncWithMainDB();
    }
  };

  const syncWithMainDB = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    
    try {
      // Simulate API call with 10% chance of failure for testing
      const isError = Math.random() < 0.1; 
      await new Promise((resolve, reject) => setTimeout(isError ? reject : resolve, 1500));
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const clearNote = () => {
    setCurrentNote("");
    const newNotes = { ...notes, [phaseId]: "" };
    setNotes(newNotes);
    localStorage.setItem("dentiste_lite_notes", JSON.stringify(newNotes));
    setSyncStatus('idle');
  };

  return (
    <div className="bg-amber-50 rounded-3xl p-6 border border-amber-200 shadow-sm space-y-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
        <StickyNote className="h-16 w-16 text-amber-600" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <h3 className="font-black text-amber-900 uppercase text-[10px] tracking-widest">Post-it Clinique (Phase {phaseId})</h3>
        </div>
        <button 
          onClick={syncWithMainDB}
          disabled={isSyncing || !currentNote}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all shadow-sm",
            syncStatus === 'success' ? "bg-emerald-500 text-white" : 
            syncStatus === 'error' ? "bg-rose-500 text-white animate-shake" : 
            "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
          )}
        >
          {isSyncing ? (
            <Cloud className="h-3 w-3 animate-bounce" />
          ) : syncStatus === 'success' ? (
            <Check className="h-3 w-3" />
          ) : syncStatus === 'error' ? (
            <Zap className="h-3 w-3" />
          ) : (
            <Cloud className="h-3 w-3" />
          )}
          {isSyncing ? "Sync..." : syncStatus === 'success' ? "Sync OK" : syncStatus === 'error' ? "Échec Sync" : "Sync Elite"}
        </button>
      </div>

      {syncStatus === 'error' && (
        <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest text-center animate-pulse">
          Problème de connexion au serveur Elite
        </p>
      )}

      <textarea
        value={currentNote}
        onChange={(e) => setCurrentNote(e.target.value)}
        placeholder="Notez ici les points importants (antécédents, doléance, observation...)"
        className="w-full h-32 bg-transparent border-none focus:ring-0 text-sm font-medium text-amber-900 placeholder:text-amber-300 resize-none no-scrollbar"
      />

      <div className="flex justify-between items-center pt-2 border-t border-amber-200">
        <button 
          onClick={clearNote}
          className="p-2 rounded-lg text-amber-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
          title="Effacer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button 
          onClick={saveNote}
          className="flex items-center gap-2 px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm"
        >
          <Save className="h-3 w-3" /> Sauvegarder Note
        </button>
      </div>
    </div>
  );
}
