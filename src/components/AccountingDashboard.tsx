"use client";

import React from 'react';
import { Calculator, TrendingUp, FileText, CheckCircle2, Clock } from 'lucide-react';

export function AccountingDashboard() {
  return (
    <div className="space-y-6">
       {/* KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-blue-600">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chiffre d'Affaires (Jour)</p>
           <p className="text-2xl font-black text-slate-900 mt-2">450 000 <span className="text-xs text-slate-400">FCFA</span></p>
         </div>
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Encaissé</p>
           <p className="text-2xl font-black text-slate-900 mt-2">320 000 <span className="text-xs text-slate-400">FCFA</span></p>
         </div>
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-rose-500">
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">En Attente (Assurances)</p>
           <p className="text-2xl font-black text-slate-900 mt-2">130 000 <span className="text-xs text-slate-400">FCFA</span></p>
         </div>
       </div>

       {/* Table */}
       <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
         <div className="bg-[#1E3A8A] p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Registre Comptable & Transmissions</h3>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-800/50 px-2 py-1 rounded">Temps Réel</span>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
             <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
               <tr>
                 <th className="p-4">Date</th>
                 <th className="p-4">Patient</th>
                 <th className="p-4">Document</th>
                 <th className="p-4">Montant</th>
                 <th className="p-4">Statut / Règlement</th>
                 <th className="p-4">Destinataires</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               <tr className="hover:bg-slate-50 transition-colors">
                 <td className="p-4 font-medium text-slate-900 text-xs">Aujourd'hui, 10:45</td>
                 <td className="p-4 font-bold text-slate-700 text-xs">Mamadou Diallo</td>
                 <td className="p-4 text-xs font-semibold text-slate-600">Facture #24-089</td>
                 <td className="p-4 font-black text-blue-900 text-xs">12 000 FCFA</td>
                 <td className="p-4">
                   <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center w-fit gap-1">
                     <CheckCircle2 className="h-3 w-3" /> Payé (Espèces)
                   </span>
                 </td>
                 <td className="p-4 text-[10px] font-medium text-slate-500">Patient, Compta Cabinet</td>
               </tr>
               <tr className="hover:bg-slate-50 transition-colors">
                 <td className="p-4 font-medium text-slate-900 text-xs">Aujourd'hui, 09:30</td>
                 <td className="p-4 font-bold text-slate-700 text-xs">Aissatou Sow</td>
                 <td className="p-4 text-xs font-semibold text-slate-600">Devis #D24-112</td>
                 <td className="p-4 font-black text-blue-900 text-xs">168 000 FCFA</td>
                 <td className="p-4">
                   <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center w-fit gap-1">
                     <FileText className="h-3 w-3" /> Transmis
                   </span>
                 </td>
                 <td className="p-4 text-[10px] font-medium text-slate-500">Mutuelle, Patient</td>
               </tr>
               <tr className="hover:bg-slate-50 transition-colors">
                 <td className="p-4 font-medium text-slate-900 text-xs">Hier, 16:15</td>
                 <td className="p-4 font-bold text-slate-700 text-xs">Oumar Ndiaye</td>
                 <td className="p-4 text-xs font-semibold text-slate-600">Facture #24-088</td>
                 <td className="p-4 font-black text-blue-900 text-xs">48 000 FCFA</td>
                 <td className="p-4">
                   <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-wider flex items-center w-fit gap-1">
                     <Clock className="h-3 w-3" /> En attente
                   </span>
                 </td>
                 <td className="p-4 text-[10px] font-medium text-slate-500">Assurance IPM</td>
               </tr>
             </tbody>
           </table>
         </div>
       </div>
    </div>
  );
}
