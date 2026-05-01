"use client";

import React, { useState } from "react";
import { MessageCircle, MessageSquare, Mail, Send, History, Zap, BarChart, Settings, Plus, Search, Users, CheckCircle, Clock, Activity, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunicationHub() {
  const [activeTab, setActiveTab] = useState<"Envoyer" | "Historique" | "Automatisation" | "Analytique">("Envoyer");
  const [channel, setChannel] = useState<"WhatsApp" | "SMS" | "Email">("WhatsApp");
  const [message, setMessage] = useState("");

  const calculateCost = () => {
    if (message.length === 0) return 0;
    if (channel === "WhatsApp") return 15;
    if (channel === "SMS") return Math.ceil(message.length / 160) * 25;
    return 0; // Email is virtually free in this context
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER BAR - DASHBOARD STYLE */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <MessageCircle className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">WhatsApp & SMS Hub</h2>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-amber-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Communication Multicanal</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
           <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded transition-colors">
            <Settings className="h-4 w-4" /> Paramètres
          </button>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[#1E3A8A] hover:bg-blue-900 text-white px-5 py-2.5 rounded-sm transition-colors shadow-md shadow-blue-900/20">
            <Plus className="h-4 w-4" /> Nouvelle Campagne
          </button>
        </div>
      </div>

      <div className="bg-[#0F172A] text-white p-6 rounded-sm flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h3 className="text-lg font-black uppercase tracking-widest text-green-400">Gestion Automatisée</h3>
          <p className="text-slate-300 text-xs font-medium">Gestion automatisée des rendez-vous, rappels et documents patients.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-green-500/20 to-transparent" />
        <Send className="absolute -right-4 -top-4 h-32 w-32 text-green-500 opacity-20" />
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Messages Envoyés (30j)", value: "9", icon: SendHorizontal, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Taux de Délivrabilité", value: "100.0%", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Confirmations RDV", value: "94%", icon: Activity, color: "text-indigo-500", bg: "bg-indigo-50" },
          { label: "Coût Moyen/Message", value: "25 FCFA", icon: BarChart, color: "text-amber-500", bg: "bg-amber-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2">
               <div className={cn("p-1.5 rounded", kpi.bg)}>
                 <kpi.icon className={cn("h-4 w-4", kpi.color)} />
               </div>
             </div>
             <span className="text-2xl font-black text-slate-900">{kpi.value}</span>
             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{kpi.label}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto hide-scrollbar">
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
              "flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
              activeTab === tab.id 
                ? "border-blue-600 text-blue-700 bg-white" 
                : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.id}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COMPOSER */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" /> Composer un Message
            </h3>
            
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Canal de Communication</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setChannel("WhatsApp")}
                  className={cn("flex-1 py-3 border rounded-sm flex items-center justify-center gap-2 text-xs font-bold transition-all", channel === "WhatsApp" ? "bg-green-50 border-green-300 text-green-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
                <button 
                  onClick={() => setChannel("SMS")}
                  className={cn("flex-1 py-3 border rounded-sm flex items-center justify-center gap-2 text-xs font-bold transition-all", channel === "SMS" ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}
                >
                  <MessageSquare className="h-4 w-4" /> SMS
                </button>
                <button 
                  onClick={() => setChannel("Email")}
                  className={cn("flex-1 py-3 border rounded-sm flex items-center justify-center gap-2 text-xs font-bold transition-all", channel === "Email" ? "bg-slate-800 border-slate-900 text-white shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50")}
                >
                  <Mail className="h-4 w-4" /> Email
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Message</label>
                 <div className="flex gap-2">
                   <select 
                    onChange={(e) => setMessage(e.target.value)}
                    className="text-[9px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded outline-none cursor-pointer"
                   >
                     <option value="">Sélectionner un modèle</option>
                     <option value="Bonjour {patient}, nous vous confirmons votre RDV du {date} à {heure}. À demain !">Confirmation RDV</option>
                     <option value="Bonjour {patient}, comment vous sentez-vous après votre intervention ? N'hésitez pas à nous contacter.">Suivi Post-Op</option>
                     <option value="Bonjour {patient}, votre devis est prêt. Vous pouvez le consulter sur votre espace patient.">Devis disponible</option>
                   </select>
                 </div>
              </div>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tapez votre message ici... Utilisez {patient}, {date}, {heure} pour personnaliser"
                className="w-full bg-slate-50 border border-slate-200 rounded-sm p-4 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 min-h-[150px] resize-none focus:bg-white transition-all"
              />
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>{message.length} caractères</span>
                <span className={cn(calculateCost() > 0 ? "text-amber-600" : "")}>Coût estimé: {calculateCost()} FCFA</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Destinataires</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-sm shadow-inner">
                <Search className="h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Rechercher un patient..." className="bg-transparent border-none text-xs font-bold outline-none w-full" />
              </div>
              <div className="bg-slate-50 border border-slate-100 border-dashed rounded-sm p-4 text-center">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aucun patient sélectionné</p>
              </div>
            </div>

            <div className="pt-2">
              <button 
                disabled={message.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-blue-900 text-white px-5 py-3.5 rounded-sm text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                <SendHorizontal className="h-4 w-4" /> Envoyer Maintenant
              </button>
            </div>
          </div>
        </div>

        {/* ACTIONS RAPIDES */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" /> Actions Rapides
                </h3>
             </div>
             <div className="divide-y divide-slate-100">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-blue-50 rounded flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Rappels RDV Demain</span>
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded">12</span>
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-amber-50 rounded flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <CheckCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Confirmations en attente</span>
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded">8</span>
                </button>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Flux d'Envoi Direct</h3>
             </div>
             <div className="p-4 space-y-4">
                {[
                  { name: "M. Diallo", status: "Délivré", time: "10:42", channel: "WA" },
                  { name: "Mme. Sow", status: "Envoi...", time: "10:55", channel: "SMS" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className={cn("h-6 w-6 rounded flex items-center justify-center text-[8px] font-black", s.channel === "WA" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{s.channel}</div>
                       <div>
                          <p className="text-[10px] font-black text-slate-900">{s.name}</p>
                          <p className="text-[8px] font-bold text-slate-400">{s.time}</p>
                       </div>
                    </div>
                    <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded", s.status === "Délivré" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400 animate-pulse")}>{s.status}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
