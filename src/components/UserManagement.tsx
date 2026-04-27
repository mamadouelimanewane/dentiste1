"use client";

import React, { useState } from "react";
import { Users, UserPlus, Shield, Activity, FileText, CheckCircle2, Lock, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserManagement() {
  const [users] = useState([
    { id: 1, name: "Dr. Amadou Ndiaye", role: "Administrateur", email: "a.ndiaye@cliniquecapvert.sn", status: "Actif", modules: ["Tous"] },
    { id: 2, name: "Dr. Mamadou Diallo", role: "Praticien", email: "m.diallo@cliniquecapvert.sn", status: "Actif", modules: ["Dossier", "Consultation", "Hub"] },
    { id: 3, name: "Aïssatou Sow", role: "Accueil", email: "accueil@cliniquecapvert.sn", status: "Actif", modules: ["Accueil", "Facturation", "Suivi"] },
    { id: 4, name: "Ousmane Fall", role: "Comptable", email: "compta@cliniquecapvert.sn", status: "Actif", modules: ["Facturation", "Registre Financier"] },
    { id: 5, name: "Dr. Fatou Diop", role: "Praticien", email: "f.diop@cliniquecapvert.sn", status: "Inactif", modules: ["Dossier", "Consultation", "Hub"] },
  ]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-blue-600">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilisateurs Actifs</p>
               <p className="text-2xl font-black text-slate-900 mt-2">4</p>
             </div>
             <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center">
               <Users className="h-4 w-4 text-blue-600" />
             </div>
           </div>
         </div>
         <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rôles Configurés</p>
               <p className="text-2xl font-black text-slate-900 mt-2">4</p>
             </div>
             <div className="h-8 w-8 rounded bg-emerald-50 flex items-center justify-center">
               <Shield className="h-4 w-4 text-emerald-600" />
             </div>
           </div>
         </div>
         <button className="bg-[#1E3A8A] hover:bg-blue-900 p-5 rounded-sm border border-blue-800 shadow-sm transition-all flex flex-col justify-center items-center gap-2 group text-white">
           <UserPlus className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Nouveau Collaborateur</span>
         </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#0F172A] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Annuaire des Accès & Privilèges</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4">Utilisateur</th>
                <th className="p-4">Rôle / Profil</th>
                <th className="p-4">Modules Autorisés</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className={cn("hover:bg-slate-50 transition-colors", user.status === "Inactif" && "opacity-60 bg-slate-50/50")}>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 text-xs">{user.name}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border",
                      user.role === "Administrateur" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      user.role === "Praticien" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      user.role === "Accueil" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {user.modules.map(m => (
                        <span key={m} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {user.status === "Actif" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
