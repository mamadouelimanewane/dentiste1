"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  PieChart as PieChartIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Filter,
  Download,
  Activity,
  UserCheck,
  CreditCard,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function StatsDashboard() {
  const [period, setPeriod] = useState("Ce mois");

  const mainKpis = [
    { label: "Chiffre d'Affaires", value: "12,450,000 F", trend: "+12.5%", positive: true, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Nouveaux Patients", value: "48", trend: "+8%", positive: true, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Taux d'Occupation", value: "84%", trend: "-2.1%", positive: false, icon: Activity, color: "bg-amber-50 text-amber-600" },
    { label: "Encaissements", value: "9,820,000 F", trend: "+15%", positive: true, icon: CreditCard, color: "bg-purple-50 text-purple-600" },
  ];

  const topActs = [
    { name: "Détartrage & Polissage", count: 124, revenue: "3,100,000 F", percent: 85 },
    { name: "Extraction Simple", count: 86, revenue: "1,290,000 F", percent: 65 },
    { name: "Prothèse Fixe (Zircone)", count: 42, revenue: "5,460,000 F", percent: 45 },
    { name: "Traitement Canalaire", count: 38, revenue: "1,140,000 F", percent: 30 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Tableau de Bord Stratégique</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Analyse de Performance & Pilotage D'Élite</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-sm p-1 shadow-sm">
            {["Cette Semaine", "Ce mois", "Cette Année"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
                  period === p ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="bg-white border border-slate-200 p-2.5 rounded-sm shadow-sm hover:bg-slate-50 transition-colors text-slate-600">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainKpis.map((kpi, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-white border border-slate-200 p-6 rounded-sm shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className={cn("p-2 rounded shadow-sm", kpi.color)}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full",
                kpi.positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}>
                {kpi.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{kpi.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{kpi.value}</h3>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
              <kpi.icon className="h-24 w-24" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE CHART PLACEHOLDER */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Évolution du Chiffre d'Affaires</h3>
            </div>
            <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          </div>
          <div className="p-8 flex-1 min-h-[350px] flex items-end justify-between gap-4">
            {[40, 65, 45, 80, 55, 95, 75, 60, 85, 40, 70, 90].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                <div className="w-full relative">
                   <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                    className={cn(
                      "w-full rounded-t-sm transition-all relative overflow-hidden",
                      i === 5 ? "bg-blue-600" : "bg-slate-100 group-hover:bg-slate-200"
                    )}
                   >
                     {i === 5 && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />}
                   </motion.div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
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
            {topActs.map((act, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs font-bold text-white">{act.name}</p>
                    <p className="text-[10px] font-medium text-slate-400">{act.count} Actes réalisés</p>
                  </div>
                  <p className="text-xs font-black text-blue-400">{act.revenue}</p>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${act.percent}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + (i * 0.1) }}
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-800/50 mt-auto">
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-sm text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
               Rapport Détaillé <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Panier Moyen", value: "258,000 F", sub: "+5,4% vs mois dernier", icon: Briefcase },
          { label: "Nouveaux Patients", value: "48", sub: "85% via recommandation", icon: UserCheck },
          { label: "Taux de Conversion Devis", value: "62%", sub: "Objectif: 70%", icon: PieChartIcon },
        ].map((item, i) => (
          <div key={i} className="bg-slate-50 border border-slate-200 p-5 rounded-sm flex items-center gap-4">
            <div className="h-10 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-900 shadow-sm">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-slate-900">{item.value}</span>
                <span className="text-[9px] font-bold text-blue-600">{item.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
