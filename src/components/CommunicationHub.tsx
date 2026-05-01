"use client";

import React, { useState } from "react";
import { 
  MessageCircle, 
  MessageSquare, 
  Mail, 
  Send, 
  History, 
  Zap, 
  BarChart, 
  Settings, 
  Plus, 
  Search, 
  Users, 
  CheckCircle, 
  Clock, 
  Activity, 
  SendHorizontal,
  Bell,
  Smartphone,
  ChevronRight,
  MoreVertical,
  Calendar,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function CommunicationHub() {
  const [activeTab, setActiveTab] = useState<"Envoyer" | "Historique" | "Automatisation" | "Analytique">("Envoyer");
  const [channel, setChannel] = useState<"WhatsApp" | "SMS" | "Email">("WhatsApp");
  const [message, setMessage] = useState("");

  const calculateCost = () => {
    if (message.length === 0) return 0;
    if (channel === "WhatsApp") return 15;
    if (channel === "SMS") return Math.ceil(message.length / 160) * 25;
    return 0;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* ELITE HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 bg-emerald-600 text-white rounded flex items-center justify-center shadow-xl shadow-emerald-900/10">
            <MessageCircle className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tighter">Elite Communication Suite</h2>
            <div className="flex items-center gap-2 mt-1">
              <Zap className="h-3 w-3 text-amber-500 fill-current" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">WhatsApp & SMS Automation Core</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex flex-col text-right mr-4 border-r border-slate-100 pr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase">Statut API Gateway</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1 justify-end">
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> Connecté
            </span>
          </div>
          <button className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/20">
            <Plus className="h-4 w-4 text-emerald-400" /> Nouvelle Campagne
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-sm shadow-sm overflow-x-auto hide-scrollbar">
        {[
          { id: "Envoyer", icon: SendHorizontal },
          { id: "Historique", icon: History },
          { id: "Automatisation", icon: Zap },
          { id: "Analytique", icon: BarChart }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-md" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-emerald-400" : "text-slate-400")} /> 
            {tab.id}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COMPOSER & PREVIEW */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* Editor Area */}
            <div className="flex-1 p-6 border-r border-slate-100 space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" /> Composer
                  </h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-sm">
                    {["WhatsApp", "SMS", "Email"].map((c) => (
                      <button 
                        key={c}
                        onClick={() => setChannel(c as any)}
                        className={cn(
                          "px-3 py-1 text-[8px] font-black uppercase rounded-sm transition-all",
                          channel === c ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm">
                    <Users className="h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Rechercher des patients..." className="bg-transparent border-none text-[10px] font-bold outline-none w-full uppercase" />
                  </div>

                  <div className="relative">
                    <textarea 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tapez votre message ici..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-sm p-4 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 min-h-[180px] resize-none transition-all"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-3">
                       <span className="text-[9px] font-bold text-slate-400">{message.length} Caractères</span>
                       <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">{calculateCost()} FCFA</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all">
                       <Calendar className="h-4 w-4" /> Programmer
                     </button>
                     <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200">
                       <SendHorizontal className="h-4 w-4" /> Envoyer Immédiat
                     </button>
                  </div>
               </div>
            </div>

            {/* Visual Preview Area (Smartphone style) */}
            <div className="w-full md:w-[300px] bg-slate-50 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Aperçu du Rendu</p>
               <div className="w-full max-w-[240px] aspect-[9/18.5] bg-slate-900 rounded-[32px] border-[6px] border-slate-800 shadow-2xl relative overflow-hidden flex flex-col">
                  {/* Status Bar */}
                  <div className="h-6 bg-slate-900 flex justify-between items-center px-6 pt-2">
                    <span className="text-[8px] text-white font-bold">14:15</span>
                    <div className="flex gap-1 items-center">
                       <Activity className="h-2.5 w-2.5 text-white/40" />
                       <div className="h-2 w-4 bg-white/40 rounded-sm" />
                    </div>
                  </div>
                  {/* Chat Header */}
                  <div className="bg-emerald-800 p-3 flex items-center gap-2 flex-shrink-0">
                    <div className="h-6 w-6 bg-emerald-700 rounded-full flex items-center justify-center"><Smartphone className="h-3 w-3 text-white" /></div>
                    <div>
                       <p className="text-[9px] font-black text-white">Cabinet DentoPro</p>
                       <p className="text-[7px] text-emerald-300">En ligne</p>
                    </div>
                  </div>
                  {/* Chat Body */}
                  <div className="flex-1 bg-[#E5DDD5] p-3 space-y-2 overflow-y-auto">
                    <div className="bg-white p-2.5 rounded-sm rounded-tl-none shadow-sm max-w-[85%] relative">
                       <p className="text-[10px] text-slate-800 leading-tight">
                         {message || "Votre message s'affichera ici..."}
                       </p>
                       <span className="text-[7px] text-slate-400 absolute bottom-1 right-1">14:15</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* AUTOMATION CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-4 shadow-sm hover:border-emerald-200 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                   <div className="h-10 w-10 bg-emerald-50 rounded flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                      <Bell className="h-5 w-5 text-emerald-600 group-hover:text-white" />
                   </div>
                   <div className="h-4 w-8 bg-emerald-100 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 h-3 w-3 bg-emerald-600 rounded-full shadow-sm" />
                   </div>
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Rappels de Rendez-vous</h4>
                   <p className="text-xs text-slate-500 mt-1">Envoi automatique 24h avant chaque rendez-vous via WhatsApp.</p>
                </div>
                <div className="pt-2 flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase">
                   <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> 142 ce mois</span>
                   <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> Automatisé</span>
                </div>
             </div>

             <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-4 shadow-sm hover:border-blue-200 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between">
                   <div className="h-10 w-10 bg-blue-50 rounded flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Activity className="h-5 w-5 text-blue-600 group-hover:text-white" />
                   </div>
                   <div className="h-4 w-8 bg-blue-100 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 h-3 w-3 bg-blue-600 rounded-full shadow-sm" />
                   </div>
                </div>
                <div>
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Suivi Post-Opératoire</h4>
                   <p className="text-xs text-slate-500 mt-1">Check-in automatique 2h après une extraction chirurgicale.</p>
                </div>
                <div className="pt-2 flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase">
                   <span className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> 28 ce mois</span>
                   <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" /> Automatisé</span>
                </div>
             </div>
          </div>
        </div>

        {/* SIDE LOG & PERFORMANCE */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 text-white rounded-sm p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Performances Hub</h4>
                 <div className="space-y-4 pt-4 border-t border-white/10">
                    <div>
                       <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                          <span>Délivrabilité</span>
                          <span className="text-emerald-400">99.8%</span>
                       </div>
                       <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[99%]" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                          <span>Taux d'Ouverture</span>
                          <span className="text-blue-400">84.2%</span>
                       </div>
                       <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[84%]" />
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                       <p className="text-xl font-black">1.2k</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase">Envois (30j)</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-sm border border-white/5">
                       <p className="text-xl font-black text-emerald-400">94%</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase">Confirmés</p>
                    </div>
                 </div>
              </div>
              <BarChart className="absolute -right-4 -bottom-4 h-32 w-32 text-white/5" />
           </div>

           <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col max-h-[400px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Derniers Envois</h4>
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="p-2 overflow-y-auto space-y-1">
                 {[
                   { name: "Mamadou Fall", time: "14:05", status: "Lu", channel: "WA", msg: "Bonjour, votre RDV est confirmé..." },
                   { name: "Aïssatou Sow", time: "13:42", status: "Envoyé", channel: "SMS", msg: "Merci pour votre visite ce jour..." },
                   { name: "Fatou Diop", time: "12:15", status: "Erreur", channel: "WA", msg: "Votre devis est disponible..." },
                   { name: "Ousmane Kane", time: "11:20", status: "Lu", channel: "WA", msg: "Rappel RDV : Demain 09:30" }
                 ].map((log, i) => (
                   <div key={i} className="flex flex-col p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-[10px] font-black text-slate-900 group-hover:text-blue-600">{log.name}</span>
                         <span className="text-[8px] font-bold text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{log.msg}</p>
                      <div className="flex items-center justify-between mt-2">
                         <div className="flex items-center gap-1.5">
                            <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-black", log.channel === "WA" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{log.channel}</div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{log.status}</span>
                         </div>
                         <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
