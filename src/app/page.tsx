"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Brain,
  Stethoscope,
  Video,
  Database,
  Activity,
  TrendingUp,
  Users,
} from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/40">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/30 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Elite ERP
            </span>
          </div>
          <Link
            href="/login"
            className="group flex items-center gap-2 bg-white hover:bg-slate-200 text-slate-900 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-black/20"
          >
            Se connecter
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-28 px-6 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-indigo-600/20 rounded-full blur-[140px] -z-10 pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_60%,transparent_100%)]" />

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-bold tracking-widest uppercase"
            >
              <Sparkles className="h-4 w-4" />
              Le futur de la gestion dentaire
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]"
            >
              Cabinet Dentaire <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Nouvelle Génération
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium"
            >
              Système de gestion de haute précision dopé à l'intelligence artificielle.
              Gérez vos patients, vos rendez-vous, vos factures et vos diagnostics depuis une plateforme unique.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:brightness-110 text-white px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40"
              >
                Accéder au Système
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>

            {/* Aperçu cockpit — inspiré des tableaux de bord IA */}
            <motion.div variants={itemVariants} className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
              <StatPreviewCard
                icon={Activity}
                label="Score Cabinet"
                value="98/100"
                accent="text-emerald-400"
              />
              <StatPreviewCard
                icon={TrendingUp}
                label="Temps Gagné"
                value="+40%"
                accent="text-indigo-300"
              />
              <StatPreviewCard
                icon={Users}
                label="Suivi Patients"
                value="24/7"
                accent="text-cyan-300"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight">
              Des fonctionnalités de pointe
            </h2>
            <p className="mt-4 text-slate-400 font-medium">Conçu pour l'excellence opérationnelle de votre cabinet.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Brain}
              title="Intelligence Artificielle"
              desc="Dictée vocale neuronale, analyse radiologique assistée et conception de sourire par IA."
              gradient="from-purple-500 to-indigo-600"
            />
            <FeatureCard
              icon={Database}
              title="Portail Patient Connecté"
              desc="Espace sécurisé pour vos patients. Partage d'ordonnances, devis et rappels automatisés (WhatsApp/SMS)."
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={Stethoscope}
              title="Suivi Clinique Intégral"
              desc="Dossiers médicaux complets, plans de traitement, odontogrammes et historique des consultations."
              gradient="from-emerald-500 to-teal-600"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Gestion Administrative"
              desc="Facturation, gestion des mutuelles (IPM, assurances) et suivi de la comptabilité en temps réel."
              gradient="from-amber-500 to-orange-600"
            />
            <FeatureCard
              icon={Video}
              title="Téléconsultation"
              desc="Consultations à distance sécurisées avec partage d'écran et salle d'attente virtuelle."
              gradient="from-rose-500 to-pink-600"
            />
            <FeatureCard
              icon={Sparkles}
              title="Laboratoire & CFAO"
              desc="Gestion avancée des flux numériques, travaux prothétiques et communication avec le laboratoire."
              gradient="from-indigo-500 to-violet-600"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 text-slate-500 py-12 text-center border-t border-white/5">
        <p className="text-sm font-medium">
          &copy; {new Date().getFullYear()} Elite ERP Cabinet Dentaire. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}

function StatPreviewCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors">
      <Icon className={`h-5 w-5 mb-3 ${accent}`} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  gradient,
}: {
  icon: any;
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all group">
      <div
        className={`h-14 w-14 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform`}
      >
        <Icon className="h-7 w-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
