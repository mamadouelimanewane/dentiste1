"use client";

import React, { useState } from 'react';
import { Calculator, TrendingUp, FileText, CheckCircle2, Clock, BookOpen, Layers, Edit3, Download, Upload, Filter, Save, Plus, FileSpreadsheet, BarChart3, ListTree } from 'lucide-react';
import { cn } from "@/lib/utils";

export function AccountingDashboard() {
  const [activeTab, setActiveTab] = useState<"Brouillard" | "Saisie" | "Journaux" | "Balance" | "Editions">("Brouillard");
  const [selectedJournal, setSelectedJournal] = useState("Tous");

  const exportExcel = () => {
    alert("Exportation Excel (XLSX) générée avec succès.");
  };

  const importData = () => {
    alert("Ouverture de l'assistant d'importation des écritures (CSV/XLSX).");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       {/* HEADER & GLOBAL ACTIONS */}
       <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <Calculator className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Suite Comptable OHADA</h2>
            <div className="flex items-center gap-2">
              <BookOpen className="h-3 w-3 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SYSCOA - Expert Edition</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
           <button onClick={importData} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded transition-colors border border-slate-200">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-sm transition-colors shadow-md shadow-emerald-900/20">
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

       {/* KPIs */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Solde Trésorerie (521+571)</p>
           <p className="text-2xl font-black text-slate-900 mt-2">12.5M <span className="text-xs text-slate-400">FCFA</span></p>
         </div>
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-blue-600">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Créances Patients (411)</p>
           <p className="text-2xl font-black text-slate-900 mt-2">2.1M <span className="text-xs text-slate-400">FCFA</span></p>
         </div>
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-rose-500">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dettes Frs (401)</p>
           <p className="text-2xl font-black text-slate-900 mt-2">850K <span className="text-xs text-slate-400">FCFA</span></p>
         </div>
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Écritures en Brouillard</p>
           <p className="text-2xl font-black text-slate-900 mt-2">14 <span className="text-xs text-slate-400">Lignes</span></p>
         </div>
       </div>

       {/* MODULE CONTENT */}
       <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col min-h-[500px]">
         {/* TABS MENU */}
         <div className="bg-slate-50 border-b border-slate-200 flex flex-wrap overflow-x-auto hide-scrollbar">
           {[
             { id: "Saisie", icon: Edit3, label: "Saisie d'Écritures" },
             { id: "Brouillard", icon: CheckCircle2, label: "Brouillard" },
             { id: "Journaux", icon: BookOpen, label: "Consultation Journaux" },
             { id: "Balance", icon: ListTree, label: "Balance & Grand Livre" },
             { id: "Editions", icon: BarChart3, label: "Éditions Financières" }
           ].map((tab) => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={cn(
                 "flex items-center gap-2 px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                 activeTab === tab.id ? "bg-white border-emerald-500 text-emerald-700 shadow-sm" : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
               )}
             >
               <tab.icon className="h-4 w-4" /> {tab.label}
             </button>
           ))}
         </div>

         <div className="p-0 flex-1">
           {/* TAB: SAISIE */}
           {activeTab === "Saisie" && (
             <div className="p-6 bg-slate-50/50 h-full">
               <div className="bg-white border border-slate-200 rounded shadow-sm p-6 max-w-4xl mx-auto space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">Saisie Manuelle d'Écritures</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Date</label>
                      <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm font-bold text-slate-800" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-slate-500">Journal</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm font-bold text-slate-800">
                        <option>VT - Ventes</option>
                        <option>AC - Achats</option>
                        <option>BQ - Banque</option>
                        <option>CA - Caisse</option>
                        <option>OD - Opérations Diverses</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase text-slate-500">N° Pièce</label>
                      <input type="text" placeholder="Ex: FAC-2026-04" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm font-bold text-slate-800" />
                    </div>
                 </div>

                 <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-widest border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-1/4">Compte SYSCOA</th>
                          <th className="p-3 w-1/3">Libellé</th>
                          <th className="p-3">Débit</th>
                          <th className="p-3">Crédit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        <tr>
                          <td className="p-2"><input type="text" placeholder="7061" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold" /></td>
                          <td className="p-2"><input type="text" placeholder="Honoraires Soins" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold" /></td>
                          <td className="p-2"><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-right" /></td>
                          <td className="p-2"><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-right" /></td>
                        </tr>
                        <tr>
                          <td className="p-2"><input type="text" placeholder="4111" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold" /></td>
                          <td className="p-2"><input type="text" placeholder="Client Diallo" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold" /></td>
                          <td className="p-2"><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-right" /></td>
                          <td className="p-2"><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold text-right" /></td>
                        </tr>
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-black text-xs">
                        <tr>
                           <td colSpan={2} className="p-3 text-right text-slate-500 uppercase tracking-widest">Total</td>
                           <td className="p-3 text-right text-emerald-600">0</td>
                           <td className="p-3 text-right text-blue-600">0</td>
                        </tr>
                      </tfoot>
                    </table>
                 </div>

                 <div className="flex justify-between items-center pt-2">
                    <button className="flex items-center gap-2 text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors">
                      <Plus className="h-3 w-3" /> Ajouter Ligne
                    </button>
                    <button className="flex items-center gap-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded shadow hover:bg-black transition-colors">
                      <Save className="h-4 w-4" /> Enregistrer dans le Brouillard
                    </button>
                 </div>
               </div>
             </div>
           )}

           {/* TAB: BROUILLARD */}
           {activeTab === "Brouillard" && (
             <div className="flex flex-col h-full">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <p className="text-xs text-slate-500 font-bold">14 lignes en attente de validation définitive.</p>
                 <button className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow hover:bg-emerald-700 transition-colors flex items-center gap-2">
                   <CheckCircle2 className="h-4 w-4" /> Valider le Brouillard (Génération)
                 </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                     <tr>
                       <th className="p-4">Journal</th>
                       <th className="p-4">Date</th>
                       <th className="p-4">Pièce</th>
                       <th className="p-4 w-24">N° SYSCOA</th>
                       <th className="p-4">Libellé de l'écriture</th>
                       <th className="p-4 text-right text-emerald-600">Débit (FCFA)</th>
                       <th className="p-4 text-right text-blue-600">Crédit (FCFA)</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     <tr className="hover:bg-slate-50 transition-colors">
                       <td className="p-4 font-black text-slate-400 text-xs">VT</td>
                       <td className="p-4 text-xs font-semibold">27/04/2026</td>
                       <td className="p-4 text-xs font-semibold">FAC-089</td>
                       <td className="p-4 font-black text-slate-700 text-xs">7061</td>
                       <td className="p-4 text-xs font-semibold text-slate-500">Honoraires - Soins Conservateurs (M. Diallo)</td>
                       <td className="p-4 text-right font-medium text-xs text-slate-300">-</td>
                       <td className="p-4 text-right font-black text-blue-600 text-xs">12 000</td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition-colors bg-blue-50/30">
                       <td className="p-4 font-black text-slate-400 text-xs">CA</td>
                       <td className="p-4 text-xs font-semibold">27/04/2026</td>
                       <td className="p-4 text-xs font-semibold">FAC-089</td>
                       <td className="p-4 font-black text-slate-700 text-xs">571</td>
                       <td className="p-4 text-xs font-semibold text-slate-500">Caisse Principale (Encaissement Espèces)</td>
                       <td className="p-4 text-right font-black text-emerald-600 text-xs">12 000</td>
                       <td className="p-4 text-right font-medium text-xs text-slate-300">-</td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition-colors border-t border-dashed border-slate-300">
                       <td className="p-4 font-black text-slate-400 text-xs">AC</td>
                       <td className="p-4 text-xs font-semibold">26/04/2026</td>
                       <td className="p-4 text-xs font-semibold">FAC-FR-112</td>
                       <td className="p-4 font-black text-slate-700 text-xs">6011</td>
                       <td className="p-4 text-xs font-semibold text-slate-500">Achats consommables (Henry Schein)</td>
                       <td className="p-4 text-right font-black text-emerald-600 text-xs">250 000</td>
                       <td className="p-4 text-right font-medium text-xs text-slate-300">-</td>
                     </tr>
                     <tr className="hover:bg-slate-50 transition-colors bg-blue-50/30">
                       <td className="p-4 font-black text-slate-400 text-xs">AC</td>
                       <td className="p-4 text-xs font-semibold">26/04/2026</td>
                       <td className="p-4 text-xs font-semibold">FAC-FR-112</td>
                       <td className="p-4 font-black text-slate-700 text-xs">4011</td>
                       <td className="p-4 text-xs font-semibold text-slate-500">Fournisseurs - Matériel dentaire</td>
                       <td className="p-4 text-right font-medium text-xs text-slate-300">-</td>
                       <td className="p-4 text-right font-black text-blue-600 text-xs">250 000</td>
                     </tr>
                   </tbody>
                 </table>
               </div>
             </div>
           )}

           {/* TAB: BALANCE & EDITIONS PLACEHOLDER */}
           {(activeTab === "Journaux" || activeTab === "Balance" || activeTab === "Editions") && (
             <div className="p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px] space-y-4">
                <div className="h-16 w-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center">
                  <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">{activeTab} en cours de calcul...</h3>
                  <p className="text-xs text-slate-500 font-medium mt-2 max-w-md">
                    Les données sont agrégées dynamiquement. Le Bilan, le Compte de Résultat et les Soldes de Gestion seront disponibles dans le prochain rapport de fin de mois.
                  </p>
                </div>
                <button onClick={exportExcel} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline mt-2 flex items-center gap-2">
                  <Download className="h-3 w-3" /> Télécharger au format Excel
                </button>
             </div>
           )}

         </div>
       </div>
    </div>
  );
}
