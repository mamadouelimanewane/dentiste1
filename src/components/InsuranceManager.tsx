"use client";

import React, { useState } from "react";
import { ShieldCheck, FileText, Landmark, Search, Plus, Filter, CheckCircle, AlertCircle, TrendingUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function InsuranceManager() {
  const [activeTab, setActiveTab] = useState<"Prises en charge" | "Conventions" | "Règlements">("Prises en charge");

  const insuranceClaims = [
    { id: 1, patient: "Mamadou Diallo", insurance: "AXA Assurances", type: "IPM", status: "Validé", amount: "45,000 F", date: "01/05/2026" },
    { id: 2, patient: "Fatou Diop", insurance: "Gras Savoye", type: "Mutuelle", status: "En attente", amount: "120,000 F", date: "30/04/2026" },
    { id: 3, patient: "Ousmane Kane", insurance: "ASCOMA", type: "Assurance", status: "Partiel", amount: "85,000 F", date: "28/04/2026" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-blue-900 text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Gestion des Mutuelles</h2>
            <div className="flex items-center gap-2">
              <Landmark className="h-3 w-3 text-blue-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assurances & IPM</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow-md flex items-center gap-2">
            <Plus className="h-4 w-4" /> Demande PEC
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "PEC en attente", value: "8", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Règlements reçus (M)", value: "2.4M F", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Taux de Prise en Charge", value: "72%", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded", kpi.bg)}>
                  <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</span>
             </div>
             <span className="text-2xl font-black text-slate-900">{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50">
          {["Prises en charge", "Conventions", "Règlements"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-white text-blue-600 border-t-2 border-blue-600" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="p-3">Patient</th>
                  <th className="p-3">Assureur / IPM</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {insuranceClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 text-xs">{claim.patient}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <div>
                          <p className="text-xs font-black text-slate-700">{claim.insurance}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{claim.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-black text-slate-900 text-xs">{claim.amount}</td>
                    <td className="p-3 text-xs text-slate-500">{claim.date}</td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        claim.status === "Validé" ? "bg-emerald-100 text-emerald-700" :
                        claim.status === "Partiel" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => alert(`Détails de la prise en charge pour ${claim.patient}`)}
                        className="text-slate-400 hover:text-blue-600 font-bold text-[9px] uppercase tracking-widest"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-5 rounded-sm flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
               <FileText className="h-6 w-6" />
            </div>
            <div>
               <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Conventions Nationales</h4>
               <p className="text-xs text-blue-700 font-medium">Vous avez 12 conventions actives avec les assureurs locaux.</p>
            </div>
         </div>
         <button 
           onClick={() => alert("Ouverture du gestionnaire de conventions...")}
           className="bg-blue-600 text-white px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all"
         >
            Gérer les Conventions
         </button>
      </div>
    </div>
  );
}
