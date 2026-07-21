"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Sparkles, Brain, Stethoscope, Video,
  Database, Activity, TrendingUp, Users, Calendar, MessageSquare,
  Package, BarChart3, Zap, CheckCircle2, Star, Globe, Lock,
  Cpu, HeartPulse, Smile, FlaskConical, Pill,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    title: "Intelligence Artificielle",
    desc: "Dictée vocale neuronale, analyse radiologique assistée et simulation esthétique du sourire par IA.",
    gradient: "from-violet-500 to-indigo-600",
    glow: "shadow-violet-500/25",
  },
  {
    icon: Calendar,
    title: "Agenda Premium",
    desc: "Réservation multi-patients (famille), notifications SMS/WhatsApp automatiques et vue équipe.",
    gradient: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/25",
  },
  {
    icon: Stethoscope,
    title: "Dossier Clinique Complet",
    desc: "Odontogramme interactif, plans de traitement, notes de séance vocales et historique complet.",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/25",
  },
  {
    icon: ShieldCheck,
    title: "Gestion Administrative",
    desc: "Devis, facturation, mutuelles (IPM/assurances) et comptabilité en temps réel.",
    gradient: "from-amber-500 to-orange-600",
    glow: "shadow-amber-500/25",
  },
  {
    icon: MessageSquare,
    title: "Communication Patients",
    desc: "Rappels automatisés, confirmations de RDV et campagnes WhatsApp/SMS en un clic.",
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/25",
  },
  {
    icon: Video,
    title: "Téléconsultation",
    desc: "Consultations à distance sécurisées avec salle d'attente virtuelle intégrée.",
    gradient: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/25",
  },
  {
    icon: FlaskConical,
    title: "Labo & CFAO",
    desc: "Gestion des flux numériques, travaux prothétiques et communication directe avec le laboratoire.",
    gradient: "from-purple-500 to-violet-700",
    glow: "shadow-purple-500/25",
  },
  {
    icon: BarChart3,
    title: "Statistiques & BI",
    desc: "KPIs en temps réel, analyse de performance et pilotage confidentiel de votre cabinet.",
    gradient: "from-indigo-500 to-blue-700",
    glow: "shadow-indigo-500/25",
  },
  {
    icon: Package,
    title: "Stocks & Inventaire",
    desc: "Suivi des consommables, alertes de rupture et commandes fournisseurs automatisées.",
    gradient: "from-teal-500 to-cyan-600",
    glow: "shadow-teal-500/25",
  },
];

const STATS = [
  { icon: Activity, value: "24", label: "Modules ERP", suffix: "", color: "text-blue-400" },
  { icon: Users, value: "100", label: "Patients gérés", suffix: "%", color: "text-emerald-400" },
  { icon: TrendingUp, value: "40", label: "Temps gagné", suffix: "%", color: "text-violet-400" },
  { icon: Zap, value: "< 1s", label: "Temps de réponse", suffix: "", color: "text-amber-400" },
];

const MODULES_PREVIEW = [
  { name: "Accueil", icon: HeartPulse, color: "#3b82f6" },
  { name: "Agenda", icon: Calendar, color: "#8b5cf6" },
  { name: "Clinique", icon: Stethoscope, color: "#10b981" },
  { name: "Radio IA", icon: Brain, color: "#f59e0b" },
  { name: "Smile Design", icon: Smile, color: "#ec4899" },
  { name: "Ordonnances", icon: Pill, color: "#14b8a6" },
  { name: "Stocks", icon: Package, color: "#f97316" },
  { name: "Analytics", icon: BarChart3, color: "#6366f1" },
];

// ── Composant principal ───────────────────────────────────────────────────────

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -80]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setActiveFeature(f => (f + 1) % FEATURES.length), 4000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans overflow-x-hidden selection:bg-indigo-500/40">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
        style={{ background: "rgba(3, 7, 18, 0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
              <svg viewBox="0 0 32 32" fill="none" width="20" height="20">
                <path d="M16 3C10 3 5 8 5 14c0 4 2 7 4 9l1 6h3l1-5h4l1 5h3l1-6c2-2 4-5 4-9 0-6-5-11-11-11z" fill="white" />
              </svg>
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight tracking-tight">Elite ERP Dentaire</p>
              <p className="text-[11px] text-blue-400 font-medium">Cabinet du Cap Vert · Sénégal</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8">
            {["Fonctionnalités", "Modules", "Sécurité"].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`}
                className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>

          <Link href="/login"
            className="group flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-500/40 hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
            Accéder au Portail
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <motion.section style={{ opacity: heroOpacity, y: heroY }}
        className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">

        {/* Arrière-plan ambiante */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full opacity-30"
            style={{ background: "radial-gradient(ellipse, #3730a3 0%, transparent 70%)", filter: "blur(100px)" }} />
          <div className="absolute top-1/2 right-0 w-[600px] h-[500px] opacity-20"
            style={{ background: "radial-gradient(ellipse, #0ea5e9 0%, transparent 70%)", filter: "blur(100px)" }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[400px] opacity-15"
            style={{ background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)", filter: "blur(120px)" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-5xl mx-auto text-center space-y-8">

          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-[0.2em] uppercase"
            style={{ background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.3)", color: "#a5b4fc" }}>
            <Sparkles className="h-3.5 w-3.5" />
            Système de gestion de nouvelle génération
          </motion.div>

          {/* Titre principal */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.0]">
            Votre Cabinet Dentaire,{" "}
            <span className="block mt-2"
              style={{ background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #f472b6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Réinventé.
            </span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Un écosystème ERP complet avec{" "}
            <span className="text-white font-semibold">24 modules intégrés</span> — patients, agenda,
            finances, IA diagnostique et communication — tout en un.
          </motion.p>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login"
              className="group w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-base font-black uppercase tracking-widest transition-all shadow-2xl hover:brightness-110 hover:-translate-y-1"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", boxShadow: "0 20px 60px -15px rgba(99,102,241,0.5)" }}>
              Accéder au Système
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#fonctionnalités"
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-5 rounded-2xl text-base font-bold text-slate-300 hover:text-white border border-white/10 hover:border-white/25 transition-all hover:bg-white/5">
              Découvrir les modules
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Stats en ligne */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="p-5 rounded-2xl text-center border"
                  style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <Icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}{s.suffix}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-widest">{s.label}</p>
                </div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Mockup aperçu dashboard */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.9 }}
          className="mt-20 w-full max-w-5xl mx-auto relative">
          <div className="rounded-3xl border overflow-hidden shadow-2xl"
            style={{ borderColor: "rgba(99,102,241,0.3)", boxShadow: "0 60px 120px -30px rgba(99,102,241,0.4)", background: "rgba(15,23,42,0.95)" }}>
            {/* Barre titre du mockup */}
            <div className="flex items-center gap-2 px-5 py-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)" }}>
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-amber-500/70" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/70" />
              <div className="ml-4 flex-1 h-7 rounded-full px-3 flex items-center"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", border: "1px solid" }}>
                <p className="text-[11px] text-slate-500">elite-erp.vercel.app/dashboard/apps</p>
              </div>
              <div className="h-7 px-4 rounded-full flex items-center text-[11px] font-bold text-emerald-400"
                style={{ background: "rgba(16,185,129,0.1)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                En ligne
              </div>
            </div>
            {/* Contenu du mockup */}
            <div className="p-6">
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {MODULES_PREVIEW.map((mod, i) => {
                  const Icon = mod.icon;
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.1 + i * 0.07 }}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border cursor-pointer hover:scale-105 transition-transform"
                      style={{ background: `${mod.color}12`, borderColor: `${mod.color}30` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${mod.color}20` }}>
                        <Icon style={{ color: mod.color }} className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-300 text-center leading-tight">{mod.name}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Mini-agenda factice */}
              <div className="mt-5 rounded-2xl border p-4"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Agenda du jour</p>
                  <span className="text-[10px] text-blue-400 font-bold">Lundi 21 Juillet 2026</span>
                </div>
                <div className="space-y-2">
                  {[
                    { time: "09:00", name: "Aminata Diallo", type: "Détartrage", color: "#3b82f6" },
                    { time: "10:30", name: "Ibrahima Sow", type: "Consultation", color: "#8b5cf6" },
                    { time: "14:00", name: "Fatou Ndiaye", type: "Pose couronne", color: "#10b981" },
                  ].map((appt, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                      style={{ background: `${appt.color}10`, borderLeft: `3px solid ${appt.color}` }}>
                      <span className="text-[11px] font-black text-slate-400">{appt.time}</span>
                      <span className="text-[11px] font-bold text-white">{appt.name}</span>
                      <span className="ml-auto text-[10px] font-medium text-slate-500">{appt.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Reflet au bas du mockup */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-3/4 h-20 rounded-full opacity-30"
            style={{ background: "radial-gradient(ellipse, #6366f1 0%, transparent 80%)", filter: "blur(30px)" }} />
        </motion.div>
      </motion.section>

      {/* ── BANDE DÉFILANTE ──────────────────────────────────────────────────── */}
      <div className="py-8 border-y overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div className="flex gap-10 animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          {[...Array(3)].flatMap(() =>
            ["Gestion Patients", "Agenda Pro", "Radio IA", "Smile Design", "Facturation", "Téléconsult", "Dictée Vocale", "Ordonnances", "Mutuelles", "Statistiques"]
          ).map((t, i) => (
            <span key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="fonctionnalités" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <p className="text-xs font-black tracking-[0.3em] uppercase text-blue-400 mb-4">Fonctionnalités</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                Tout ce dont votre cabinet<br />
                <span style={{ background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  a besoin, au même endroit.
                </span>
              </h2>
              <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
                9 domaines métier, 24 modules interconnectés, une expérience fluide du premier patient au bilan annuel.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="group relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-2 cursor-default"
                  style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,102,241,0.4)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.06)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)";
                  }}>
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${feat.gradient} shadow-xl ${feat.glow} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir ce module <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SÉCURITÉ ─────────────────────────────────────────────────────────── */}
      <section id="sécurité" className="py-24 px-6 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl p-12 text-center border relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(124,58,237,0.15) 100%)", borderColor: "rgba(99,102,241,0.25)" }}>
            {/* Effet de fond */}
            <div className="absolute inset-0 -z-10 opacity-30"
              style={{ background: "radial-gradient(ellipse at 50% 0%, #3730a3 0%, transparent 70%)" }} />

            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <Lock className="h-8 w-8 text-indigo-300" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Conçu avec la sécurité au cœur
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
              Authentification sécurisée, gestion des rôles RBAC, chiffrement des données et base de données cloud haute disponibilité (Neon PostgreSQL).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
              {[
                { icon: ShieldCheck, label: "Rôles RBAC", desc: "Accès granulaires par module, par utilisateur et par action." },
                { icon: Database, label: "Neon PostgreSQL", desc: "Base de données serverless chiffrée avec réplication multi-zone." },
                { icon: Globe, label: "Déployé sur Vercel", desc: "CDN mondial, HTTPS natif et mises à jour continues sans interruption." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="p-5 rounded-2xl border"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
                    <Icon className="h-6 w-6 text-indigo-400 mb-3" />
                    <p className="font-bold text-white mb-1">{item.label}</p>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 text-center relative">
        <div className="absolute inset-0 -z-10 opacity-20"
          style={{ background: "radial-gradient(ellipse at 50% 50%, #3730a3 0%, transparent 70%)", filter: "blur(60px)" }} />
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 text-xs font-black tracking-widest uppercase"
            style={{ background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.3)", color: "#a5b4fc" }}>
            <Star className="h-3.5 w-3.5" />
            Cabinet Dentaire du Cap Vert
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Prêt à transformer<br />votre cabinet ?
          </h2>
          <p className="text-xl text-slate-400 max-w-xl mx-auto mb-12">
            Connectez-vous et accédez instantanément à l'ensemble de vos outils de gestion dentaire.
          </p>
          <Link href="/login"
            className="group inline-flex items-center gap-3 px-12 py-6 rounded-2xl text-lg font-black uppercase tracking-widest transition-all shadow-2xl hover:brightness-110 hover:-translate-y-1"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", boxShadow: "0 30px 80px -20px rgba(99,102,241,0.6)" }}>
            <Cpu className="h-6 w-6" />
            Accéder au Portail
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-600">
            {["Accès sécurisé", "Données chiffrées", "Support inclus"].map((t, i) => (
              <span key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t py-12 px-6" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)" }}>
              <svg viewBox="0 0 32 32" fill="none" width="14" height="14">
                <path d="M16 3C10 3 5 8 5 14c0 4 2 7 4 9l1 6h3l1-5h4l1 5h3l1-6c2-2 4-5 4-9 0-6-5-11-11-11z" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-400">Elite ERP Dentaire</span>
          </div>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} Elite ERP · Cabinet Dentaire du Cap Vert, Sénégal
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-600">
            <Link href="/mentions-legales" className="hover:text-slate-400 transition-colors">Mentions légales</Link>
            <Link href="/confidentialite" className="hover:text-slate-400 transition-colors">Confidentialité</Link>
            <Link href="/login" className="hover:text-slate-400 transition-colors">Connexion</Link>
          </div>
        </div>
      </footer>

      {/* Style pour l'animation de défilement */}
      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
