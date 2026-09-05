"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, User, Phone, CheckCircle2, Stethoscope, ArrowRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PortailPatient() {
  // Identité réelle du cabinet.
  //
  // Cette page est publique. Elle affichait pourtant un nom de cabinet, une
  // adresse (« Dakar, Plateau ») et surtout un numéro de téléphone
  // (« +221 77 000 00 00 ») entièrement inventés : un patient qui cherchait à
  // joindre le cabinet appelait dans le vide.
  const [cabinet, setCabinet] = useState<{
    clinic_name?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/clinic-settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCabinet(d?.settings || null))
      .catch(() => {});
  }, []);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    patientName: "",
    phone: "",
    reason: "Consultation générale",
    date: "",
    time: "10:00",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}:00`).toISOString();
      const res = await fetch("/api/public/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: formData.patientName,
          phone: formData.phone,
          reason: formData.reason,
          scheduledAt,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
      
      setStep(3); // Success
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER PUBLIC */}
      <header className="bg-[#1E3A8A] text-white p-6 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {cabinet?.clinic_name || "Cabinet dentaire"}
              </h1>
              <p className="text-xs text-blue-200 uppercase tracking-widest">Espace Patient</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            {!!cabinet?.phone && <p className="text-sm font-bold">Contact : {cabinet.phone}</p>}
            {!!cabinet?.address && <p className="text-xs text-blue-200">{cabinet.address}</p>}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 mt-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Prendre un Rendez-vous</h2>
                <p className="text-sm text-slate-500 mt-2">Réservez votre consultation en quelques clics. Notre équipe vous recevra dans les meilleures conditions.</p>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2">Motif de consultation</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  >
                    <option>Consultation générale</option>
                    <option>Détartrage</option>
                    <option>Urgence Dentaire</option>
                    <option>Blanchiment</option>
                    <option>Implantologie</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2"><Calendar className="h-4 w-4"/> Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock className="h-4 w-4"/> Heure</label>
                    <input 
                      type="time" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                </div>

                <button
                  disabled={!formData.date || !formData.time}
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-900 bg-white p-2 rounded-full border border-slate-200">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Vos Coordonnées</h2>
                  <p className="text-sm text-slate-500 mt-1">Dernière étape pour envoyer votre demande.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2"><User className="h-4 w-4"/> Nom complet</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Marie Ndiaye"
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    value={formData.patientName}
                    onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 flex items-center gap-2"><Phone className="h-4 w-4"/> Numéro de téléphone</label>
                  <input 
                    type="tel" 
                    placeholder="Ex: 77 123 45 67"
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formData.patientName || !formData.phone}
                  className="w-full py-4 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Envoi…" : "Envoyer ma demande"}
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden text-center p-12"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              {/* Disait « Rendez-vous Confirmé ! ». Personne ne l'avait
                  confirmé : aucun praticien n'y est affecté et rien ne
                  garantit que le créneau soit libre. Le patient pouvait se
                  présenter sans que le cabinet l'attende. */}
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Demande enregistrée</h2>
              <p className="text-slate-600 mb-4 max-w-sm mx-auto">
                Merci {formData.patientName}, votre demande pour <strong>{formData.reason}</strong> le{" "}
                <strong>{new Date(formData.date).toLocaleDateString('fr-FR')}</strong> à{" "}
                <strong>{formData.time}</strong> est bien arrivée au cabinet.
              </p>
              <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
                Le créneau n&apos;est pas encore confirmé : le cabinet vous rappellera au numéro
                que vous avez indiqué. Ne vous déplacez pas avant cet appel.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Retour à l'accueil
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* La page collecte un nom et un téléphone : le patient doit pouvoir
          savoir ce qu'ils deviennent. */}
      <footer className="text-center p-6 text-sm text-slate-400 space-y-1">
        <p>
          &copy; {new Date().getFullYear()} {cabinet?.clinic_name || "Cabinet dentaire"}
        </p>
        <p className="text-xs">
          <Link href="/confidentialite" className="underline hover:text-slate-600">
            Politique de confidentialité
          </Link>
          {" · "}
          <Link href="/mentions-legales" className="underline hover:text-slate-600">
            Mentions légales
          </Link>
        </p>
      </footer>
    </div>
  );
}
