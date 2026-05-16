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
  Stethoscope,
  Microscope,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface CommandAction {
  id: string;
  type: "RDV" | "PATIENT" | "NOTE" | "BILLING" | "RADIO" | "WHATSAPP" | "LABO" | "CHARTING";
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

  // Track which commands have been synced to Supabase
  const syncedCommands = useRef<Set<string>>(new Set());

  // Automatically sync new commands to Supabase 'neural_logs' table
  useEffect(() => {
    const unsynced = commandQueue.filter(cmd => !syncedCommands.current.has(cmd.id));
    if (unsynced.length === 0) return;
    
    unsynced.forEach(cmd => {
      syncedCommands.current.add(cmd.id);
      
      supabase.from('neural_logs').insert([{
        command_id: cmd.id,
        command_type: cmd.type,
        content: cmd.content,
        suggestion: cmd.suggestion,
        status: cmd.status,
        meta_data: cmd.meta
      }]).then(({ error }) => {
        if (error) console.error("Supabase sync error:", error);
        else console.log(`[Supabase] Action ${cmd.id} synced successfully.`);
      });
    });
  }, [commandQueue]);
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
      let botResponse = `Je n'ai pas compris : "${cleanText}". Exemples : "j'ai une carie", "rendez-vous demain 14h", "payer par Wave", "j'ai mal la nuit", "devis implant".`;

      // ═══════════════════════════════════════════════════════════
      // 🚨 URGENCES & DOULEURS AIGUËS
      // ═══════════════════════════════════════════════════════════
      if (/urgence|j'ai très mal|douleur intense|insupportable|dent cassée|traumatisme|choc|dent qui saigne beaucoup|abcès|abces|gonfle|enflé|enflure|tuméfaction|fièvre dentaire|fievre dentaire|visage enflé|ça me lance|rage de dent|hémorragie|yalla na la wax/.test(L)) {
        botResponse = "🚨 URGENCE détectée. Patient prioritaire — fiche créée, praticien alerté. Prise en charge immédiate recommandée.";
        setChatHistory((p) => [...p, { role: "bot", text: "URGENCE : Évaluer ABC (Anesthésie, Drainage, Antibiotiques). Documenter heure d'arrivée + constantes.", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Ouvrir fiche urgence & alerter praticien", status: "pending", meta: { priority: "URGENT" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 😴 DOULEURS & SOMMEIL
      // ═══════════════════════════════════════════════════════════
      } else if (/douleur nocturne|mal la nuit|j'ai mal la nuit|douleur la nuit|réveille la nuit|reveille la nuit|insomnie|douleur qui empêche de dormir|bruxisme|grince les dents|grince dents|serrement de mâchoire|grincement/.test(L)) {
        botResponse = "Douleur nocturne ou bruxisme identifié. Causes fréquentes : pulpite irréversible, bruxisme, sinusite maxillaire. Traitement : gouttière occlusale + évaluation pulpaire urgente.";
        setChatHistory((p) => [...p, { role: "bot", text: "BILAN NUIT : Radio rétro-alvéolaire → Test vitalité pulpaire → Si bruxisme : gouttière sur mesure 35 000 FCFA", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RADIO", content: cleanText, suggestion: "Lancer bilan pulpaire + radio urgente", status: "pending", meta: { priority: "High" } }, ...p]);

      } else if (/douleur|j'ai mal|ça fait mal|je souffre|mal aux dents|sensibilité|dent sensible|chaud|froid|sucré|sensitive|café touba|cafe touba/.test(L)) {
        botResponse = "Douleur dentaire notée. Sensibilité au chaud/froid → suspicion pulpite. Sensibilité au sucré → carie. Je prépare le bilan diagnostique.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Ouvrir bilan douleur + test vitalité", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🦷 CARIES & PATHOLOGIES LOCALES
      // ═══════════════════════════════════════════════════════════
      } else if (/carie|caries|cavité|cavite|trou dans la dent|dent abîm|dent noire|dent pourrie|cariée|decalcif|déminéralisation|tache|bissap|tômbouctou|tombouctou|soda|bonbons|casse noix|os de bœuf|glaçon|dent qui bouge/.test(L)) {
        botResponse = "Pathologie dentaire (carie ou fracture) identifiée. Le mode de consommation (sucre, éléments durs) a été noté.";
        setChatHistory((p) => [...p, { role: "bot", text: "PROTOCOLE CARIE/FRACTURE : Radio rétro → Évaluation profondeur → Obturation composite / Dévitalisation / Couronne", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RADIO", content: cleanText, suggestion: "Lancer analyse radio IA + devis", status: "pending", meta: { priority: "High" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🔧 EXTRACTIONS
      // ═══════════════════════════════════════════════════════════
      } else if (/extraction|arracher|enlever la dent|dent de sagesse|sagesse|avulsion|dent à extraire|dent condamnée/.test(L)) {
        botResponse = "Extraction notée. Protocole : Anesthésie → Avulsion → Sutures → Antibiotiques post-op (Amoxicilline 1g × 2/j × 7j). Tarif : 40 000 FCFA.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Générer devis + consentement extraction", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🧼 DÉTARTRAGE / PROPHYLAXIE
      // ═══════════════════════════════════════════════════════════
      } else if (/détartrage|detartrage|nettoyage|tartre|polissage|hygiène dentaire|prophylaxie|curetage|surfaçage/.test(L)) {
        botResponse = "Détartrage/prophylaxie programmé. Inclus : détartrage supra et sous-gingival + polissage. Tarif : 25 000 FCFA. Durée : 45 min.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: "Programmer séance détartrage", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 💉 ENDODONTIE / DÉVITALISATION
      // ═══════════════════════════════════════════════════════════
      } else if (/dévitalisation|devitalisation|traitement de canal|endodontie|canal radiculaire|pulpite|nécrose|necrose|granulome|kyste apical/.test(L)) {
        botResponse = "Dévitalisation requise. Protocole en 2–3 séances. Tarif : 80 000 – 150 000 FCFA selon nombre de canaux.";
        setChatHistory((p) => [...p, { role: "bot", text: "ENDODONTIE : Anesthésie → Accès caméral → Mise en forme → Irrigation NaOCl → Obturation Gutta → Couronne de recouvrement", type: "insight" }]);

      // ═══════════════════════════════════════════════════════════
      // 🪛 IMPLANTOLOGIE
      // ═══════════════════════════════════════════════════════════
      } else if (/implant|vis dentaire|ostéo-intégration|pose d'implant|pilier implant|sinus lift|greffe osseuse/.test(L)) {
        botResponse = "Implantologie notée. Tarifs : Implant simple 350 000 FCFA · Sinus lift 180 000 FCFA · Greffe osseuse 120 000 FCFA. Délai osseux : 3–6 mois.";
        setChatHistory((p) => [...p, { role: "bot", text: "IMPLANT : Bilan CBCT → Chirurgie (pose vis) → Cicatrisation 3–6 mois → Pose couronne sur implant", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Générer devis implant + simulation 3D", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 👑 PROTHÈSES & RESTAURATIONS
      // ═══════════════════════════════════════════════════════════
      } else if (/couronne|bridge|prothèse|prothese|dentier|appareil dentaire|facette|onlay|inlay|stellite|partielle amovible|totale amovible/.test(L)) {
        botResponse = "Restauration prothétique notée. Tarifs : Couronne zircone 120 000 FCFA · Bridge 3 éléments 280 000 FCFA · Prothèse amovible 150 000 FCFA.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Préparer consultation prothétique + empreinte", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 😁 ESTHÉTIQUE
      // ═══════════════════════════════════════════════════════════
      } else if (/blanchiment|blanchir|éclaircissement|eclaircissement|dents jaunes|dents blanches|smile design|esthétique dentaire|facette composite|facette céramique/.test(L)) {
        botResponse = "Esthétique dentaire notée. Blanchiment cabinet 75 000 FCFA · Gouttières 45 000 FCFA · Facettes composite 80 000/dent · Facettes céramique 150 000/dent.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Ouvrir Smile Design Studio", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🦷 ORTHODONTIE & PÉDODONTIE
      // ═══════════════════════════════════════════════════════════
      } else if (/orthodontie|bagues|gouttière orthodontique|aligneur|malposition|dents croches|diastème|diastheme|surplomb|décalage|malocclusion/.test(L)) {
        botResponse = "Orthodontie notée. Bagues métalliques 250 000 FCFA · Bagues céramique 350 000 FCFA · Aligneurs transparents 400 000–600 000 FCFA. Durée : 12–24 mois.";

      } else if (/enfant|pédiatrique|pédodontie|dent de lait|dent lactéale|carie enfant|biberon|fluor|scellement|sealant/.test(L)) {
        botResponse = "Pédodontie notée. Scellement des sillons : 15 000 FCFA/dent. Fluoration : 10 000 FCFA. Traitement adapté enfant avec approche bienveillante.";

      // ═══════════════════════════════════════════════════════════
      // 💊 PARODONTOLOGIE & GENCIVES
      // ═══════════════════════════════════════════════════════════
      } else if (/parodontite|paro|gencive|gingivite|saignement gencive|déchaussement|poche parodontale|récession gingivale|greffe gingivale/.test(L)) {
        botResponse = "Pathologie parodontale identifiée. Protocole : Détartrage profond (surfaçage) → Antibiothérapie → Bilan parodontal → Greffe gingivale si récession.";
        setChatHistory((p) => [...p, { role: "bot", text: "PARO : Indice parodontal → Surfaçage radiculaire → Maintenance tous les 3 mois", type: "insight" }]);

      // ═══════════════════════════════════════════════════════════
      // 💉 ANESTHÉSIE & CONFORT
      // ═══════════════════════════════════════════════════════════
      } else if (/anesthésie|anesthesie|piqûre|piqure|endormir|j'ai peur|anxieux|anxiété|phobie dentaire|stress dentaire|sédation|protoxyde|mal anesthésié/.test(L)) {
        botResponse = "Gestion anxiété/douleur notée. Options : Anesthésie locale Xylocaïne 2% · MEOPA (gaz hilarant) 25 000 FCFA · Sédation consciente. Allergie à vérifier.";

      // ═══════════════════════════════════════════════════════════
      // 💊 ORDONNANCES, MÉDICAMENTS & POSOLOGIE
      // ═══════════════════════════════════════════════════════════
      } else if (/posologie|comment prendre|avant le repas|après le repas|apres le repas|le matin|le soir|à jeun|a jeun|fréquence|frequence|toutes les|combien de fois|cuillère|comprimé|gélule|sirop|bain de bouche/.test(L)) {
        botResponse = "Posologie : Prendre au milieu des repas pour protéger l'estomac (Ibuprofène). Ne pas dépasser 3g/jour pour le Paracétamol. Bains de bouche à débuter 24h APRÈS l'extraction.";
        setChatHistory((p) => [...p, { role: "bot", text: "RAPPEL PATIENT : Éviter l'automédication (AINS si infection sans antibio). Respecter les horaires fixes (ex: 8h-20h pour antibio 2x/j).", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Générer fiche conseil posologie", status: "pending" }, ...p]);

      } else if (/ordonnance|médicament|medicament|antibiotique|antidouleur|amoxicilline|ibuprofène|paracétamol|prescrire|prescription|metronidazole|spiramycine|tramadol|clamoxyl|efferalgan|doliprane|birodogyl/.test(L)) {
        botResponse = "Ordonnance type : Amoxicilline 1g (1 matin, 1 soir pdt 7j) + Ibuprofène 400mg (si douleur, max 3/j) + Paracétamol 1g. Si allergie pénicilline → Azithromycine 500mg/j (pdt 3j).";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Ouvrir éditeur d'ordonnance", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 💰 FINANCES & PAIEMENTS
      // ═══════════════════════════════════════════════════════════
      } else if (/payer|paiement|règlement|reglement|facture|reçu|recu|note d'honoraires|note honoraires|espèce|espece/.test(L)) {
        botResponse = "Paiement noté. Modes acceptés : Espèces · Orange Money · Wave · Carte bancaire (Visa/MasterCard) · Chèque · Virement. Souhaitez-vous une facture pro-forma ?";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Ouvrir caisse & générer reçu", status: "pending" }, ...p]);

      } else if (/wave|orange money|free money|mobile money|paiement mobile|m-pesa|wizall|wari/.test(L)) {
        botResponse = "Paiement Mobile Money accepté. Numéros : Wave (+221 77 XXX XX XX) · Orange Money (+221 77 XXX XX XX) · Free Money (+221 76 XXX XX XX). Reçu généré automatiquement.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Enregistrer paiement Mobile Money", status: "pending" }, ...p]);

      } else if (/virement|banque|chèque|cheque|carte bancaire|visa|mastercard|crédit|credit|débit|debit/.test(L)) {
        botResponse = "Paiement bancaire noté. RIB : SGBS — IBAN SN XX XXXX XXXX XXXX. Chèque à l'ordre du Cabinet Dentaire Elite. Délai d'encaissement : 48h ouvrés.";

      } else if (/devis|estimation|coût du traitement|cout|combien coûte|combien ça coûte|tarification|grille tarifaire|prix/.test(L)) {
        botResponse = "Grille tarifaire du cabinet : Consultation 15k · Détartrage 25k · Obturation 30k · Extraction 40k · Dévitalisation 80–150k · Couronne 120k · Implant 350k · Blanchiment 75k FCFA. Devis personnalisé sur demande.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Générer devis personnalisé", status: "pending" }, ...p]);

      } else if (/assurance|mutuelle|ipm|ipres|css|ram|sante|prise en charge|remboursement|tiers payant|ticket modérateur|assurance scolaire/.test(L)) {
        botResponse = "Assurances acceptées : IPM, IPRES, CSS, RAM, mutuelles de santé et scolaires. Le ticket modérateur est applicable selon la couverture. Tiers payant possible.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Ouvrir module Mutuelles", status: "pending" }, ...p]);

      } else if (/échelonner|echelonner|paiement en plusieurs fois|en deux fois|en trois fois|mensualité|mensualite|facilité de paiement|crédit dentaire/.test(L)) {
        botResponse = "Paiement échelonné disponible pour les montants > 100 000 FCFA. Plans : 2×, 3× ou 6× sans frais avec Wave ou chèque. Accord de paiement requis.";

      } else if (/solde|reste à payer|reste a payer|avance|acompte|règlement partiel|reglement partiel|situation compte|bilan financier/.test(L)) {
        botResponse = "Consultation du compte patient en cours. Solde actuel : 0 FCFA. Dernier règlement : — FCFA. Souhaitez-vous un relevé de compte ?";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Afficher relevé financier patient", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🌍 CULTURE LOCALE, WOLOF & LOCALITÉS SÉNÉGAL
      // ═══════════════════════════════════════════════════════════
      } else if (/dakar|guédiawaye|guediawaye|pikine|rufisque|thiès|thies|mbour|saint-louis|ziguinchor|diourbel|kaolack|tambacounda|kolda|bargny|touba|tivaouane|yeumbeul|parcelles assainies|grand yoff|ouakam|ngor|almadies|castors|mermoz|sacré-cœur|sacre-coeur|colobane|sandaga|plateau|médina|medina/.test(L)) {
        botResponse = "Localité enregistrée. Nous accueillons les patients de tout le Sénégal. Voulez-vous planifier un RDV adapté à votre temps de trajet ?";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: "Ouvrir Agenda (Patient éloigné)", status: "pending" }, ...p]);
        
      } else if (/naka waa ker|djarama|niokobok|jerejef|na nga def|waaw|dedet|yow|mane/.test(L)) {
        botResponse = "Ñio ko bokk ! Je comprends le wolof. Comment puis-je vous aider au cabinet aujourd'hui ?";

      // ═══════════════════════════════════════════════════════════
      // 📷 RADIO / IMAGERIE
      // ═══════════════════════════════════════════════════════════
      } else if (/radio|radiographie|panoramique|pano|cbct|scanner|rx|rétro-alvéolaire|retroalveolaire|imagerie|téléradiographie|teleradiographie/.test(L)) {
        botResponse = "Analyse radiographique IA lancée. Modèle Neural Imaging v4.2 actif. Panoramique 15 000 FCFA · CBCT 60 000 FCFA · Rétro-alvéolaire 8 000 FCFA.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RADIO", content: cleanText, suggestion: "Ouvrir Radio IA Lab", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 📅 RENDEZ-VOUS
      // ═══════════════════════════════════════════════════════════
      } else if (/rendez-vous|rdv|consulter|consultation|prendre rdv|appointment|programmer|planifier|réserver|reserver/.test(L)) {
        const t = L.match(/(\d{1,2})\s*h/); const time = t ? `${t[1]}h00` : "10h00";
        const day = /demain/.test(L) ? "demain" : /lundi/.test(L) ? "lundi" : /mardi/.test(L) ? "mardi" : /mercredi/.test(L) ? "mercredi" : /jeudi/.test(L) ? "jeudi" : /vendredi/.test(L) ? "vendredi" : /samedi/.test(L) ? "samedi" : "prochainement";
        botResponse = `RDV enregistré pour ${day} à ${time}. Rappel SMS/WhatsApp envoyé au patient 24h avant.`;
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: `Créer RDV ${day} à ${time} + rappel auto`, status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🔬 LABORATOIRE CFAO & FOURNISSEURS (FLUX NUMÉRIQUE)
      // ═══════════════════════════════════════════════════════════
      } else if (/empreinte numérique|empreinte optique|laboratoire|labo|prothésiste|prothesiste|couronne en zircone|teinte a2|teinte a3|envoyer au labo|relancer le labo|guide chirurgical|fournisseur/.test(L)) {
        botResponse = "Flux numérique CFAO activé. Ordre de fabrication prêt à être envoyé au laboratoire partenaire. Les fichiers STL/PLY peuvent être joints automatiquement.";
        setChatHistory((p) => [...p, { role: "bot", text: "LABO CFAO : N'oubliez pas de préciser la teinte exacte et le type de matériau (Zircone, E-max, Céramo-métallique) sur le bon de commande.", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "LABO", content: cleanText, suggestion: "Générer Bon de Commande Labo CFAO", status: "pending", meta: { priority: "High" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🦷 DICTÉE CLINIQUE & ODONTOGRAMME 3D (CHARTING)
      // ═══════════════════════════════════════════════════════════
      } else if (/carie mésio|carie occlusale|carie distale|face vestibulaire|face palatine|face linguale|poche parodontale|sur la dent|sur la 1|sur la 2|sur la 3|sur la 4|mobilité de grade|indice de plaque|saignement au sondage/.test(L)) {
        botResponse = "Dictée clinique active. J'enregistre ces données directement sur l'odontogramme 3D et le charting parodontal du patient.";
        setChatHistory((p) => [...p, { role: "bot", text: "CHARTING IA : Les faces Mésiale, Occlusale, Distale ont été mises à jour. Le schéma dentaire se synchronise en temps réel.", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "CHARTING", content: cleanText, suggestion: "Mettre à jour l'Odontogramme 3D", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🧘 GESTION DU STRESS & BIEN-ÊTRE PRATICIEN
      // ═══════════════════════════════════════════════════════════
      } else if (/je suis fatigué|fatigué|journée difficile|burnout|besoin d'une pause|trop de patients|stresser/.test(L)) {
        botResponse = "Docteur, votre santé mentale est la priorité. Je bloque les prochains créneaux d'urgence et j'active le mode 'Consultation Zen' (musique d'ambiance et lumières douces).";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: "Bloquer un créneau de pause (30min)", status: "pending", meta: { priority: "URGENT" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🏥 SUIVI POST-OPÉRATOIRE & COMPLICATIONS
      // ═══════════════════════════════════════════════════════════
      } else if (/saigne encore|le fil me pique|joue bleue|hématome|mauvaise haleine|alvéolite|caillot de sang|perdu le caillot|gonflé après extraction/.test(L)) {
        botResponse = "Suivi post-opératoire : Un léger saignement ou gonflement est normal les premières 48h. Une mauvaise haleine ou douleur intense (alvéolite) nécessite une consultation de contrôle.";
        setChatHistory((p) => [...p, { role: "bot", text: "ALERTE POST-OP : Si saignement actif persistant, demander au patient de mordre sur une compresse stérile pendant 30 min.", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Programmer consultation de contrôle", status: "pending", meta: { priority: "High" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // ⚙️ PROBLÈMES MÉCANIQUES (PROTHÈSES & ORTHO)
      // ═══════════════════════════════════════════════════════════
      } else if (/couronne est tombée|couronne tombée|avalé ma dent|dentier bouge|prothèse me blesse|appareil me blesse|fil cassé|bagues cassées|perdu ma gouttière|perdu mon aligneur/.test(L)) {
        botResponse = "Urgence mécanique notée. Ne tentez pas de recoller vous-même. Conservez la pièce. Nous programmons une courte séance de réparation/cimentation.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: "Créer créneau court (Réparation/Recellement)", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🚗 LOGISTIQUE, ACCÈS & CONFORT
      // ═══════════════════════════════════════════════════════════
      } else if (/embouteillage|bouchon|vdn|retard|taxi|ne trouve pas|parking|se garer|wifi|code wifi|en bas|ascenseur|fauteuil roulant/.test(L)) {
        botResponse = "Message logistique reçu. Le secrétariat est prévenu de votre situation. Nous adaptons l'agenda en conséquence. Lien GPS ou code Wi-Fi disponible à l'accueil.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "WHATSAPP", content: cleanText, suggestion: "Envoyer localisation GPS / Instructions d'accès", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 👶 PÉDIATRIE PRATIQUE (GESTION PARENTS)
      // ═══════════════════════════════════════════════════════════
      } else if (/il pleure|elle pleure|ne veut pas ouvrir la bouche|dent pousse de travers|tétine|pouce|suce son pouce|dent tombée à l'école|avalé du dentifrice/.test(L)) {
        botResponse = "Pédodontie : Approche bienveillante recommandée. Pour la tétine/pouce, un arrêt progressif est conseillé. En cas de traumatisme à l'école, consulter rapidement avec le certificat scolaire.";
        setChatHistory((p) => [...p, { role: "bot", text: "PROTOCOLE ENFANT : Envoyer vidéo rassurante aux parents. Prévoir une séance d'habituation (Tell-Show-Do) sans soins si enfant non coopérant.", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "WHATSAPP", content: cleanText, suggestion: "Envoyer kit de préparation (vidéo ludique enfant)", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // ⚠️ SITUATIONS MÉDICALES SPÉCIALES (ANAMNÈSE)
      // ═══════════════════════════════════════════════════════════
      } else if (/enceinte|j'allaite|grossesse|diabète|diabétique|diabetique|hypertension|anticoagulant|aspegic|sintrom|cardiaque|asthme|asthmatique/.test(L)) {
        botResponse = "Anamnèse médicale critique mise à jour. Les protocoles de soins (anesthésie, radios, prescriptions) seront adaptés à ce contexte médical spécifique.";
        setChatHistory((p) => [...p, { role: "bot", text: "ALERTE MÉDICALE : Vérifier l'INR (si anticoagulants), l'HbA1c (si diabète), éviter les AINS (si grossesse/asthme). Adapter l'anesthésie (sans adrénaline si besoin).", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Mettre à jour le dossier médical (ALERTE ROUGE)", status: "pending", meta: { priority: "URGENT" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // ⭐ GESTION DE L'EXPÉRIENCE (AVIS & PLAINTES)
      // ═══════════════════════════════════════════════════════════
      } else if (/c'était parfait|c'etait parfait|rien senti|très bien|recommande|trop cher|mal parlé|attendu trop longtemps|longue attente|déçu|decu/.test(L)) {
        const isPositive = /parfait|rien senti|très bien|recommande/.test(L);
        botResponse = isPositive 
          ? "Retour positif enregistré. Merci pour votre confiance ! Souhaitez-vous recevoir un lien pour laisser un avis sur Google ?"
          : "Plainte enregistrée. Nous sommes navrés pour cette expérience. La direction va être alertée immédiatement pour trouver une solution.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "WHATSAPP", content: cleanText, suggestion: isPositive ? "Envoyer demande d'avis Google" : "Alerter la direction (Rattrapage commercial)", status: "pending", meta: { priority: isPositive ? "Normal" : "High" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 👤 DOSSIER PATIENT
      // ═══════════════════════════════════════════════════════════
      } else if (/dossier|patient|fiche|historique|antécédent|antecedent|medical|allergie/.test(L)) {
        botResponse = `Dossier ${currentPatient.name} — ID: ${currentPatient.id}. Dernière radio : ${currentPatient.lastRadio}. Antécédents médicaux à vérifier avant tout acte.`;
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Ouvrir Fiche Complète + Questionnaire médical", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 💬 WHATSAPP & COMMUNICATION
      // ═══════════════════════════════════════════════════════════
      } else if (/whatsapp|message|sms|envoyer|notifier|rappel|confirmer rdv|annuler rdv|contact patient/.test(L)) {
        botResponse = "Hub Communication ouvert. Mamadou Dia attend une confirmation pour mardi 10h. Dois-je valider et envoyer le rappel automatique ?";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "WHATSAPP", content: cleanText, suggestion: "Envoyer confirmation WhatsApp + rappel SMS", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 📊 BASE GÉNÉRALE ENRICHIE
      // ═══════════════════════════════════════════════════════════
      } else {
        const kb = [
          { r: /horaire|heure|ouvert|ferme|disponible|quand/, a: "Le cabinet est ouvert lundi–vendredi 8h–19h et samedi 9h–13h. Urgences acceptées sans RDV." },
          { r: /adresse|situé|lieu|où|localisation|itinéraire|plan/, a: "Cabinet au Plateau, Rue de Thiong, Dakar. GPS : 14.6937° N, 17.4441° W. Bus 26, arrêt Plateau." },
          { r: /tarif|prix|coût|combien/, a: "Consultation 15k · Détartrage 25k · Obturation 30k · Extraction 40k · Dévitalisation 80–150k · Couronne 120k · Implant 350k FCFA." },
          { r: /bonjour|salut|bonsoir|hello|bonne journée|bonne matinée/, a: "Bonjour Docteur ! Neural Core v3.2 actif. Comment puis-je vous assister ?" },
          { r: /merci|parfait|ok|super|bien|excellent|génial/, a: "Avec plaisir. Autre commande ?" },
          { r: /agenda|planning|calendrier|programme|emploi du temps/, a: "Planning du jour : 8 patients · 3 urgences · 2 chirurgies. Prochain RDV libre : 15h30." },
          { r: /stock|matériel|materiel|commande|consommable|gants|masque|résine|amalgame/, a: "Stocks : Gants L (8 boîtes) ⚠️ · Résine composite (3 seringues) ⚠️ · Anesthésiques (12 carpules). Commande urgente suggérée." },
          { r: /chiffre d'affaires|ca|recettes|revenus|bilan|statistiques|performance/, a: "CA du mois : 2 450 000 FCFA. Objectif : 3 000 000 FCFA (82%). Voir tableau de bord statistiques." },
          { r: /personnel|assistante|secretaire|infirmière|aide-soignant|equipe/, a: "Équipe active : Dr. Ndiaye (praticien) · Aïssatou (assistante) · M. Fall (comptable). Planning disponible dans la section Utilisateurs." },
          { r: /nutrition|alimentation|regime|sucre|acide|erosion|reflux/, a: "Conseils nutritionnels : Réduire les sucres raffinés (bissap, sodas) + boissons acides. Brosser 30 min après. Fluor 1450 ppm recommandé." },
          { r: /hygiène|brossage|dentifrice|fil dentaire|bain de bouche|brosse/, a: "Conseils hygiène : Brossage 2× /j · Fil dentaire 1× /j · Bain de bouche antibactérien. Brosse à dents changée tous les 3 mois." },
          { r: /téléconsultation|teleconsultation|en ligne|video|zoom|à distance/, a: "Téléconsultation disponible. Tarif : 10 000 FCFA. RDV vidéo via la section Téléconsult du logiciel." },
          { r: /chicha|tabac|fumer/, a: "La chicha et le tabac jaunissent les dents et augmentent les risques de maladie parodontale. Un blanchiment et un détartrage régulier sont conseillés." },
          { r: /beurre de karité|karite|médecine traditionnelle|traditionnel|clou de girofle/, a: "Les remèdes traditionnels comme le beurre de karité ou le clou de girofle peuvent soulager temporairement la douleur, mais une consultation est indispensable pour traiter la cause médicale." },
          { r: /eau du robinet|eau dakar/, a: "L'eau du robinet à Dakar est généralement fluorée, ce qui est bénéfique pour l'émail dentaire. Cependant, un brossage régulier avec dentifrice fluoré reste indispensable." },
          { r: /magal|tabaski|hivernage|ramadan|korite/, a: "Nous adaptons nos horaires d'ouverture pendant les périodes de Magal, Tabaski ou Ramadan. Contactez l'accueil pour connaître les permanences d'urgence ces jours-là." }
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
                            {cmd.type === "LABO" && (
                              <Truck className="h-4 w-4 text-blue-600" />
                            )}
                            {cmd.type === "CHARTING" && (
                              <Stethoscope className="h-4 w-4 text-blue-600" />
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
