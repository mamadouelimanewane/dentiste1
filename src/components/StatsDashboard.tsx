"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserCheck,
  CreditCard,
  Briefcase,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Period = "week" | "month" | "year";

interface StatsOverview {
  kpis: {
    chiffreAffaires: { value: number; trend: number | null };
    nouveauxPatients: { value: number; trend: number | null };
    tauxRealisationRdv: { value: number | null; trend: number | null };
    encaissements: { value: number; trend: number | null };
    panierMoyen: { value: number };
    actesRealises: { value: number };
    // Moyenne des notes de fin de séance, avec le nombre d'avis : une
    // moyenne sur deux séances ne se lit pas comme une moyenne sur cent.
    satisfaction?: { value: number | null; avis: number };
  };
  evolutionCa: { label: string; total: number; heightPct: number }[];
  topActs: { name: string; count: number; revenue: number }[];
}

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "week", label: "Cette Semaine" },
  { key: "month", label: "Ce mois" },
  { key: "year", label: "Cette Année" },
];

function formatFcfa(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} F`;
}

function formatTrend(trend: number | null) {
  if (trend === null || !isFinite(trend)) return null;
  return `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`;
}

export function StatsDashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/stats/overview?period=${period}`)
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les statistiques.");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur inconnue."))
      .finally(() => setLoading(false));
  }, [period]);

  const mainKpis = data
    ? [
        { label: "Chiffre d'Affaires", value: formatFcfa(data.kpis.chiffreAffaires.value), trend: formatTrend(data.kpis.chiffreAffaires.trend), icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
        { label: "Nouveaux Patients", value: String(data.kpis.nouveauxPatients.value), trend: formatTrend(data.kpis.nouveauxPatients.trend), icon: Users, color: "bg-blue-50 text-blue-600" },
        { label: "Taux de Réalisation RDV", value: data.kpis.tauxRealisationRdv.value !== null ? `${data.kpis.tauxRealisationRdv.value.toFixed(0)}%` : "—", trend: formatTrend(data.kpis.tauxRealisationRdv.trend), icon: Activity, color: "bg-amber-50 text-amber-600" },
        { label: "Encaissements", value: formatFcfa(data.kpis.encaissements.value), trend: formatTrend(data.kpis.encaissements.trend), icon: CreditCard, color: "bg-purple-50 text-purple-600" },
      ]
    : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Le sélecteur de période seul : le titre de la page annonce déjà
          « Statistiques du cabinet », le répéter ici en majuscules le disait
          deux fois sur le même écran. */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-6">
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-sm p-1 shadow-sm">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                  period === p.key ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3">{error}</div>}
      {loading && <p className="text-xs text-slate-400 text-center py-12">Chargement...</p>}

      {!loading && data && (
        <>
          {/* Indicateurs.
              Ces cartes entraient une par une depuis une opacité nulle, à un
              dixième de seconde d'intervalle : qui arrivait sur l'écran voyait
              d'abord une carte à demi transparente et les autres absentes. Un
              tableau de bord se lit d'un coup d'œil ; il doit être là quand on
              le regarde. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mainKpis.map((kpi, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className={cn("p-2 rounded shadow-sm", kpi.color)}>
                    <kpi.icon className="h-5 w-5" />
                  </div>
                  {kpi.trend && (
                    <div className={cn(
                      "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                      kpi.trend.startsWith('+') ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {kpi.trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {kpi.trend}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{kpi.label}</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{kpi.value}</h3>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <kpi.icon className="h-24 w-24" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* REVENUE CHART */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Encaissements (12 derniers mois)</h3>
                </div>
              </div>
              <div className="p-8 flex-1 min-h-[350px] flex items-end justify-between gap-4">
                {data.evolutionCa.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group" title={formatFcfa(m.total)}>
                    <div className="w-full relative">
                       <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${m.heightPct}%` }}
                        transition={{ duration: 1, delay: i * 0.05 }}
                        className="w-full rounded-t-sm transition-all relative overflow-hidden bg-slate-100 group-hover:bg-blue-200"
                       />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP ACTS ANALYSIS */}
            <div className="bg-[#0F172A] text-white border border-slate-800 rounded-sm shadow-xl flex flex-col">
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <PieChartIcon className="h-5 w-5 text-blue-400" />
                  <h3 className="text-sm font-black uppercase tracking-tight">Top Actes (Volume)</h3>
                </div>
              </div>
              <div className="p-6 space-y-6 flex-1">
                {data.topActs.length === 0 && (
                  <p className="text-xs text-slate-400">Aucun acte réalisé sur la période.</p>
                )}
                {data.topActs.map((act, i) => {
                  const maxCount = Math.max(1, ...data.topActs.map((a) => a.count));
                  const pct = Math.round((act.count / maxCount) * 100);
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs font-bold text-white">{act.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{act.count} Actes réalisés</p>
                        </div>
                        <p className="text-xs font-black text-blue-400">{formatFcfa(act.revenue)}</p>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FOOTER STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Panier Moyen", value: formatFcfa(data.kpis.panierMoyen.value), icon: Briefcase, detail: null as string | null },
              { label: "Actes Réalisés", value: String(data.kpis.actesRealises.value), icon: UserCheck, detail: null as string | null },
              {
                label: "Satisfaction",
                value:
                  data.kpis.satisfaction?.value != null
                    ? `${data.kpis.satisfaction.value.toFixed(1)}/5`
                    : "—",
                icon: Star,
                detail:
                  data.kpis.satisfaction && data.kpis.satisfaction.avis > 0
                    ? `${data.kpis.satisfaction.avis} séance(s) notée(s)`
                    : "Aucune séance notée sur la période",
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 p-5 rounded-sm flex items-center gap-4">
                <div className="h-10 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-900 shadow-sm">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                  <span className="text-lg font-black text-slate-900">{item.value}</span>
                  {item.detail && (
                    <p className="text-[10px] font-bold text-slate-400">{item.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
