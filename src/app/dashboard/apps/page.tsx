"use client";

import React, { useState, useMemo } from "react";
import { ArrowRight, Search, LayoutGrid, Sparkles, LogOut } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/lib/auth-context";
import {
  DENTAL_MODULE_GROUPS,
  DENTAL_CATEGORY_STYLE,
  DENTAL_TOTAL_MODULES,
  type DentalCategoryKey,
} from "@/lib/dentalModules";
import { usePatient } from "@/lib/context";
import { motion } from "framer-motion";

// ── Helpers ───────────────────────────────────────────────────────────────────

function setStep(id: number) {
  localStorage.setItem("dentiste_lite_step", String(id));
  localStorage.setItem("dentiste_home_view", "workflow");
  window.location.href = "/dashboard";
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function DentalAppsHubPage() {
  const { user, signOut } = useAuth();
  const { currentPatient } = usePatient();
  const [search, setSearch] = useState("");

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DENTAL_MODULE_GROUPS;
    return DENTAL_MODULE_GROUPS
      .map(g => ({
        ...g,
        modules: g.modules.filter(
          m =>
            m.name.toLowerCase().includes(q) ||
            m.fullTitle.toLowerCase().includes(q) ||
            m.desc.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.modules.length > 0);
  }, [search]);

  const categoryKeys = Object.keys(DENTAL_CATEGORY_STYLE) as DentalCategoryKey[];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Barre d'accent multicolore */}
      <div className="h-1 w-full flex">
        {categoryKeys.map(k => (
          <div key={k} className="flex-1" style={{ background: DENTAL_CATEGORY_STYLE[k].color }} />
        ))}
      </div>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className="glass-dark sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <svg viewBox="0 0 32 32" fill="none" width="22" height="22">
                <path d="M16 3C10 3 5 8 5 14c0 4 2 7 4 9l1 6h3l1-5h4l1 5h3l1-6c2-2 4-5 4-9 0-6-5-11-11-11z" fill="white" />
              </svg>
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight">Elite ERP Dentaire</p>
              <p className="text-xs text-blue-300 font-medium">Cabinet Dentaire du Cap Vert</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Patient actif */}
            {currentPatient && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300">{currentPatient.name}</span>
              </div>
            )}

            {/* Utilisateur */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-white/15">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  {user.fullName?.[0] ?? "?"}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-white">{user.fullName}</p>
                  <p className="text-[11px] font-medium text-blue-300">{user.roleLabel}</p>
                </div>
              </div>
            )}

            {/* Basculer vers vue workflow */}
            <button
              onClick={() => {
                localStorage.setItem("dentiste_home_view", "workflow");
                window.location.href = "/dashboard";
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5"
              style={{ color: "#e2e8f0", borderColor: "rgba(255,255,255,0.18)" }}
            >
              <LayoutGrid size={15} />
              Vue workflow
            </button>

            <ThemeSwitcher />

            <button
              onClick={signOut}
              title="Déconnexion"
              className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#0A0F1C]">
        {/* Motif géométrique de fond */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="geo-dental" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
              <polygon points="36,4 68,20 68,52 36,68 4,52 4,20" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="36" cy="36" r="5" fill="none" stroke="#ffffff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geo-dental)" />
        </svg>

        <div className="relative max-w-6xl mx-auto px-6 pt-8 pb-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-4"
              style={{ borderColor: "#2563eb", background: "rgba(37,99,235,0.15)" }}
            >
              <Sparkles size={14} style={{ color: "#93c5fd" }} />
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-blue-300">
                Portail d'accès
              </span>
            </div>

            <h1 className="font-black text-4xl sm:text-5xl tracking-tight mb-3 text-white">
              {DENTAL_TOTAL_MODULES} modules ERP
            </h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-slate-400">
              Un seul écosystème pour la gestion de vos patients, soins, finances et communications.
            </p>
          </motion.div>
        </div>
      </div>


      {/* ── GRILLE DES MODULES ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-10">
        {/* Barre de recherche */}
        <div className="relative max-w-lg">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un module, une fonctionnalité..."
            className="w-full rounded-2xl pl-11 pr-4 py-3 text-sm outline-none transition-all bg-surface border border-slate-200/50 dark:border-white/10 text-foreground placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20"
          />
        </div>
        {filteredGroups.length === 0 && (
          <p className="text-center py-16 text-slate-500">
            Aucun module ne correspond à « {search} ».
          </p>
        )}

        {filteredGroups.map((group, groupIdx) => {
          const style = DENTAL_CATEGORY_STYLE[group.key];
          const CatIcon = style.icon;
          return (
            <motion.section
              key={group.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIdx * 0.07, duration: 0.35 }}
            >
              {/* En-tête de groupe */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: style.tint, color: style.color }}
                >
                  <CatIcon size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 
                      className="text-xl sm:text-2xl font-black tracking-tight"
                      style={{ color: style.color }}
                    >
                      {group.label}
                    </h2>
                    <span
                      className="text-[11px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: style.tint, color: style.color }}
                    >
                      {group.modules.length}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500">{group.hint}</p>
                </div>
              </div>

              {/* Cartes de modules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.modules.map(mod => {
                  const ModIcon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setStep(mod.id)}
                      className="group smart-card relative flex items-start gap-4 p-6 rounded-3xl text-left transition-all duration-300 hover:-translate-y-2 bg-surface border border-slate-200/50 dark:border-white/5 premium-shadow micro-bounce"
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = style.color;
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 20px 40px -10px ${style.ring}`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                        (e.currentTarget as HTMLElement).style.boxShadow = "";
                      }}
                    >
                      {/* Icône */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: style.tint, color: style.color }}
                      >
                        <ModIcon size={22} />
                      </div>

                      {/* Texte */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-lg font-bold text-foreground truncate">{mod.name}</p>
                          {mod.badge && (
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest"
                              style={{
                                background: mod.badge === "IA" ? "#7c3aed" : "#2563eb",
                                color: "white",
                              }}
                            >
                              {mod.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-snug mt-1.5 text-slate-500">{mod.desc}</p>
                        <div
                          className="inline-flex items-center gap-1 mt-3 text-sm font-bold uppercase tracking-wide"
                          style={{ color: style.color }}
                        >
                          Ouvrir{" "}
                          <ArrowRight
                            size={13}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="text-center pb-12">
        <p className="text-xs text-foreground/40">
          © {new Date().getFullYear()} Elite ERP · Cabinet Dentaire du Cap Vert, Sénégal
        </p>
      </footer>
    </div>
  );
}
