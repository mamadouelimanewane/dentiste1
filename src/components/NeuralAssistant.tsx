"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Calendar,
  User,
  CheckCircle2,
  X,
  Brain,
  Zap,
  Send,
  Loader2,
  ArrowRight,
  ShieldAlert,
  Activity,
  FileSearch,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CommandAction {
  id: string;
  type: "RDV" | "PATIENT" | "NOTE" | "BILLING" | "RADIO" | "WHATSAPP";
  content: string;
  suggestion?: string;
  status: "pending" | "confirmed" | "executing" | "done";
  meta?: any;
}

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  type?: "default" | "insight";
}

export function NeuralAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [commandQueue, setCommandQueue] = useState<CommandAction[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "Bonjour Docteur Ndiaye. Le Neural Core est opérationnel. Parlez ou écrivez votre commande.",
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track how many bot messages have been spoken to avoid re-reading on re-render
  const spokenCountRef = useRef(1); // start at 1 to skip welcome message
  // Use a ref to always read the latest transcript inside async callbacks
  const transcriptRef = useRef("");

  const currentPatient = {
    name: "Mamadou Diallo",
    id: "SN-16499-X",
    lastRadio: "24 Jan 2026",
  };

  // --- Auto-scroll ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // --- Speak only NEW bot messages (not on initial render) ---
  useEffect(() => {
    const botMessages = chatHistory.filter((m) => m.role === "bot");
    if (botMessages.length > spokenCountRef.current) {
      const newMsg = botMessages[botMessages.length - 1];
      if (typeof window !== "undefined" && window.speechSynthesis && newMsg.text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(newMsg.text);
        utterance.lang = "fr-FR";
        utterance.rate = 1.05;
        utterance.pitch = 1;
        // Small delay so the browser finishes rendering before speaking
        setTimeout(() => window.speechSynthesis.speak(utterance), 200);
      }
      spokenCountRef.current = botMessages.length;
    }
  }, [chatHistory]);

  // --- Speech Recognition: create fresh instance each start to avoid stale state ---
  const buildRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = "fr-FR";
    r.maxAlternatives = 3;
    r.onresult = (event: any) => {
      let final = ""; let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        event.results[i].isFinal
          ? (final += event.results[i][0].transcript)
          : (interim += event.results[i][0].transcript);
      }
      const text = final || interim;
      setTranscript(text);
      transcriptRef.current = text;
    };
    r.onend = () => {
      setIsRecording(false);
      // Wait 150ms so final onresult fires before we read the ref
      setTimeout(() => {
        const captured = transcriptRef.current.trim();
        if (captured) {
          processCommand(captured);
          transcriptRef.current = "";
          setTranscript("");
        }
      }, 150);
    };
    r.onerror = (ev: any) => {
      if (ev.error !== "no-speech") console.error("Voice error:", ev.error);
      setIsRecording(false);
    };
    return r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Toggle recording ---
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      transcriptRef.current = "";
      setTranscript("");
      const rec = buildRecognition();
      if (!rec) return;
      recognitionRef.current = rec;
      try {
        rec.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Could not start recognition:", e);
        setIsRecording(false);
      }
    }
  }, [isRecording, buildRecognition]);

  // --- Medical NLP Engine ---
  const processCommand = useCallback(async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setTranscript("");
    transcriptRef.current = "";
    setIsProcessing(true);
    setChatHistory((prev) => [...prev, { role: "user", text: cleanText }]);

    try {
      await new Promise((r) => setTimeout(r, 800));
      const L = cleanText.toLowerCase();
      let botResponse = `Je n'ai pas identifié : "${cleanText}". Exemples : "j'ai une carie", "prendre rendez-vous", "quel est le tarif d'une extraction", "analyse radio".`;

      // URGENCES & DOULEURS
      if (/douleur|j'ai mal|ça fait mal|je souffre|urgence|abcès|abces|gonfle|gonflement|saigne|cassée|cassee|traumatisme/.test(L)) {
        botResponse = "Situation urgente détectée. Fiche d'urgence créée et praticien notifié. Le patient doit être pris en charge immédiatement.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Ouvrir fiche urgence & alerter praticien", status: "pending", meta: { priority: "URGENT" } }, ...p]);

      // CARIES & PATHOLOGIES
      } else if (/carie|caries|cavité|cavite|trou dans la dent|dent abîm|dent noire|dent pourrie|cariée|decalcif|déminéralisation/.test(L)) {
        botResponse = "Carie dentaire identifiée. Protocole : Radio diagnostique → Évaluation profondeur → Obturation composite ou dévitalisation si atteinte pulpaire.";
        setChatHistory((p) => [...p, { role: "bot", text: "PROTOCOLE CARIE : Radio rétro-alvéolaire → Fraisage → Obturation composite / Dévitalisation si pulpe atteinte → Couronne si nécessaire", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RADIO", content: cleanText, suggestion: "Lancer analyse radio IA + devis traitement", status: "pending", meta: { priority: "High" } }, ...p]);

      // EXTRACTION
      } else if (/extraction|arracher|enlever la dent|dent de sagesse|sagesse|avulsion|dent à extraire/.test(L)) {
        botResponse = "Extraction notée. Protocole : Anesthésie locale → Avulsion → Sutures si nécessaire → Antibiotiques post-op. Devis : 40 000 FCFA.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Générer devis + consentement extraction", status: "pending" }, ...p]);

      // DETARTRAGE / NETTOYAGE
      } else if (/détartrage|detartrage|nettoyage|tartre|polissage|hygiène dentaire|hygiene dentaire/.test(L)) {
        botResponse = "Détartrage programmé. Prophylaxie complète avec polissage incluse. Tarif : 25 000 FCFA. Durée estimée : 45 min.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: "Programmer séance détartrage", status: "pending" }, ...p]);

      // DEVITALISATION / ENDODONTIE
      } else if (/dévitalisation|devitalisation|traitement de canal|endodontie|canal radiculaire|pulpite|nécrose|necrose/.test(L)) {
        botResponse = "Traitement endodontique (dévitalisation) requis. Protocole en 2 à 3 séances. Tarif : 80 000 à 150 000 FCFA selon le nombre de canaux.";
        setChatHistory((p) => [...p, { role: "bot", text: "PROTOCOLE ENDODONTIE : Anesthésie → Accès caméral → Mise en forme → Irrigation NaOCl → Obturation Gutta → Couronne de recouvrement", type: "insight" }]);

      // IMPLANT
      } else if (/implant|implants|vis dentaire|ostéo-intégration|pose d'implant/.test(L)) {
        botResponse = "Implant dentaire noté. Tarif : 350 000 à 500 000 FCFA selon marque. Délai osseux : 3 à 6 mois. Souhaitez-vous une simulation ?";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Générer devis implant + simulation 3D", status: "pending" }, ...p]);

      // PROTHESE / COURONNE / BRIDGE
      } else if (/couronne|bridge|prothèse|prothese|dentier|appareil dentaire|facette|onlay|inlay/.test(L)) {
        botResponse = "Restauration prothétique notée. Je prépare la consultation avec prise d'empreinte. Souhaitez-vous une simulation Smile Design ?";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Préparer consultation prothétique", status: "pending" }, ...p]);

      // BLANCHIMENT
      } else if (/blanchiment|blanchir|éclaircissement|eclaircissement|dents jaunes|dents blanches/.test(L)) {
        botResponse = "Blanchiment disponible : Cabinet (résultat immédiat, 75 000 FCFA) ou gouttières domicile (45 000 FCFA). Contre-indications à vérifier.";

      // ORTHODONTIE
      } else if (/orthodontie|appareil|bagues|gouttières orthodontiques|gouttiere|aligneur|malposition|dents croches/.test(L)) {
        botResponse = "Traitement orthodontique noté. Bagues fixes : à partir de 250 000 FCFA. Aligneurs transparents : à partir de 350 000 FCFA. Bilan initial requis.";

      // ANESTHESIE
      } else if (/anesthésie|anesthesie|piqûre|piqure|endormir|j'ai peur/.test(L)) {
        botResponse = "Anesthésie locale (Xylocaïne 2% adrénalinée) notée au dossier. Vérification allergie avant injection. Technique : infiltration ou tronculaire selon zone.";

      // ORDONNANCE / MEDICAMENTS
      } else if (/ordonnance|médicament|medicament|antibiotique|antidouleur|amoxicilline|ibuprofène|paracétamol|prescrire|prescription/.test(L)) {
        botResponse = "Ordonnance préparée. Post-op standard : Amoxicilline 1g × 2/j × 7j + Ibuprofène 400mg × 3/j × 5j. Allergie aux pénicillines ? Prévoir Azithromycine.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Ouvrir éditeur d'ordonnance", status: "pending" }, ...p]);

      // RADIO / IMAGERIE
      } else if (/radio|radiographie|panoramique|pano|cbct|scanner|rx|rétro-alvéolaire|retroalveolaire|imagerie/.test(L)) {
        botResponse = "Analyse radiographique IA lancée. Modèle Neural Imaging v4.2 actif. Résultats dans quelques secondes.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RADIO", content: cleanText, suggestion: "Ouvrir Radio IA Lab", status: "pending" }, ...p]);

      // RDV
      } else if (/rendez-vous|rdv|consulter|consultation|prendre rdv|appointment/.test(L)) {
        const t = L.match(/(\d{1,2})\s*h/); const time = t ? `${t[1]}h00` : "10h00";
        const day = /demain/.test(L) ? "demain" : /lundi/.test(L) ? "lundi" : /mardi/.test(L) ? "mardi" : /mercredi/.test(L) ? "mercredi" : /jeudi/.test(L) ? "jeudi" : /vendredi/.test(L) ? "vendredi" : "prochainement";
        botResponse = `RDV enregistré pour ${day} à ${time}. Confirmation WhatsApp envoyée.`;
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: `Créer RDV ${day} à ${time}`, status: "pending" }, ...p]);

      // DOSSIER PATIENT
      } else if (/dossier|patient|fiche|historique|antécédent|antecedent/.test(L)) {
        botResponse = `Dossier ${currentPatient.name} — ID: ${currentPatient.id}. Dernière radio : ${currentPatient.lastRadio}.`;
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Ouvrir Fiche Complète", status: "pending" }, ...p]);

      // WHATSAPP
      } else if (/whatsapp|message|sms|envoyer|notifier|rappel/.test(L)) {
        botResponse = "Hub Communication ouvert. Mamadou Dia attend une confirmation pour mardi. Validation ?";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "WHATSAPP", content: cleanText, suggestion: "Envoyer confirmation WhatsApp", status: "pending" }, ...p]);

      // BASE GÉNÉRALE
      } else {
        const kb = [
          { r: /horaire|heure|ouvert|ferme|disponible|quand/, a: "Le cabinet est ouvert lundi–vendredi 8h–19h et samedi 9h–13h." },
          { r: /adresse|situé|lieu|où|localisation/, a: "Cabinet situé au Plateau, Rue de Thiong, Dakar." },
          { r: /tarif|prix|coût|combien/, a: "Consultation 15k · Détartrage 25k · Extraction 40k · Implant 350k FCFA." },
          { r: /bonjour|salut|bonsoir|hello/, a: "Bonjour Docteur ! Neural Core actif. Quelle est votre commande ?" },
          { r: /merci|parfait|ok|super|bien/, a: "Avec plaisir Docteur. Y a-t-il autre chose ?" },
          { r: /agenda|planning|calendrier/, a: "Planning du jour : 3 patients confirmés, 1 urgence en attente." },
          { r: /stock|matériel|commande|consommable/, a: "Stocks faibles : gants L (8 boîtes restantes). Commande suggérée." },
          { r: /parodontite|paro|gencive|gingivite|saignement gencive/, a: "Pathologie parodontale détectée. Bilan parodontal + détartrage profond recommandés." },
        ];
        const m = kb.find(i => i.r.test(L));
        if (m) botResponse = m.a;
      }

      // Add final bot response
      setChatHistory((prev) => [...prev, { role: "bot", text: botResponse }]);
    } catch (err) {
      console.error("processCommand error:", err);
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", text: "Erreur interne du Neural Core. Réessayez." },
      ]);
    } finally {
      setIsProcessing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executeAction = (id: string) => {
    setCommandQueue((prev) =>
      prev.map((cmd) => (cmd.id === id ? { ...cmd, status: "done" } : cmd))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && transcript.trim() && !isProcessing) {
      processCommand(transcript.trim());
    }
  };

  const handleSend = () => {
    if (transcript.trim() && !isProcessing) {
      processCommand(transcript.trim());
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-[9999]">
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 24px rgba(59,130,246,0.5)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center transition-all duration-500 border-2",
            isOpen
              ? "bg-slate-900 border-slate-700 text-white rotate-90"
              : "bg-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-500/40"
          )}
        >
          {isOpen ? <X className="h-8 w-8" /> : <Brain className="h-8 w-8" />}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <Zap className="h-3 w-3 text-white fill-current" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-36 right-6 z-[9998] w-[430px] max-w-[calc(100vw-1.5rem)] h-[660px] bg-white rounded-3xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25)] border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-[#0F172A] p-5 text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Brain className="h-28 w-28" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">
                    Neural Assistant Elite
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      Medical Intelligence V3.2
                    </p>
                    <span className="h-1 w-1 bg-blue-400 rounded-full" />
                    <span className="text-[8px] font-black text-emerald-400 uppercase">
                      Secure
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full">
                  <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40"
              style={{ scrollBehavior: "smooth" }}
            >
              {chatHistory.map((chat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex flex-col max-w-[88%]",
                    chat.role === "user"
                      ? "ml-auto items-end"
                      : "mr-auto items-start"
                  )}
                >
                  {chat.type === "insight" ? (
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-xl w-full">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          Neural Clinical Insight
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300 leading-relaxed">
                        {chat.text}
                      </p>
                      <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase">
                          IA Confidence: 98.4%
                        </span>
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                        chat.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                      )}
                    >
                      {chat.text}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Command Cards */}
              <AnimatePresence>
                {commandQueue
                  .filter((c) => c.status !== "done")
                  .map((cmd) => (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      className="bg-white border-2 border-blue-50 rounded-2xl p-4 shadow-lg shadow-blue-500/5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center">
                            {cmd.type === "RADIO" && (
                              <FileSearch className="h-4 w-4 text-blue-600" />
                            )}
                            {cmd.type === "WHATSAPP" && (
                              <MessageCircle className="h-4 w-4 text-blue-600" />
                            )}
                            {cmd.type === "PATIENT" && (
                              <User className="h-4 w-4 text-blue-600" />
                            )}
                            {cmd.type === "RDV" && (
                              <Calendar className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                            Action Recommandée
                          </span>
                        </div>
                        {cmd.meta?.priority && (
                          <span className="text-[8px] font-black px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full uppercase">
                            Priorité {cmd.meta.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-600 italic">
                        "{cmd.suggestion}"
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => executeAction(cmd.id)}
                          className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20"
                        >
                          Exécuter <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => executeAction(cmd.id)}
                          className="px-4 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {/* Processing Indicator */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-blue-500 ml-2"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                    Neural Core Processing...
                  </span>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white border-t border-slate-100 space-y-3">
              {/* Voice Wave Animation */}
              {isRecording && (
                <div className="flex justify-center items-end gap-1 h-10 px-8">
                  {Array.from({ length: 21 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [6, Math.random() * 28 + 6, 6] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.5 + Math.random() * 0.3,
                        delay: i * 0.03,
                      }}
                      className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Live transcript preview */}
              {isRecording && transcript && (
                <p className="text-[11px] text-slate-500 italic px-2 text-center truncate">
                  "{transcript}"
                </p>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    transcriptRef.current = e.target.value;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isRecording
                      ? "En écoute neurale..."
                      : "Parlez (🎙) ou écrivez une commande..."
                  }
                  disabled={isProcessing}
                  className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-5 pr-28 text-sm font-medium text-slate-800 outline-none focus:ring-2 ring-blue-400/20 transition-all placeholder:text-slate-400 disabled:opacity-60"
                />
                <div className="absolute right-2.5 top-2 flex gap-1.5">
                  <button
                    onClick={toggleRecording}
                    disabled={isProcessing}
                    className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                      isRecording
                        ? "bg-rose-500 text-white animate-pulse shadow-rose-200"
                        : "bg-white text-slate-400 hover:text-blue-600"
                    )}
                  >
                    {isRecording ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>
                  {transcript.trim() && !isRecording && (
                    <button
                      onClick={handleSend}
                      disabled={isProcessing}
                      className="h-11 w-11 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Neural Link Active — fr-FR
                  </span>
                </div>
                <button className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                  <ExternalLink className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Aide
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
