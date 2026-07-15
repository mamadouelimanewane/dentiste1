"use client";

import React, { useEffect, useState } from "react";
import {
  Users, ShieldAlert, BookOpen, FileText, BarChart3, Building,
  Plus, Filter, CheckCircle2,
  Lock, Download, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { RoleManager } from "@/components/RoleManager";
import { DENTAL_NOMENCLATURE } from "@/lib/pricing";

interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  entity_table: string;
  entity_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor_name: string | null;
}

interface StatsOverview {
  kpis: {
    chiffreAffaires: { value: number; trend: number | null };
    nouveauxPatients: { value: number; trend: number | null };
    tauxRealisationRdv: { value: number | null; trend: number | null };
    encaissements: { value: number; trend: number | null };
  };
  evolutionCa: { label: string; total: number; heightPct: number }[];
  topActs: { name: string; count: number; revenue: number }[];
}

interface PractitionerStat {
  id: string;
  name: string;
  actsCount: number;
  revenue: number;
}


export function AdminHub() {
  const [activeTab, setActiveTab] = useState("utilisateurs");
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [biPeriod, setBiPeriod] = useState<"week" | "month" | "year">("month");
  const [biOverview, setBiOverview] = useState<StatsOverview | null>(null);
  const [biPractitioners, setBiPractitioners] = useState<PractitionerStat[]>([]);
  const [biLoading, setBiLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "utilisateurs") return;
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => setUsers([]));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "audit") return;
    setAuditLoading(true);
    fetch("/api/admin/audit-logs")
      .then((res) => res.json())
      .then((data) => setAuditLogs(data.logs || []))
      .catch(() => setAuditLogs([]))
      .finally(() => setAuditLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "bi") return;
    setBiLoading(true);
    Promise.all([
      fetch(`/api/stats/overview?period=${biPeriod}`).then((res) => res.json()),
      fetch(`/api/stats/practitioners?period=${biPeriod}`).then((res) => res.json()),
    ])
      .then(([overview, practitioners]) => {
        setBiOverview(overview);
        setBiPractitioners(practitioners.practitioners || []);
      })
      .catch(() => {
        setBiOverview(null);
        setBiPractitioners([]);
      })
      .finally(() => setBiLoading(false));
  }, [activeTab, biPeriod]);

  function formatFcfa(n: number) {
    return `${Math.round(n).toLocaleString("fr-FR")} F`;
  }

  function formatTrend(trend: number | null) {
    if (trend === null || !isFinite(trend)) return null;
    return `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`;
  }

  function formatLogTime(iso: string) {
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

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
                    <Filter className="h-3.5 w-3.5 text-slate-400" /> <span className="font-bold text-slate-600">50 derniers événements</span>
                  </div>
                  <button
                    disabled
                    title="Export CSV pas encore implémenté."
                    className="bg-slate-300 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow flex items-center gap-2 cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" /> Exporter (.CSV)
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto p-4 flex-1 bg-slate-50/50">
                {auditLoading && <p className="text-xs text-slate-400 text-center py-8">Chargement...</p>}
                {!auditLoading && auditLogs.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">Aucun événement enregistré pour le moment.</p>
                )}
                <div className="space-y-3">
                  {auditLogs.map(log => (
                    <div key={log.id} className="bg-white border border-slate-200 rounded p-4 flex items-start gap-4 shadow-sm">
                      <div className="mt-1 rounded-full p-1.5 bg-blue-100 text-blue-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{log.action}</p>
                          <span className="text-[10px] font-bold text-slate-400">{formatLogTime(log.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">👤 {log.actor_name || "Système"}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded">📦 {log.entity_table}</span>
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
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Nomenclature utilisée dans Devis et Réalisation ({DENTAL_NOMENCLATURE.length} actes)</p>
                </div>
                <button
                  disabled
                  title="Édition du catalogue pas encore implémentée — modifier src/lib/pricing.ts pour changer les tarifs."
                  className="bg-slate-300 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow flex items-center gap-2 cursor-not-allowed"
                >
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
                      <th className="p-3">Cotation</th>
                      <th className="p-3 text-right">Tarif Cabinet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-x border-b border-slate-200">
                    {DENTAL_NOMENCLATURE.map(acte => (
                      <tr key={acte.id} className="hover:bg-slate-50">
                        <td className="p-3 font-black text-blue-900 text-xs">{acte.id}</td>
                        <td className="p-3 font-bold text-slate-700 text-xs">{acte.label}</td>
                        <td className="p-3 text-[10px] font-black uppercase text-slate-500">{acte.category}</td>
                        <td className="p-3 text-xs font-medium text-slate-500">{acte.cotation || "—"}</td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">{(acte.price || 0).toLocaleString()} F</td>
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
                  <select
                    value={biPeriod}
                    onChange={(e) => setBiPeriod(e.target.value as "week" | "month" | "year")}
                    className="bg-white border border-slate-200 rounded px-3 py-1.5 text-[10px] font-bold uppercase outline-none"
                  >
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                    <option value="year">Cette année</option>
                  </select>
                </div>
              </div>

              {biLoading && <p className="text-xs text-slate-400 text-center py-12">Chargement...</p>}

              {!biLoading && biOverview && (
                <div className="p-6 space-y-8">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { label: "Chiffre d'Affaires", value: formatFcfa(biOverview.kpis.chiffreAffaires.value), trend: formatTrend(biOverview.kpis.chiffreAffaires.trend), color: "text-blue-600" },
                      { label: "Nouveaux Patients", value: String(biOverview.kpis.nouveauxPatients.value), trend: formatTrend(biOverview.kpis.nouveauxPatients.trend), color: "text-emerald-600" },
                      { label: "Taux de Réalisation RDV", value: biOverview.kpis.tauxRealisationRdv.value !== null ? `${biOverview.kpis.tauxRealisationRdv.value.toFixed(0)}%` : "—", trend: formatTrend(biOverview.kpis.tauxRealisationRdv.trend), color: "text-amber-600" },
                      { label: "Encaissements", value: formatFcfa(biOverview.kpis.encaissements.value), trend: formatTrend(biOverview.kpis.encaissements.trend), color: "text-purple-600" },
                    ].map((m, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded p-4 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
                        <div className="flex items-end justify-between">
                          <p className={cn("text-xl font-black tracking-tighter", m.color)}>{m.value}</p>
                          {m.trend && (
                            <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", m.trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                              {m.trend}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Chart (real, 12 derniers mois) */}
                    <div className="bg-white border border-slate-200 rounded p-5 space-y-6 shadow-sm">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Encaissements (12 derniers mois)</h4>
                      </div>
                      <div className="h-48 flex items-end justify-between gap-2 px-2">
                        {biOverview.evolutionCa.map((m, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer" title={formatFcfa(m.total)}>
                            <div className="w-full bg-slate-50 rounded-t-sm relative overflow-hidden h-full flex flex-col justify-end">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${m.heightPct}%` }}
                                transition={{ delay: i * 0.05, duration: 0.8 }}
                                className="bg-blue-600 w-full rounded-t-sm group-hover:bg-blue-500 transition-colors"
                              />
                            </div>
                            <span className="text-[8px] font-black text-slate-400 group-hover:text-blue-600">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Actes */}
                    <div className="bg-white border border-slate-200 rounded p-5 space-y-6 shadow-sm">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Top Actes (Volume)</h4>
                      {biOverview.topActs.length === 0 && (
                        <p className="text-xs text-slate-400">Aucun acte réalisé sur la période.</p>
                      )}
                      <div className="space-y-4">
                        {biOverview.topActs.map((act, i) => {
                          const maxCount = Math.max(1, ...biOverview.topActs.map((a) => a.count));
                          const pct = Math.round((act.count / maxCount) * 100);
                          return (
                            <div key={i} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                                <span className="text-slate-600">{act.name} ({act.count})</span>
                                <span className="text-slate-900">{formatFcfa(act.revenue)}</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                  className="h-full rounded-full bg-blue-600"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Practitioner Performance Table */}
                  <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
                    <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Performance Praticiens</h4>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        <tr>
                          <th className="p-3">Praticien</th>
                          <th className="p-3">Actes</th>
                          <th className="p-3 text-right">Revenue (F)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {biPractitioners.length === 0 && (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-xs text-slate-400">Aucun praticien actif.</td>
                          </tr>
                        )}
                        {biPractitioners.map((dr) => (
                          <tr key={dr.id} className="text-xs font-bold text-slate-700 hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-slate-900">{dr.name}</td>
                            <td className="p-3">{dr.actsCount}</td>
                            <td className="p-3 text-right">{formatFcfa(dr.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
