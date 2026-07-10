"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageCircle, 
  Smartphone, 
  Search, 
  CheckCheck, 
  Clock, 
  Calendar, 
  User, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  MoreVertical,
  Plus,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DemoModeBadge } from "@/components/DemoModeBadge";

interface WhatsAppMessage {
  id: string;
  sender: string;
  phone: string;
  text: string;
  time: string;
  isAIProcessed: boolean;
  suggestion?: {
    type: "RDV" | "INFO" | "FOLLOWUP";
    text: string;
    action: string;
    meta?: any;
  };
}

export function WhatsAppIntelligentHub() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([
    {
      id: "1",
      sender: "Mamadou Dia",
      phone: "221770000001",
      text: "Bonjour, je voudrais un rendez-vous mardi prochain pour un détartrage s'il vous plaît.",
      time: "14:20",
      isAIProcessed: true,
      suggestion: {
        type: "RDV",
        text: "Mamadou souhaite un détartrage mardi (30 avr.).",
        action: "Programmer à 10:00"
      }
    },
    {
      id: "2",
      sender: "Aïssatou Sow",
      phone: "221770000002",
      text: "Est-ce que je peux avoir mon ordonnance par WhatsApp ?",
      time: "13:45",
      isAIProcessed: true,
      suggestion: {
        type: "INFO",
        text: "Demande de document médical.",
        action: "Envoyer PDF"
      }
    },
    {
      id: "3",
      sender: "Fatou Diop",
      phone: "221770000003",
      text: "Merci pour les soins d'hier, je n'ai plus mal !",
      time: "10:12",
      isAIProcessed: false
    },
    {
      id: "4",
      sender: "Dr. Neural Bot",
      phone: "",
      text: "👋 Bonjour ! Je suis l'assistant automatique du cabinet. Comment puis-je vous aider ? (Horaires, Adresse, RDV...)",
      time: "10:00",
      isAIProcessed: false
    }
  ]);

  const [activeChat, setActiveChat] = useState<string | null>("1");
  const [inputText, setInputText] = useState("");
  const seenLogIds = React.useRef(new Set<string>());

  useEffect(() => {
    const mapLog = (log: any): WhatsAppMessage => ({
      id: log.id.toString(),
      sender: "Assistant Neural (IA)",
      phone: "",
      text: log.content,
      time: new Date(log.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      isAIProcessed: true,
      suggestion: {
        type: "INFO",
        text: log.suggestion || "Action WhatsApp requise",
        action: "Envoyer Message",
        meta: log.meta_data,
      }
    });

    const fetchWhatsAppLogs = async (isInitial: boolean) => {
      const res = await fetch("/api/neural-logs?command_type=WHATSAPP&limit=50");
      const data = await res.json();
      if (!res.ok || !data.logs) return;

      const newLogs = data.logs.filter((log: any) => !seenLogIds.current.has(log.id.toString()));
      newLogs.forEach((log: any) => seenLogIds.current.add(log.id.toString()));

      if (isInitial) {
        setMessages(prev => [...data.logs.map(mapLog), ...prev]);
      } else if (newLogs.length > 0) {
        setMessages(prev => [...newLogs.map(mapLog), ...prev]);
      }
    };

    fetchWhatsAppLogs(true);
    // Pas de push temps réel sur Neon : on rafraîchit par polling toutes les 5s.
    const interval = setInterval(() => fetchWhatsAppLogs(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText) return;
    const text = inputText;
    const targetPhone = selectedChat?.phone || "221770000000";

    const newMessage: WhatsAppMessage = {
      id: Date.now().toString(),
      sender: "Cabinet (Moi)",
      phone: targetPhone,
      text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      isAIProcessed: false
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");

    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone, message: text }),
      });
    } catch {
      // Le message reste visible localement même si l'envoi réseau échoue ;
      // /api/whatsapp/send journalise déjà l'échec côté serveur.
    }

    // Automated Bot Logic
    const lowText = text.toLowerCase();
    setTimeout(() => {
       let botReply = "";
       if (lowText.includes("horaire")) botReply = "Nous sommes ouverts de 8h à 19h en semaine.";
       else if (lowText.includes("adresse")) botReply = "Nous sommes au Plateau, Rue de Thiong, Dakar.";
       else if (lowText.includes("tarif")) botReply = "Nos tarifs débutent à 25.000 FCFA pour un détartrage.";

       if (botReply) {
         setMessages(prev => [...prev, {
           id: (Date.now() + 1).toString(),
           sender: "Dr. Neural Bot",
           phone: "",
           text: botReply,
           time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
           isAIProcessed: true
         }]);
       }
    }, 1000);
  };

  const handleExecuteSuggestion = async (msg: WhatsAppMessage) => {
    if (!msg.suggestion) return;
    await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: msg.phone || "221770000000",
        message: "Bonjour ! Nous faisons suite à votre demande concernant : " + msg.suggestion.text,
      }),
    });
  };

  const selectedChat = messages.find(m => m.id === activeChat);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ELITE HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 bg-emerald-600 text-white rounded flex items-center justify-center shadow-xl shadow-emerald-900/10">
            <MessageCircle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter">Intelligent WhatsApp Hub</h2>
            <div className="flex items-center gap-2 mt-1">
              <Sparkles className="h-3 w-3 text-emerald-500 fill-current" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Neural NLP Response Core v2</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <DemoModeBadge feature="whatsapp" />
           <div className="flex flex-col text-right">
              <span className="text-xs font-black text-slate-400 uppercase">Synchronisation Agenda</span>
              <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1 justify-end">
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> Temps Réel
              </span>
           </div>
           <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              <Plus className="h-5 w-5" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[650px]">
        {/* CONTACTS LIST */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col overflow-hidden">
           <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                 <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                 <input 
                   type="text" 
                   placeholder="Rechercher une conversation..." 
                   className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-9 pr-4 text-xs font-bold uppercase outline-none focus:border-emerald-400 transition-all"
                 />
              </div>
           </div>
           <div className="flex-1 overflow-y-auto">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  onClick={() => setActiveChat(msg.id)}
                  className={cn(
                    "p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 relative group",
                    activeChat === msg.id ? "bg-emerald-50/50 border-r-4 border-r-emerald-500" : ""
                  )}
                >
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                         {msg.sender.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-0.5">
                            <span className="text-sm font-black text-slate-900 truncate">{msg.sender}</span>
                            <span className="text-[10px] font-bold text-slate-400">{msg.time}</span>
                         </div>
                         <p className="text-xs text-slate-500 truncate font-medium">
                            {msg.text}
                         </p>
                      </div>
                   </div>
                   {msg.isAIProcessed && (
                      <div className="absolute right-4 bottom-4">
                         <div className="h-4 w-4 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Zap className="h-2.5 w-2.5 text-emerald-600 fill-current" />
                         </div>
                      </div>
                   )}
                </div>
              ))}
           </div>
        </div>

        {/* CHAT AREA */}
        <div className="lg:col-span-8 flex flex-col gap-6">
           <div className="flex-1 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col overflow-hidden relative">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                       {selectedChat?.sender.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                       <h4 className="text-sm font-black text-slate-900">{selectedChat?.sender}</h4>
                       <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En ligne</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-slate-400">
                    <Calendar className="h-4 w-4 hover:text-emerald-600 cursor-pointer transition-colors" />
                    <User className="h-4 w-4 hover:text-emerald-600 cursor-pointer transition-colors" />
                    <MoreVertical className="h-4 w-4" />
                 </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 bg-[#E5DDD5] p-8 overflow-y-auto space-y-4 flex flex-col">
                 <div className="mx-auto bg-blue-100/80 text-blue-800 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                    Aujourd'hui
                 </div>

                 {messages.filter(m => m.id === activeChat || m.sender.includes("Moi") || m.sender.includes("Bot")).map((m, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "max-w-[75%] p-4 rounded-2xl shadow-sm relative group mb-2 transition-all",
                        m.sender.includes("Moi") || m.sender.includes("Bot")
                          ? "self-end bg-[#DCF8C6] rounded-tr-none" 
                          : "self-start bg-white rounded-tl-none hover:shadow-md"
                      )}
                    >
                       <p className="text-sm font-medium text-slate-800 leading-relaxed">
                          {m.text}
                       </p>
                       <div className="flex items-center justify-end gap-1 mt-2">
                          <span className="text-[10px] text-slate-400 font-bold">{m.time}</span>
                          {(m.sender.includes("Moi") || m.sender.includes("Bot")) && <CheckCheck className="h-3 w-3 text-blue-500" />}
                       </div>

                       {/* AI Analysis Overlay for Patient Messages */}
                       {m.isAIProcessed && !m.sender.includes("Moi") && m.suggestion ? (
                          <div className="mt-4 border-l-2 border-emerald-500 pl-4 py-2 space-y-3 bg-emerald-50/30 rounded-r-xl">
                             <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Action Suggérée</span>
                             </div>
                             <div className="bg-white border border-emerald-100 p-4 rounded-xl shadow-sm space-y-3">
                                <p className="text-sm font-bold text-slate-700 italic">
                                  "{m.suggestion.text}"
                                </p>
                                <button
                                   onClick={() => handleExecuteSuggestion(m)}
                                   className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10">
                                   <CheckCircle2 className="h-4 w-4" />
                                   {m.suggestion.action}
                                </button>
                             </div>
                          </div>
                       ) : !m.sender.includes("Moi") && !m.sender.includes("Bot") && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                             <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                                <Sparkles className="h-3 w-3 fill-current" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Consulter Assistant Neural</span>
                             </button>
                          </div>
                       )}
                    </div>
                 ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-4">
                 <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Smartphone className="h-5 w-5" />
                 </div>
                 <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Répondre..." 
                      className="w-full bg-slate-100 border-none rounded-full py-3.5 px-6 text-sm font-medium outline-none focus:ring-2 ring-emerald-500/20"
                    />
                    <div className="absolute right-3 top-2 flex items-center gap-2">
                       <Zap className="h-4 w-4 text-emerald-500 cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                 </div>
                 <button 
                   onClick={handleSendMessage}
                   className="h-12 w-12 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
                 >
                    <Send className="h-5 w-5" />
                 </button>
              </div>
                 <div className="bg-slate-900 rounded-sm p-6 text-white grid grid-cols-3 gap-8 relative overflow-hidden">
               <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4 text-emerald-400" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">NLP Accuracy</span>
                  </div>
                  <p className="text-3xl font-black">98.4%</p>
               </div>
               <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2">
                     <Clock className="h-4 w-4 text-blue-400" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Avg Response</span>
                  </div>
                  <p className="text-3xl font-black">1.2s</p>
               </div>
               <div className="space-y-2 relative z-10">
                  <div className="flex items-center gap-2">
                     <Zap className="h-4 w-4 text-amber-400" />
                     <span className="text-xs font-black uppercase tracking-widest text-slate-400">Auto-Resolved</span>
                  </div>
                  <p className="text-3xl font-black">72%</p>
               </div>
               <Sparkles className="absolute -right-8 -bottom-8 h-32 w-32 text-white/5 rotate-12" />
            </div>
         </div>
         </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
