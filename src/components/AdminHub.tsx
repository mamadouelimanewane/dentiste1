"use client";

import React, { useEffect, useState } from "react";
import {
  Users, ShieldAlert, BookOpen, FileText, BarChart3, Building,
  Search, Plus, Filter, MoreVertical, Edit3, Trash2, CheckCircle2,
  AlertCircle, Lock, Download, Settings, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { RoleManager } from "@/components/RoleManager";

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

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
  const [users, setUsers] = useState<AdminProfile[]>([]);

  useEffect(() => {
    if (activeTab !== "utilisateurs") return;
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]));
  }, [activeTab]);

  const tabs = [
    { id: "utilisateurs", label: "Utilisateurs & RBAC", icon: Users },
    { id: "roles", label: "Rôles & Privilèges", icon: Shield },
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
                <button
                  onClick={() => alert('Ouvrez le module "Utilisateurs" (étape 10) pour inviter un nouveau collaborateur.')}
                  className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
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
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-xs text-slate-400">
                          Aucun utilisateur. Gérez les invitations depuis le module "Utilisateurs".
                        </td>
                      </tr>
                    )}
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900 text-xs">{user.full_name}</p>
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
                        <td className="p-3 text-xs font-medium text-slate-600">—</td>
                        <td className="p-3">
                          {user.is_active ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Actif
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Inactif
                            </div>
                          )}
                        </td>
                        <td className="p-3 flex justify-end gap-2">
                          <span className="text-[9px] text-slate-400 uppercase font-bold">Gérer depuis "Utilisateurs"</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 1bis. RÔLES & PRIVILÈGES */}
          {activeTab === "roles" && (
            <div className="h-full overflow-y-auto p-5">
              <RoleManager />
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

          {/* 4. BUSINESS INTELLIGENCE (BI) */}
          {activeTab === "bi" && (
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Performance & Analytics</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Données consolidées en temps réel</p>
                </div>
                <div className="flex gap-2">
                  <select className="bg-white border border-slate-200 rounded px-3 py-1.5 text-[10px] font-bold uppercase outline-none">
                    <option>Les 30 derniers jours</option>
                    <option>Trimestre en cours</option>
                    <option>Année 2026</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: "Chiffre d'Affaires", value: "8,450,000 F", trend: "+12.5%", color: "text-blue-600" },
                    { label: "Nouveaux Patients", value: "124", trend: "+8.2%", color: "text-emerald-600" },
                    { label: "Taux d'Acceptation Devis", value: "68%", trend: "-2.1%", color: "text-amber-600" },
                    { label: "Annulations RDV", value: "4.2%", trend: "-0.5%", color: "text-rose-600" },
                  ].map((m, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded p-4 shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                      <div className="flex items-end justify-between">
                        <p className={cn("text-xl font-black tracking-tighter", m.color)}>{m.value}</p>
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", m.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                          {m.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Chart (CSS-based) */}
                  <div className="bg-white border border-slate-200 rounded p-5 space-y-6 shadow-sm">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Flux de Trésorerie (M-1)</h4>
                      <div className="flex gap-3">
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-blue-600" /><span className="text-[9px] font-bold text-slate-500 uppercase">Encaissements</span></div>
                        <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-slate-200" /><span className="text-[9px] font-bold text-slate-500 uppercase">Prévisions</span></div>
                      </div>
                    </div>
                    <div className="h-48 flex items-end justify-between gap-2 px-2">
                      {[40, 65, 45, 80, 55, 90, 75, 85, 60, 95, 70, 100].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                          <div className="w-full bg-slate-50 rounded-t-sm relative overflow-hidden h-full flex flex-col justify-end">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              transition={{ delay: i * 0.05, duration: 0.8 }}
                              className="bg-blue-600 w-full rounded-t-sm group-hover:bg-blue-500 transition-colors"
                            />
                          </div>
                          <span className="text-[8px] font-black text-slate-400 group-hover:text-blue-600">J{i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Procedure Breakdown */}
                  <div className="bg-white border border-slate-200 rounded p-5 space-y-6 shadow-sm">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Répartition par Acte</h4>
                    <div className="space-y-4">
                      {[
                        { label: "Soins Conservateurs", value: 45, color: "bg-blue-600" },
                        { label: "Prothèses Fixes", value: 30, color: "bg-emerald-500" },
                        { label: "Chirurgie & Implants", value: 15, color: "bg-purple-600" },
                        { label: "Orthodontie / ODF", value: 10, color: "bg-amber-500" },
                      ].map((p, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-slate-600">{p.label}</span>
                            <span className="text-slate-900">{p.value}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${p.value}%` }}
                              transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                              className={cn("h-full rounded-full", p.color)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Practitioner Performance Table */}
                <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Performance Praticiens</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Source: Analytics Engine</span>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="p-3">Praticien</th>
                        <th className="p-3">Actes</th>
                        <th className="p-3">Volume Horaire</th>
                        <th className="p-3">Revenue (F)</th>
                        <th className="p-3 text-right">Efficacité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { name: "Dr. Mamadou Fall", acts: 142, hours: "156h", revenue: "3,850,000", efficiency: "94%" },
                        { name: "Dr. Aïssatou Sow", acts: 98, hours: "124h", revenue: "2,920,000", efficiency: "88%" },
                        { name: "Dr. Cheikh Tidiane", acts: 45, hours: "62h", revenue: "1,680,000", efficiency: "91%" },
                      ].map((dr, i) => (
                        <tr key={i} className="text-xs font-bold text-slate-700 hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-slate-900">{dr.name}</td>
                          <td className="p-3">{dr.acts}</td>
                          <td className="p-3">{dr.hours}</td>
                          <td className="p-3">{dr.revenue}</td>
                          <td className="p-3 text-right text-emerald-600">{dr.efficiency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. TEMPLATES & 6. MULTISITE (Placeholders for size) */}
          {(activeTab === "templates" || activeTab === "multisite") && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/50">
              <div className="h-20 w-20 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-200 mb-6">
                {activeTab === "templates" && <FileText className="h-10 w-10 text-amber-500" />}
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
