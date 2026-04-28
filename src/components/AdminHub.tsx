"use client";

import React, { useState } from "react";
import { 
  Users, ShieldAlert, BookOpen, FileText, BarChart3, Building, 
  Search, Plus, Filter, MoreVertical, Edit3, Trash2, CheckCircle2, 
  AlertCircle, Lock, Download, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data
const MOCK_USERS = [
  { id: 1, name: "Dr. Mamadou Fall", role: "praticien", email: "m.fall@dentoprestige.sn", lastActive: "Il y a 5 min", status: "Actif" },
  { id: 2, name: "Dr. Aïssatou Sow", role: "praticien", email: "a.sow@dentoprestige.sn", lastActive: "Hier, 18:30", status: "Actif" },
  { id: 3, name: "Fatou Diop", role: "accueil", email: "accueil@dentoprestige.sn", lastActive: "En ligne", status: "Actif" },
  { id: 4, name: "Ousmane Kane", role: "comptable", email: "compta@dentoprestige.sn", lastActive: "Aujourd'hui, 09:15", status: "Actif" },
  { id: 5, name: "Admin Sys", role: "admin", email: "admin@dentoprestige.sn", lastActive: "En ligne", status: "Actif" },
];

const MOCK_LOGS = [
  { id: 1, time: "10:45:22", user: "Fatou Diop", action: "Création Dossier Patient", details: "Patient SN-45892-X (Mamadou Diallo)", module: "Accueil", severity: "info" },
  { id: 2, time: "10:30:15", user: "Dr. Mamadou Fall", action: "Validation Devis", details: "Devis #D24-112 (168 000 FCFA)", module: "Facturation", severity: "success" },
  { id: 3, time: "09:15:00", user: "Ousmane Kane", action: "Export Grand Livre", details: "Export Excel Période Avril 2026", module: "Comptabilité", severity: "info" },
  { id: 4, time: "Hier, 18:45", user: "Dr. Aïssatou Sow", action: "Suppression Ordonnance", details: "Ordonnance #ORD-089 annulée", module: "Prescription", severity: "warning" },
];

const MOCK_ACTES = [
  { id: "C01", name: "Consultation initiale & Bilan", category: "Diagnostic", price: 15000, duration: "30 min", coverage: "100%" },
  { id: "S01", name: "Détartrage sus et sous-gingival", category: "Prévention", price: 25000, duration: "30 min", coverage: "80%" },
  { id: "P05", name: "Couronne Zircone sur dent naturelle", category: "Prothèse", price: 150000, duration: "60 min", coverage: "50%" },
  { id: "I01", name: "Pose Implant Titane (Premium)", category: "Implantologie", price: 450000, duration: "90 min", coverage: "0%" },
  { id: "E02", name: "Blanchiment au fauteuil (Laser)", category: "Esthétique", price: 180000, duration: "60 min", coverage: "0%" },
];

export function AdminHub() {
  const [activeTab, setActiveTab] = useState("utilisateurs");

  const tabs = [
    { id: "utilisateurs", label: "Utilisateurs & RBAC", icon: Users },
    { id: "audit", label: "Journal d'Audit", icon: ShieldAlert },
    { id: "catalogue", label: "Catalogue des Actes", icon: BookOpen },
    { id: "templates", label: "Modèles & Contrats", icon: FileText },
    { id: "bi", label: "Business Intelligence", icon: BarChart3 },
    { id: "multisite", label: "Multi-Sites", icon: Building },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 flex flex-col md:flex-row items-center justify-between shadow-xl gap-4 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4 w-full md:w-auto text-white">
          <div className="h-12 w-12 bg-emerald-500 rounded flex items-center justify-center shadow-lg shadow-emerald-900/50">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-emerald-400">Centre d'Administration Sécurisé</h2>
            <p className="text-xs font-medium text-slate-400">Accès restreint. Toutes les actions sont tracées et archivées.</p>
          </div>
        </div>
        <ShieldAlert className="absolute -right-4 -top-4 h-32 w-32 text-slate-800 opacity-50 z-0" />
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-[700px]">
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2 bg-white border border-slate-200 rounded-sm shadow-sm p-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Modules d'Administration</h3>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-widest transition-all w-full text-left",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-md" 
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-emerald-400" : "text-slate-400")} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
          
          {/* 1. UTILISATEURS ET RBAC */}
          {activeTab === "utilisateurs" && (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Gestion des Utilisateurs</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Gérez les accès et les permissions (RBAC)</p>
                </div>
                <button className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow hover:bg-emerald-700 transition-colors flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Nouvel Utilisateur
                </button>
              </div>
              <div className="overflow-x-auto p-4 flex-1">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">
                    <tr>
                      <th className="p-3">Employé</th>
                      <th className="p-3">Rôle Système</th>
                      <th className="p-3">Dernière Connexion</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-x border-b border-slate-200">
                    {MOCK_USERS.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900 text-xs">{user.name}</p>
                          <p className="text-[10px] text-slate-500">{user.email}</p>
                        </td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest",
                            user.role === 'admin' ? "bg-purple-100 text-purple-700" :
                            user.role === 'praticien' ? "bg-blue-100 text-blue-700" :
                            user.role === 'comptable' ? "bg-amber-100 text-amber-700" :
                            "bg-emerald-100 text-emerald-700"
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-xs font-medium text-slate-600">{user.lastActive}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Actif
                          </div>
                        </td>
                        <td className="p-3 flex justify-end gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded"><Edit3 className="h-4 w-4" /></button>
                          <button className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded"><Settings className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. JOURNAL D'AUDIT */}
          {activeTab === "audit" && (
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Journal d'Audit</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Traçabilité complète des événements</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded text-xs">
                    <Filter className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold text-slate-600">Aujourd'hui</span>
                  </div>
                  <button className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow flex items-center gap-2">
                    <Download className="h-4 w-4" /> Exporter (.CSV)
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto p-4 flex-1 bg-slate-50/50">
                <div className="space-y-3">
                  {MOCK_LOGS.map(log => (
                    <div key={log.id} className="bg-white border border-slate-200 rounded p-4 flex items-start gap-4 shadow-sm">
                      <div className={cn(
                        "mt-1 rounded-full p-1.5",
                        log.severity === 'info' ? "bg-blue-100 text-blue-600" :
                        log.severity === 'success' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {log.severity === 'warning' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{log.action}</p>
                          <span className="text-[10px] font-bold text-slate-400">{log.time}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 mt-1">{log.details}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">👤 {log.user}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">📦 {log.module}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. CATALOGUE DES ACTES */}
          {activeTab === "catalogue" && (
            <div className="flex flex-col h-full">
               <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Catalogue des Actes & Tarifs</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Configuration de la nomenclature NGAP/CCAM</p>
                </div>
                <button className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Nouvel Acte
                </button>
              </div>
              <div className="overflow-x-auto p-4 flex-1">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-800 text-[10px] font-bold text-white uppercase tracking-widest">
                    <tr>
                      <th className="p-3">Code</th>
                      <th className="p-3">Désignation</th>
                      <th className="p-3">Catégorie</th>
                      <th className="p-3">Durée Std</th>
                      <th className="p-3">Couverture Max</th>
                      <th className="p-3 text-right">Tarif Cabinet</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-x border-b border-slate-200">
                    {MOCK_ACTES.map(acte => (
                      <tr key={acte.id} className="hover:bg-slate-50">
                        <td className="p-3 font-black text-blue-900 text-xs">{acte.id}</td>
                        <td className="p-3 font-bold text-slate-700 text-xs">{acte.name}</td>
                        <td className="p-3 text-[10px] font-black uppercase text-slate-500">{acte.category}</td>
                        <td className="p-3 text-xs font-medium text-slate-500">{acte.duration}</td>
                        <td className="p-3 text-xs font-bold text-emerald-600">{acte.coverage}</td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">{acte.price.toLocaleString()} F</td>
                        <td className="p-3 text-right">
                           <button className="text-slate-400 hover:text-blue-600"><MoreVertical className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. TEMPLATES & 5. BI & 6. MULTISITE (Placeholders for size) */}
          {(activeTab === "templates" || activeTab === "bi" || activeTab === "multisite") && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/50">
              <div className="h-20 w-20 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-200 mb-6">
                {activeTab === "templates" && <FileText className="h-10 w-10 text-amber-500" />}
                {activeTab === "bi" && <BarChart3 className="h-10 w-10 text-purple-500" />}
                {activeTab === "multisite" && <Building className="h-10 w-10 text-blue-500" />}
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 mb-2">Module en cours d'intégration</h3>
              <p className="text-sm font-medium text-slate-500 max-w-md">
                L'infrastructure backend pour {tabLabels[activeTab]} est prête. L'interface utilisateur de ce composant sera déployée dans la prochaine mise à jour (v1.4).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const tabLabels: Record<string, string> = {
  "templates": "les Modèles de Documents",
  "bi": "la Business Intelligence",
  "multisite": "la Gestion Multi-Sites",
};
