"use client";

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Globe, History, Brain, FileText, Pill, Activity, CheckCircle2, Save, Sparkles, Languages, Cpu, Zap, Database, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceDictation() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"note" | "ordonnance" | "plan">("note");
  const [language, setLanguage] = useState<"FR" | "EN">("FR");
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dentiste_lite_dictations");
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("dentiste_lite_dictations", JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = true;
        reco.interimResults = true;
        reco.lang = language === "FR" ? "fr-FR" : "en-US";
        
        reco.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };
        
        reco.onend = () => {
          setIsRecording(false);
        };
        
        setRecognition(reco);
      }
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      if (recognition) recognition.stop();
      setIsRecording(false);
      if (transcript) {
         setHistory(prev => [{
            id: Date.now(), 
            text: transcript, 
            category: activeCategory, 
            date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
         }, ...prev]);
      }
    } else {
      setTranscript("");
      if (recognition) recognition.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER BAR - DASHBOARD STYLE */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-600 text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Dictée Vocale</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reconnaissance vocale du navigateur</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <div className="text-right">
              <p className="text-[9px] font-bold text-blue-600 uppercase">{user.roleLabel}</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xs">
              {user.fullName.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN DICTATION PANEL */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col min-h-[550px]">
            <div className="bg-[#1E3A8A] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-amber-400" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Dictée Vocale</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setLanguage("FR")}
                  className={cn("px-3 py-1 rounded-sm text-[10px] font-bold transition-all border", language === "FR" ? "bg-white text-blue-900 border-white" : "bg-blue-800/50 text-blue-200 border-blue-700")}
                >
                  FR
                </button>
                <button 
                  onClick={() => setLanguage("EN")}
                  className={cn("px-3 py-1 rounded-sm text-[10px] font-bold transition-all border", language === "EN" ? "bg-white text-blue-900 border-white" : "bg-blue-800/50 text-blue-200 border-blue-700")}
                >
                  EN
                </button>
                <button className="ml-2 text-blue-200 hover:text-white transition-colors">
                  <Activity className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col space-y-8">
              <div className="flex gap-4">
                {[
                  { id: "note", label: "Note Clinique", icon: FileText },
                  { id: "ordonnance", label: "Ordonnance", icon: Pill },
                  { id: "plan", label: "Plan de Soins", icon: Activity },
                ].map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest border transition-all",
                      activeCategory === cat.id 
                        ? "bg-blue-50 border-blue-600 text-blue-900 shadow-md translate-y-[-2px]" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <cat.icon className={cn("h-4 w-4", activeCategory === cat.id ? "text-blue-600" : "text-slate-300")} />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* TRANSCRIBER AREA */}
              <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-sm p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.div 
                      key="recording"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8 w-full z-10"
                    >
                      <div className="flex justify-center gap-1.5 items-end h-16">
                        {[1,2,3,4,5,6,7,8,9,10,9,8,7,6,5,4,3,2,1].map((h, i) => (
                          <motion.div 
                            key={i}
                            animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.03 }}
                            className="w-1.5 bg-blue-600 rounded-full"
                          />
                        ))}
                      </div>
                      <div className="space-y-2">
                        <p className="text-slate-900 text-lg font-bold leading-relaxed max-w-lg mx-auto">
                          "{transcript || "Parlez maintenant..."}"
                        </p>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest animate-pulse">
                          {transcript ? "Transcription en cours..." : "Acquisition audio..."}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6 z-10"
                    >
                      <div className="h-20 w-20 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <Mic className="h-10 w-10 text-slate-200" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">En attente d'activation vocale...</h4>
                        <p className="text-xs text-slate-400 mt-2 font-medium">
                          Le texte dicté s'affichera ici en temps réel...
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Background watermark */}
                <Brain className="absolute -bottom-10 -right-10 h-64 w-64 text-slate-200/30 rotate-12" />
              </div>

              <div className="flex justify-center pt-4">
                <button 
                  onClick={toggleRecording}
                  className={cn(
                    "group relative flex items-center gap-4 px-10 py-5 rounded-full text-sm font-black uppercase tracking-widest transition-all shadow-2xl overflow-hidden",
                    isRecording 
                      ? "bg-rose-600 text-white shadow-rose-900/30" 
                      : "bg-blue-600 text-white shadow-blue-900/30 hover:scale-105"
                  )}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isRecording ? (
                    <>
                      <div className="h-2 w-2 rounded-full bg-white animate-ping" />
                      Arrêter la dictée
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5" /> Démarrer la dictée vocale
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* STATUS BAR */}
            <div className="bg-slate-900 p-6 flex flex-wrap gap-y-4 gap-x-12 items-center border-t border-slate-800">
               <div className="space-y-1">
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Reconnaissance</p>
                 <div className="flex items-center gap-2">
                   <div className={cn("h-1.5 w-1.5 rounded-full", recognition ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                   <p className="text-[10px] font-black text-white uppercase tracking-tight">
                     {recognition ? "Navigateur Natif" : "Non disponible"}
                   </p>
                 </div>
               </div>
               <div className="space-y-1">
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Langue active</p>
                 <p className="text-[10px] font-black text-white uppercase tracking-tight">
                   {language === "FR" ? "🇫🇷 Français" : "🇺🇸 English"}
                 </p>
               </div>
               <div className="space-y-1">
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Sauvegarde</p>
                 <div className="flex items-center gap-2">
                   <Database className="h-3 w-3 text-blue-400" />
                   <p className="text-[10px] font-black text-white uppercase tracking-tight">Local (navigateur)</p>
                 </div>
               </div>
               <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-900/50 rounded border border-blue-800">
                 <Cpu className="h-3.5 w-3.5 text-blue-400" />
                 <span className="text-[9px] font-bold text-blue-100 uppercase tracking-widest">
                   Reconnaissance vocale native — aucune correction IA appliquée
                 </span>
               </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR - HISTORY & AI */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-[300px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Dernières Dictées</h4>
              </div>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[8px] font-black uppercase">{history.length} Dictées</span>
            </div>
            
            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                 <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                   <MicOff className="h-5 w-5 text-slate-200" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune dictée enregistrée.</p>
                   <p className="text-[9px] font-medium text-slate-300 mt-1">Synchronisé avec le dossier patient</p>
                 </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.map(item => (
                  <div key={item.id} className="p-3 border border-slate-100 rounded bg-slate-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{item.category}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{item.date}</span>
                    </div>
                    <p className="text-xs text-slate-700 italic">"{item.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#1E3A8A] p-6 rounded-sm text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-150 transition-transform duration-1000" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-800 rounded flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-blue-300" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-widest">À propos de ce module</h4>
              </div>

              <div className="bg-blue-900/50 p-4 rounded-sm border border-blue-700/50 space-y-3">
                 <div className="flex items-center justify-between">
                   <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Fonctionnement réel</p>
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                 </div>
                 <p className="text-[11px] font-medium leading-relaxed italic text-blue-100">
                   "La transcription utilise la reconnaissance vocale native de votre navigateur — aucune correction ni structuration par IA n'est appliquée au texte."
                 </p>
              </div>

              <p className="text-[10px] text-blue-200 leading-relaxed">
                L'historique est enregistré localement dans ce navigateur uniquement (pas encore synchronisé avec le dossier patient en base).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
