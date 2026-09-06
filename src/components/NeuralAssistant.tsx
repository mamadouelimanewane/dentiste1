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
import { usePatient } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";

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
      text: "Bonjour. Je suis un aide-mémoire sur les gestes et protocoles. Je n'ai accès à aucune donnée du cabinet : agenda, stocks et chiffres sont dans leurs modules.",
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track how many bot messages have been spoken to avoid re-reading on re-render
  const spokenCountRef = useRef(1); // start at 1 to skip welcome message

  // Track which commands have been synced to Supabase
  const syncedCommands = useRef<Set<string>>(new Set());

  // Automatically sync new commands to the neural_logs table (via API route
  // — le client Neon serverless ne s'utilise que côté serveur).
  useEffect(() => {
    const unsynced = commandQueue.filter(cmd => !syncedCommands.current.has(cmd.id));
    if (unsynced.length === 0) return;

    unsynced.forEach(cmd => {
      syncedCommands.current.add(cmd.id);

      fetch('/api/neural-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandId: cmd.id,
          commandType: cmd.type,
          content: cmd.content,
          suggestion: cmd.suggestion,
          statusValue: cmd.status,
          meta: cmd.meta,
        }),
      }).catch((err) => console.error("Neural log sync error:", err));
    });
  }, [commandQueue]);
  // Use a ref to always read the latest transcript inside async callbacks
  const transcriptRef = useRef("");

  // Auparavant un patient fictif codé en dur ("Mamadou Diallo / SN-16499-X")
  // était affiché quel que soit le dossier réellement ouvert.
  const { currentPatient } = usePatient();

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
        botResponse = "🚨 Mots-clés d'urgence détectés. Aucune fiche n'a été créée et aucune alerte n'a été envoyée : prévenez le praticien vous-même et ouvrez la fiche du patient.";
        setChatHistory((p) => [...p, { role: "bot", text: "URGENCE : Évaluer ABC (Anesthésie, Drainage, Antibiotiques). Documenter heure d'arrivée + constantes.", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Ouvrir fiche urgence & alerter praticien", status: "pending", meta: { priority: "URGENT" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 😴 DOULEURS & SOMMEIL
      // ═══════════════════════════════════════════════════════════
      } else if (/douleur nocturne|mal la nuit|j'ai mal la nuit|douleur la nuit|réveille la nuit|reveille la nuit|insomnie|douleur qui empêche de dormir|bruxisme|grince les dents|grince dents|serrement de mâchoire|grincement/.test(L)) {
        botResponse = "Douleur nocturne ou bruxisme identifié. Causes fréquentes : pulpite irréversible, bruxisme, sinusite maxillaire. Traitement : gouttière occlusale + évaluation pulpaire urgente.";
        setChatHistory((p) => [...p, { role: "bot", text: "BILAN NUIT : Radio rétro-alvéolaire → Test vitalité pulpaire → Si bruxisme : gouttière sur mesure", type: "insight" }]);
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
        botResponse = "Extraction notée. Protocole : Anesthésie → Avulsion → Sutures → Antibiotiques post-op (Amoxicilline 1g × 2/j × 7j).";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Générer devis + consentement extraction", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🧼 DÉTARTRAGE / PROPHYLAXIE
      // ═══════════════════════════════════════════════════════════
      } else if (/détartrage|detartrage|nettoyage|tartre|polissage|hygiène dentaire|prophylaxie|curetage|surfaçage/.test(L)) {
        botResponse = "Détartrage/prophylaxie à programmer depuis l'agenda — rien n'est réservé ici. Inclus : détartrage supra et sous-gingival + polissage. Durée : 45 min.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: "Programmer séance détartrage", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 💉 ENDODONTIE / DÉVITALISATION
      // ═══════════════════════════════════════════════════════════
      } else if (/dévitalisation|devitalisation|traitement de canal|endodontie|canal radiculaire|pulpite|nécrose|necrose|granulome|kyste apical/.test(L)) {
        botResponse = "Dévitalisation requise. Protocole en 2–3 séances. Le nombre de canaux détermine le nombre de séances.";
        setChatHistory((p) => [...p, { role: "bot", text: "ENDODONTIE : Anesthésie → Accès caméral → Mise en forme → Irrigation NaOCl → Obturation Gutta → Couronne de recouvrement", type: "insight" }]);

      // ═══════════════════════════════════════════════════════════
      // 🪛 IMPLANTOLOGIE
      // ═══════════════════════════════════════════════════════════
      } else if (/implant|vis dentaire|ostéo-intégration|pose d'implant|pilier implant|sinus lift|greffe osseuse/.test(L)) {
        botResponse = "Implantologie notée. Délai osseux : 3–6 mois. Tarifs : voir le Catalogue des actes.";
        setChatHistory((p) => [...p, { role: "bot", text: "IMPLANT : Bilan CBCT → Chirurgie (pose vis) → Cicatrisation 3–6 mois → Pose couronne sur implant", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Générer devis implant + simulation 3D", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 👑 PROTHÈSES & RESTAURATIONS
      // ═══════════════════════════════════════════════════════════
      } else if (/couronne|bridge|prothèse|prothese|dentier|appareil dentaire|facette|onlay|inlay|stellite|partielle amovible|totale amovible/.test(L)) {
        botResponse = "Restauration prothétique notée. Couronne, bridge ou prothèse amovible selon l'indication. Tarifs : voir le Catalogue des actes.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Préparer consultation prothétique + empreinte", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 😁 ESTHÉTIQUE
      // ═══════════════════════════════════════════════════════════
      } else if (/blanchiment|blanchir|éclaircissement|eclaircissement|dents jaunes|dents blanches|smile design|esthétique dentaire|facette composite|facette céramique/.test(L)) {
        botResponse = "Esthétique dentaire notée. Blanchiment au fauteuil, gouttières, facettes composite ou céramique. Tarifs : voir le Catalogue des actes.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "NOTE", content: cleanText, suggestion: "Ouvrir Smile Design Studio", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🦷 ORTHODONTIE & PÉDODONTIE
      // ═══════════════════════════════════════════════════════════
      } else if (/orthodontie|bagues|gouttière orthodontique|aligneur|malposition|dents croches|diastème|diastheme|surplomb|décalage|malocclusion/.test(L)) {
        botResponse = "Orthodontie notée. Bagues métalliques ou céramique, aligneurs. Durée : 12–24 mois. Tarifs : voir le Catalogue des actes.";

      } else if (/enfant|pédiatrique|pédodontie|dent de lait|dent lactéale|carie enfant|biberon|fluor|scellement|sealant/.test(L)) {
        botResponse = "Pédodontie notée. Scellement des sillons et fluoration ; approche adaptée à l'enfant. Tarifs : voir le Catalogue des actes.";

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
        botResponse = "Gestion anxiété/douleur notée. Options : Anesthésie locale Xylocaïne 2% · MEOPA (gaz hilarant) · Sédation consciente. Allergie à vérifier.";

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
        botResponse = "Je ne connais aucun numéro Mobile Money de ce cabinet — ceux qui figuraient ici étaient des exemples (« 77 XXX XX XX »), à ne jamais dicter à un patient. Encaissez depuis Facturation, qui génère le lien de paiement réel.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Enregistrer paiement Mobile Money", status: "pending" }, ...p]);

      } else if (/virement|banque|chèque|cheque|carte bancaire|visa|mastercard|crédit|credit|débit|debit/.test(L)) {
        botResponse = "Je ne connais pas les coordonnées bancaires de ce cabinet — l'IBAN qui figurait ici était un exemple. Ne communiquez aucun RIB depuis cet assistant : demandez-le à la direction.";

      } else if (/devis|estimation|coût du traitement|cout|combien coûte|combien ça coûte|tarification|grille tarifaire|prix/.test(L)) {
        botResponse = "Je ne connais pas les tarifs de ce cabinet. Le catalogue réel est dans Devis et dans le Catalogue des actes ; établissez le devis à partir de là.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Générer devis personnalisé", status: "pending" }, ...p]);

      } else if (/assurance|mutuelle|ipm|ipres|css|ram|sante|prise en charge|remboursement|tiers payant|ticket modérateur|assurance scolaire/.test(L)) {
        botResponse = "Je ne sais pas quelles mutuelles ce cabinet a conventionnées : cette liste n'existe nulle part dans le logiciel. Vérifiez auprès de la direction, puis enregistrez la prise en charge depuis Facturation.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Ouvrir module Mutuelles", status: "pending" }, ...p]);

      } else if (/échelonner|echelonner|paiement en plusieurs fois|en deux fois|en trois fois|mensualité|mensualite|facilité de paiement|crédit dentaire/.test(L)) {
        botResponse = "Je ne connais pas les modalités de paiement acceptées par ce cabinet. Ne les annoncez pas à un patient depuis ici : voyez avec la direction, puis enregistrez le règlement dans Facturation.";

      } else if (/solde|reste à payer|reste a payer|avance|acompte|règlement partiel|reglement partiel|situation compte|bilan financier/.test(L)) {
        botResponse = "Je ne lis aucun compte patient. Le solde réel et les règlements sont dans Facturation, sur le dossier du patient.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "BILLING", content: cleanText, suggestion: "Afficher relevé financier patient", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🌍 CULTURE LOCALE, WOLOF & LOCALITÉS SÉNÉGAL
      // ═══════════════════════════════════════════════════════════
      } else if (/dakar|guédiawaye|guediawaye|pikine|rufisque|thiès|thies|mbour|saint-louis|ziguinchor|diourbel|kaolack|tambacounda|kolda|bargny|touba|tivaouane|yeumbeul|parcelles assainies|grand yoff|ouakam|ngor|almadies|castors|mermoz|sacré-cœur|sacre-coeur|colobane|sandaga|plateau|médina|medina/.test(L)) {
        botResponse = "Nous accueillons les patients de tout le Sénégal. Pensez à noter la localité dans le dossier : elle n'est pas enregistrée depuis cet assistant.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: "Ouvrir Agenda (Patient éloigné)", status: "pending" }, ...p]);
        
      } else if (/naka waa ker|djarama|niokobok|jerejef|na nga def|waaw|dedet|yow|mane/.test(L)) {
        botResponse = "Ñio ko bokk ! Je comprends le wolof. Comment puis-je vous aider au cabinet aujourd'hui ?";

      // ═══════════════════════════════════════════════════════════
      // 📷 RADIO / IMAGERIE
      // ═══════════════════════════════════════════════════════════
      } else if (/radio|radiographie|panoramique|pano|cbct|scanner|rx|rétro-alvéolaire|retroalveolaire|imagerie|téléradiographie|teleradiographie/.test(L)) {
        botResponse = "Aucune analyse automatisée n'existe dans ce logiciel : le module Imagerie affiche les clichés, l'interprétation reste au praticien.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RADIO", content: cleanText, suggestion: "Ouvrir Radio IA Lab", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 📅 RENDEZ-VOUS
      // ═══════════════════════════════════════════════════════════
      } else if (/rendez-vous|rdv|consulter|consultation|prendre rdv|appointment|programmer|planifier|réserver|reserver/.test(L)) {
        const t = L.match(/(\d{1,2})\s*h/); const time = t ? `${t[1]}h00` : "10h00";
        const day = /demain/.test(L) ? "demain" : /lundi/.test(L) ? "lundi" : /mardi/.test(L) ? "mardi" : /mercredi/.test(L) ? "mercredi" : /jeudi/.test(L) ? "jeudi" : /vendredi/.test(L) ? "vendredi" : /samedi/.test(L) ? "samedi" : "prochainement";
        botResponse = `Aucun rendez-vous n'a été créé et aucun rappel n'a été envoyé : cet assistant n'écrit pas dans l'agenda. Notez « ${day} à ${time} » et créez le rendez-vous depuis l'Agenda — le rappel part alors 24 h avant.`;
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "RDV", content: cleanText, suggestion: `Créer RDV ${day} à ${time} + rappel auto`, status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🔬 LABORATOIRE CFAO & FOURNISSEURS (FLUX NUMÉRIQUE)
      // ═══════════════════════════════════════════════════════════
      } else if (/empreinte numérique|empreinte optique|laboratoire|labo|prothésiste|prothesiste|couronne en zircone|teinte a2|teinte a3|envoyer au labo|relancer le labo|guide chirurgical|fournisseur/.test(L)) {
        botResponse = "Sujet CFAO identifié. Aucun ordre de fabrication n'est créé ni transmis depuis cet assistant : passez par le module Labo & CFAO.";
        setChatHistory((p) => [...p, { role: "bot", text: "LABO CFAO : N'oubliez pas de préciser la teinte exacte et le type de matériau (Zircone, E-max, Céramo-métallique) sur le bon de commande.", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "LABO", content: cleanText, suggestion: "Générer Bon de Commande Labo CFAO", status: "pending", meta: { priority: "High" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🦷 DICTÉE CLINIQUE & ODONTOGRAMME 3D (CHARTING)
      // ═══════════════════════════════════════════════════════════
      } else if (/carie mésio|carie occlusale|carie distale|face vestibulaire|face palatine|face linguale|poche parodontale|sur la dent|sur la 1|sur la 2|sur la 3|sur la 4|mobilité de grade|indice de plaque|saignement au sondage/.test(L)) {
        // Rien n'était écrit sur l'odontogramme : la phrase annonçait une
        // mise à jour du schéma dentaire qui n'a jamais lieu. Un praticien
        // pouvait croire son relevé enregistré et ne jamais le ressaisir.
        botResponse = "Noté dans la file de saisie ci-dessous. Attention : rien n'est écrit sur l'odontogramme depuis cet assistant — reportez le relevé dans Consultation.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "CHARTING", content: cleanText, suggestion: "Mettre à jour l'Odontogramme 3D", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 🧘 GESTION DU STRESS & BIEN-ÊTRE PRATICIEN
      // ═══════════════════════════════════════════════════════════
      } else if (/je suis fatigué|fatigué|journée difficile|burnout|besoin d'une pause|trop de patients|stresser/.test(L)) {
        botResponse = "Rien n'a été bloqué dans l'agenda : cet assistant ne le modifie pas, et le cabinet n'a pas de commande d'ambiance. Si vous avez besoin de souffler, fermez les créneaux vous-même depuis l'Agenda.";
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
        botResponse = "Personne n'a été prévenu : cet assistant n'envoie aucun message et ne touche pas à l'agenda. Prévenez l'accueil directement, ou reportez le rendez-vous depuis l'Agenda.";
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
        botResponse = "Rien n'a été écrit au dossier : cet assistant ne met pas l'anamnèse à jour, et aucun protocole ne s'adapte tout seul. Reportez cette information dans le Questionnaire médical du patient — c'est elle qui déclenche les rappels d'allergie à l'ordonnance.";
        setChatHistory((p) => [...p, { role: "bot", text: "ALERTE MÉDICALE : Vérifier l'INR (si anticoagulants), l'HbA1c (si diabète), éviter les AINS (si grossesse/asthme). Adapter l'anesthésie (sans adrénaline si besoin).", type: "insight" }]);
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Mettre à jour le dossier médical (ALERTE ROUGE)", status: "pending", meta: { priority: "URGENT" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // ⭐ GESTION DE L'EXPÉRIENCE (AVIS & PLAINTES)
      // ═══════════════════════════════════════════════════════════
      } else if (/c'était parfait|c'etait parfait|rien senti|très bien|recommande|trop cher|mal parlé|attendu trop longtemps|longue attente|déçu|decu/.test(L)) {
        const isPositive = /parfait|rien senti|très bien|recommande/.test(L);
        botResponse = isPositive 
          ? "Merci pour votre confiance ! Ce retour n'est pas enregistré au dossier : notez-le dans les observations du patient si besoin."
          : "Nous sommes navrés pour cette expérience. Attention : cette plainte n'est ni enregistrée ni transmise à la direction depuis cet assistant — remontez-la directement.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "WHATSAPP", content: cleanText, suggestion: isPositive ? "Envoyer demande d'avis Google" : "Alerter la direction (Rattrapage commercial)", status: "pending", meta: { priority: isPositive ? "Normal" : "High" } }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 👤 DOSSIER PATIENT
      // ═══════════════════════════════════════════════════════════
      } else if (/dossier|patient|fiche|historique|antécédent|antecedent|medical|allergie/.test(L)) {
        botResponse = currentPatient
          ? `Dossier ouvert : ${currentPatient.name} — ${currentPatient.idNumber || ""}. Antécédents médicaux à vérifier avant tout acte.`
          : "Aucun dossier patient n'est ouvert. Sélectionnez un patient depuis l'agenda ou la recherche.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "PATIENT", content: cleanText, suggestion: "Ouvrir Fiche Complète + Questionnaire médical", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 💬 WHATSAPP & COMMUNICATION
      // ═══════════════════════════════════════════════════════════
      } else if (/whatsapp|message|sms|envoyer|notifier|rappel|confirmer rdv|annuler rdv|contact patient/.test(L)) {
        botResponse = "Aucun message n'est parti d'ici. Les confirmations et rappels se préparent dans Communication, qui montre ce qui est réellement en attente d'envoi.";
        setCommandQueue((p) => [{ id: Date.now().toString(36), type: "WHATSAPP", content: cleanText, suggestion: "Envoyer confirmation WhatsApp + rappel SMS", status: "pending" }, ...p]);

      // ═══════════════════════════════════════════════════════════
      // 📊 BASE GÉNÉRALE ENRICHIE
      // ═══════════════════════════════════════════════════════════
      } else {
        const kb = [
          { r: /horaire|heure|ouvert|ferme|disponible|quand/, a: "Le cabinet est ouvert lundi–vendredi 8h–19h et samedi 9h–13h. Urgences acceptées sans RDV." },
          { r: /adresse|situé|lieu|où|localisation|itinéraire|plan/, a: "Je ne connais pas les coordonnées du cabinet. Elles sont dans Configuration, telles que le cabinet les a saisies." },
          { r: /tarif|prix|coût|combien/, a: "Je ne connais pas les tarifs pratiqués. Le catalogue réel est dans Devis et dans le Catalogue des actes — annoncer un prix de mémoire exposerait le cabinet." },
          { r: /bonjour|salut|bonsoir|hello|bonne journée|bonne matinée/, a: "Bonjour. Je suis un aide-mémoire : je réponds sur les gestes et les protocoles, pas sur les données du cabinet." },
          { r: /merci|parfait|ok|super|bien|excellent|génial/, a: "Avec plaisir. Autre commande ?" },
          { r: /agenda|planning|calendrier|programme|emploi du temps/, a: "Je ne lis pas l'agenda. Ouvrez le module Agenda : il affiche les vrais rendez-vous du jour et les créneaux libres." },
          { r: /stock|matériel|materiel|commande|consommable|gants|masque|résine|amalgame/, a: "Je ne lis pas l'inventaire. Ouvrez le module Stocks : les quantités et les alertes y sont réelles." },
          { r: /chiffre d'affaires|ca|recettes|revenus|bilan|statistiques|performance/, a: "Je ne connais aucun chiffre du cabinet. Statistiques et Comptabilité les calculent sur les vraies factures — n'annoncez jamais un montant venu d'ici." },
          { r: /personnel|assistante|secretaire|infirmière|aide-soignant|equipe/, a: "Je ne connais pas la composition de l'équipe. Le module Utilisateurs liste les comptes réels et leurs rôles." },
          { r: /nutrition|alimentation|regime|sucre|acide|erosion|reflux/, a: "Conseils nutritionnels : Réduire les sucres raffinés (bissap, sodas) + boissons acides. Brosser 30 min après. Fluor 1450 ppm recommandé." },
          { r: /hygiène|brossage|dentifrice|fil dentaire|bain de bouche|brosse/, a: "Conseils hygiène : Brossage 2× /j · Fil dentaire 1× /j · Bain de bouche antibactérien. Brosse à dents changée tous les 3 mois." },
          { r: /téléconsultation|teleconsultation|en ligne|video|zoom|à distance/, a: "La téléconsultation vidéo se lance depuis le module Téléconsult, sur un rendez-vous du jour. Je ne connais pas son tarif au cabinet." },
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
        { role: "bot", text: "Erreur interne de l'assistant. Réessayez." },
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
      {/* Bouton flottant.
          Les deux bulles — assistant et messagerie interne — étaient empilées
          l'une au-dessus de l'autre : ensemble elles occupaient 130 px de haut
          contre le bord droit et recouvraient le contenu de travail, jusqu'à
          masquer un libellé de panneau sur téléphone. Elles tiennent
          désormais sur une seule ligne, plus petites, et portent un nom :
          deux ronds bleus sans libellé n'apprenaient rien à personne. */}
      <div className="fixed bottom-6 right-[4.75rem] z-[9999]">
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 0 24px rgba(59,130,246,0.5)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Fermer l'assistant" : "Assistant du cabinet"}
          aria-label={isOpen ? "Fermer l'assistant" : "Assistant du cabinet"}
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 border-2",
            isOpen
              ? "bg-slate-900 border-slate-700 text-white rotate-90"
              : "bg-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-500/40"
          )}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Brain className="h-6 w-6" />}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <Zap className="h-2.5 w-2.5 text-white fill-current" />
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
          className="fixed bottom-[9.5rem] right-6 z-[9998] w-[430px] max-w-[calc(100vw-1.5rem)] h-[660px] bg-white rounded-3xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.25)] border border-slate-200 overflow-hidden flex flex-col"
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
                          Aide-mémoire — à vérifier
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
                    Recherche…
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
