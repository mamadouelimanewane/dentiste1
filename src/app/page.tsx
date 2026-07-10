"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Brain, Stethoscope, Video, Database } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg shadow-md flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-indigo-800">
              Elite ERP
            </span>
          </div>
          <Link
            href="/login"
            className="group flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-slate-900/20"
          >
            Se connecter
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase mb-4">
              <Sparkles className="h-4 w-4" />
              Le futur de la gestion dentaire
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-tight">
              Cabinet Dentaire <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Nouvelle Génération
              </span>
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
              Système de gestion de haute précision dopé à l'intelligence artificielle. 
              Gérez vos patients, vos rendez-vous, vos factures et vos diagnostics depuis une plateforme unique.
            </motion.p>
            
            <motion.div variants={itemVariants} className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20"
              >
                Accéder au Système
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white border-t border-slate-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Des fonctionnalités de pointe
            </h2>
            <p className="mt-4 text-slate-500 font-medium">Conçu pour l'excellence opérationnelle de votre cabinet.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Brain}
              title="Intelligence Artificielle"
              desc="Dictée vocale neuronale, analyse radiologique assistée et conception de sourire par IA."
              color="bg-purple-100 text-purple-700"
            />
            <FeatureCard
              icon={Database}
              title="Portail Patient Connecté"
              desc="Espace sécurisé pour vos patients. Partage d'ordonnances, devis et rappels automatisés (WhatsApp/SMS)."
              color="bg-blue-100 text-blue-700"
            />
            <FeatureCard
              icon={Stethoscope}
              title="Suivi Clinique Intégral"
              desc="Dossiers médicaux complets, plans de traitement, odontogrammes et historique des consultations."
              color="bg-emerald-100 text-emerald-700"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Gestion Administrative"
              desc="Facturation, gestion des mutuelles (IPM, assurances) et suivi de la comptabilité en temps réel."
              color="bg-amber-100 text-amber-700"
            />
            <FeatureCard
              icon={Video}
              title="Téléconsultation"
              desc="Consultations à distance sécurisées avec partage d'écran et salle d'attente virtuelle."
              color="bg-rose-100 text-rose-700"
            />
            <FeatureCard
              icon={Sparkles}
              title="Laboratoire & CFAO"
              desc="Gestion avancée des flux numériques, travaux prothétiques et communication avec le laboratoire."
              color="bg-indigo-100 text-indigo-700"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-center border-t border-slate-800">
        <p className="text-sm font-medium">
          &copy; {new Date().getFullYear()} Elite ERP Cabinet Dentaire. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all group">
      <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-6 ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
