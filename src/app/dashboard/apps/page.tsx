"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ArrowRight, Search, LayoutGrid, Sparkles, LogOut, Star, Clock, AlertTriangle, Zap } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/lib/auth-context";
import { hasPermission } from "@/lib/modules";
import {
  DENTAL_MODULE_GROUPS,
  DENTAL_CATEGORY_STYLE,
  type DentalCategoryKey,
  type DentalModule,
} from "@/lib/dentalModules";
import { usePatient } from "@/lib/context";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// ── Composant principal ───────────────────────────────────────────────────────

export default function DentalAppsHubPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentPatient } = usePatient();
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [recents, setRecents] = useState<number[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedFavs = localStorage.getItem("dentiste_favorites");
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    const savedRecents = localStorage.getItem("dentiste_recents");
    if (savedRecents) setRecents(JSON.parse(savedRecents));
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.includes(id)) {
      newFavs = favorites.filter(fid => fid !== id);
    } else {
      newFavs = [...favorites, id];
    }
    setFavorites(newFavs);
    localStorage.setItem("dentiste_favorites", JSON.stringify(newFavs));
  };

  const handleOpenModule = (id: number) => {
    // Add to recents
    const newRecents = [id, ...recents.filter(rid => rid !== id)].slice(0, 5);
    setRecents(newRecents);
    localStorage.setItem("dentiste_recents", JSON.stringify(newRecents));

    // Navigate
    localStorage.setItem("dentiste_lite_step", String(id));
    localStorage.setItem("dentiste_home_view", "workflow");
    router.push("/dashboard");
  };

  // Le portail listait les 24 modules à tous les rôles : une assistante y
  // voyait "Comptabilité" ou "Super Admin", et cliquer dessus la renvoyait
  // silencieusement à l'étape Accueil (le module absent de ses droits
  // n'existe pas dans la vue workflow). On n'affiche donc que ses modules.
  const authorizedGroups = useMemo(
    () =>
      DENTAL_MODULE_GROUPS.map(g => ({
        ...g,
        modules: g.modules.filter(m => hasPermission(user.permissions, m.id, 'view')),
      })).filter(g => g.modules.length > 0),
    [user.permissions]
  );

  const allModules = useMemo(() => authorizedGroups.flatMap(g => g.modules), [authorizedGroups]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return authorizedGroups;
    return authorizedGroups
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
  }, [search, authorizedGroups]);

  const categoryKeys = Object.keys(DENTAL_CATEGORY_STYLE) as DentalCategoryKey[];

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-16">
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
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40" style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
              <svg viewBox="0 0 32 32" fill="none" width="22" height="22">
                <path d="M16 3C10 3 5 8 5 14c0 4 2 7 4 9l1 6h3l1-5h4l1 5h3l1-6c2-2 4-5 4-9 0-6-5-11-11-11z" fill="white" />
              </svg>
            </div>
            <div>
              <p className="font-black text-white text-lg leading-tight">Elite ERP Dentaire</p>
              <p className="text-sm text-blue-300 font-medium tracking-widest uppercase">Cap Vert</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {currentPatient && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-semibold text-emerald-300 mr-2">{currentPatient.name}</span>
                {currentPatient.allergies && (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-100 bg-red-600/80 px-2 py-0.5 rounded-full" title={`Allergies: ${currentPatient.allergies}`}>
                    <AlertTriangle className="h-3 w-3" />
                    Alerte
                  </span>
                )}
              </div>
            )}

            <button
              onClick={() => {
                alert("Accès Rapide : Fonctionnalité Urgence activée.");
              }}
              title="Accès Rapide / Urgence"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 transition-colors border border-rose-500/20"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="text-xs font-black uppercase tracking-widest">Urgence</span>
            </button>

            {user && (
              <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-white/15">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-black">
                  {user.fullName?.[0] ?? "?"}
                </div>
                <div className="leading-tight">
                  <p className="text-base font-semibold text-white">{user.fullName}</p>
                  <p className="text-xs font-medium text-blue-300 uppercase tracking-widest">{user.roleLabel}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.setItem("dentiste_home_view", "workflow");
                router.push("/dashboard");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold border transition-all hover:bg-white/5 bg-slate-800/50"
              style={{ color: "#e2e8f0", borderColor: "rgba(255,255,255,0.18)" }}
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline">Vue workflow</span>
            </button>

            <ThemeSwitcher />

            <button
              onClick={signOut}
              title="Déconnexion"
              className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#0F172A] border-b border-slate-800">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-black text-4xl sm:text-5xl tracking-tight mb-2 text-white">
              Portail des Modules
            </h1>
            <p className="text-slate-400 font-medium text-lg">
              Accédez instantanément à vos {allModules.length} outils métiers.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-10 space-y-10">
        
        {/* Recherche et Filtres rapides */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un module (ex: Agenda, Ordonnance...)"
              className="w-full bg-transparent rounded-xl pl-12 pr-4 py-3 text-base font-medium outline-none text-foreground placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ── ACCÈS RAPIDE : Favoris & Récents ─────────────────────────────────────── */}
        {!search && (favorites.length > 0 || recents.length > 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Favoris */}
            {favorites.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                  <Star className="h-4 w-4" /> Mes Favoris
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.map(id => {
                    const mod = allModules.find(m => m.id === id);
                    if (!mod) return null;
                    const group = DENTAL_MODULE_GROUPS.find(g => g.modules.includes(mod));
                    const style = group ? DENTAL_CATEGORY_STYLE[group.key] : DENTAL_CATEGORY_STYLE.systeme;
                    const ModIcon = mod.icon;
                    return (
                      <button key={id} onClick={() => handleOpenModule(id)} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-slate-200/50 dark:border-white/5 hover:border-amber-400/50 transition-all text-left group">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.tint, color: style.color }}>
                          <ModIcon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold truncate text-foreground group-hover:text-amber-500 transition-colors">{mod.name}</p>
                        </div>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" onClick={(e) => toggleFavorite(e, id)} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Récents */}
            {recents.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Récemment Utilisés
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recents.map(id => {
                    const mod = allModules.find(m => m.id === id);
                    if (!mod) return null;
                    const group = DENTAL_MODULE_GROUPS.find(g => g.modules.includes(mod));
                    const style = group ? DENTAL_CATEGORY_STYLE[group.key] : DENTAL_CATEGORY_STYLE.systeme;
                    const ModIcon = mod.icon;
                    return (
                      <button key={`recent-${id}`} onClick={() => handleOpenModule(id)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-slate-200/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                        <ModIcon size={14} style={{ color: style.color }} />
                        <span className="text-sm font-bold text-foreground">{mod.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── TOUS LES MODULES ─────────────────────────────────────── */}
        <div className="space-y-10">
          {filteredGroups.length === 0 && (
            <p className="text-center py-16 text-slate-500 font-medium text-lg">
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
                transition={{ delay: groupIdx * 0.05, duration: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.tint, color: style.color }}>
                    <CatIcon size={16} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight" style={{ color: style.color }}>{group.label}</h2>
                  </div>
                  <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {group.modules.length} modules
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.modules.map(mod => {
                    const ModIcon = mod.icon;
                    const isFav = favorites.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleOpenModule(mod.id)}
                        className="group relative flex flex-col p-5 rounded-2xl cursor-pointer transition-all duration-200 bg-surface border border-slate-200/60 dark:border-white/5 hover:-translate-y-1 hover:shadow-lg"
                        style={{ borderBottomWidth: "3px" }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.borderBottomColor = style.color;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.borderBottomColor = "";
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: style.tint, color: style.color }}>
                            <ModIcon size={18} />
                          </div>
                          <button
                            onClick={(e) => toggleFavorite(e, mod.id)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Star className={`h-4 w-4 transition-colors ${isFav ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                          </button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <p className="text-lg font-black text-foreground truncate">{mod.name}</p>
                            {mod.badge && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest" style={{ background: mod.badge === "IA" ? "#7c3aed" : "#2563eb", color: "white" }}>
                                {mod.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-slate-500 line-clamp-2">{mod.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
