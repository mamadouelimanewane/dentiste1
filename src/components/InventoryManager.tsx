"use client";

import React, { useState } from "react";
import { Package, ShoppingCart, AlertTriangle, TrendingDown, Plus, Search, Filter, Box, AlertCircle, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function InventoryManager() {
  const [activeTab, setActiveTab] = useState<"Consommables" | "Implants" | "Commandes" | "Péremptions">("Consommables");

  const inventoryItems = [
    { id: 1, name: "Gants Nitrile Taille M", ref: "GLV-NIT-M", category: "EPI", stock: 12, min: 20, status: "low" },
    { id: 2, name: "Résine Composite A2", ref: "CMP-A2-SYR", category: "Restauration", stock: 45, min: 10, status: "ok" },
    { id: 3, name: "Implant Titane Ø4.0 x 10mm", ref: "IMP-T4010", category: "Chirurgie", stock: 2, min: 5, status: "critical" },
    { id: 4, name: "Aiguilles Anesthésie 30G", ref: "NDL-30G-S", category: "Anesthésie", stock: 150, min: 50, status: "ok" },
    { id: 5, name: "Ciment Scellement Verre Ionomère", ref: "CEM-GI-01", category: "Prothèse", stock: 0, min: 5, status: "out" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER BAR - DASHBOARD STYLE */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <Package className="h-6 w-6 text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Inventory Manager Pro</h2>
            <div className="flex items-center gap-2">
              <Box className="h-3 w-3 text-fuchsia-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock & Commandes</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
           <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded transition-colors">
            <Filter className="h-4 w-4" /> Filtres
          </button>
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[#1E3A8A] hover:bg-blue-900 text-white px-5 py-2.5 rounded-sm transition-colors shadow-md shadow-blue-900/20">
            <ShoppingCart className="h-4 w-4" /> Nouvelle Commande
          </button>
        </div>
      </div>

      <div className="bg-[#0F172A] text-white p-6 rounded-sm flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <h3 className="text-lg font-black uppercase tracking-widest text-fuchsia-400">Gestion Intelligente des Consommables</h3>
          <p className="text-slate-300 text-xs font-medium">Suivi en temps réel des stocks, alertes de rupture et gestion des dates de péremption.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-fuchsia-500/20 to-transparent" />
        <Package className="absolute -right-4 -top-4 h-32 w-32 text-fuchsia-500 opacity-20" />
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Valeur du Stock", value: "3.2M CFA", icon: TrendingDown, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Articles en Stock", value: "842", icon: Box, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Alertes Rupture", value: "3", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", alert: true },
          { label: "Commandes en cours", value: "2", icon: ShoppingCart, color: "text-indigo-500", bg: "bg-indigo-50" },
        ].map((kpi, i) => (
          <div key={i} className={cn("bg-white border p-5 rounded-sm shadow-sm flex flex-col justify-center relative overflow-hidden", kpi.alert ? "border-amber-200" : "border-slate-200")}>
             {kpi.alert && <div className="absolute top-0 right-0 h-full w-1 bg-amber-400" />}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* MAIN LIST */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-sm shadow-sm flex-wrap gap-4">
            <div className="flex gap-2 border-b md:border-b-0 border-slate-200 pb-2 md:pb-0 w-full md:w-auto overflow-x-auto">
              {["Consommables", "Implants", "Commandes", "Péremptions"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all whitespace-nowrap",
                    activeTab === tab ? "bg-fuchsia-50 text-fuchsia-700" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm w-full md:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input type="text" placeholder="Rechercher par ref ou nom..." className="bg-transparent border-none text-[10px] font-bold outline-none w-full uppercase" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <th className="p-4">Réf.</th>
                    <th className="p-4">Désignation</th>
                    <th className="p-4">Catégorie</th>
                    <th className="p-4 text-right">Stock Actuel</th>
                    <th className="p-4 text-center">Statut</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 text-xs font-bold text-slate-500">{item.ref}</td>
                      <td className="p-4">
                        <p className="text-sm font-black text-slate-900">{item.name}</p>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                           <span className={cn(
                             "text-sm font-black",
                             item.status === 'out' ? "text-rose-600" : 
                             item.status === 'critical' ? "text-rose-600" :
                             item.status === 'low' ? "text-amber-500" : "text-slate-900"
                           )}>
                             {item.stock}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min: {item.min}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {item.status === 'ok' && <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest"><CheckCircle2 className="h-3 w-3" /> En Stock</span>}
                        {item.status === 'low' && <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest"><AlertTriangle className="h-3 w-3" /> Bas</span>}
                        {(item.status === 'critical' || item.status === 'out') && <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest"><AlertCircle className="h-3 w-3" /> Rupture</span>}
                      </td>
                      <td className="p-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SIDE PANEL - ACTIONS RAPIDES */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-100 p-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" /> Scanner Code-Barres
                </h3>
             </div>
             <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                  <ScanBarcodeIcon className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  En attente de scan...
                </p>
                <button className="w-full bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors mt-2">
                  Saisie Manuelle
                </button>
             </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 space-y-3">
             <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
               <AlertTriangle className="h-4 w-4" /> Action Requise
             </h4>
             <p className="text-xs text-amber-900 font-medium leading-relaxed">
               3 articles sont en dessous de leur seuil d'alerte. Une commande fournisseur est recommandée.
             </p>
             <button className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors shadow-md shadow-amber-900/20">
               Générer Bon de Commande
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanBarcodeIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M8 7v10" />
      <path d="M12 7v10" />
      <path d="M17 7v10" />
    </svg>
  );
}
