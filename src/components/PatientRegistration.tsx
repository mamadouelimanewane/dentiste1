"use client";

import React, { useState, useEffect } from "react";
import {
  User, Save, CheckCircle2, CreditCard, X, Copy, Check,
  MessageCircle, Smartphone, AlertTriangle, ExternalLink, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient, mapDbPatientToContext } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeResult {
  link: string | null;
  simulated: boolean;
  channels: string[];
  error?: string;
}

export function PatientRegistration() {
  const { currentPatient, setCurrentPatient } = usePatient();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcomeModal, setWelcomeModal] = useState<{
    patientName: string;
    dossier: string;
    welcome: WelcomeResult;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (currentPatient) {
      setFormData({
        name: currentPatient.name,
        birthDate: currentPatient.birthDate,
        phone: currentPatient.phone,
        address: currentPatient.address,
      });
    }
  }, [currentPatient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPatient) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.name,
          birthDate: formData.birthDate || null,
          phone: formData.phone,
          address: formData.address,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la création du dossier.");
      setCurrentPatient(mapDbPatientToContext(data.patient));
      setIsSaved(true);

      // Afficher la modale de bienvenue si un message a été tenté
      if (data.welcome && (data.welcome.link || data.welcome.channels?.length > 0)) {
        setWelcomeModal({
          patientName: data.patient.full_name,
          dossier: data.patient.dossier_number,
          welcome: data.welcome,
        });
      }

      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCopyLink = async () => {
    if (!welcomeModal?.welcome.link) return;
    await navigator.clipboard.writeText(welcomeModal.welcome.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm max-w-2xl mx-auto overflow-hidden">
        {/* Card Header - Business Card Style */}
        <div className="bg-[#1E3A8A] p-6 text-white flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Fiche Identification</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Cabinet Dentaire Elite — Dossier Patient</p>
          </div>
          <div className="h-10 w-10 border border-slate-700 rounded flex items-center justify-center">
            <User className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm p-3">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {/* Nom & Prénom */}
            <div className="space-y-2 border-b-2 border-blue-100 pb-3">
              <label className="text-sm font-black text-blue-900 uppercase tracking-tight">Nom & Prénom</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Mamadou Diallo"
                disabled={!!currentPatient}
                className="w-full bg-transparent border-none p-0 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 outline-none disabled:opacity-60"
                required
              />
            </div>

            {/* Date de Naissance */}
            <div className="space-y-2 border-b-2 border-blue-100 pb-3">
              <label className="text-sm font-black text-blue-900 uppercase tracking-tight">Né(e) le</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                disabled={!!currentPatient}
                className="w-full bg-transparent border-none p-0 text-base font-bold text-slate-900 focus:ring-0 outline-none disabled:opacity-60"
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2 border-b-2 border-blue-100 pb-3">
              <label className="text-sm font-black text-blue-900 uppercase tracking-tight">Contact / Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+221 77 000 00 00"
                disabled={!!currentPatient}
                className="w-full bg-transparent border-none p-0 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 outline-none disabled:opacity-60"
              />
            </div>

            {/* N° Dossier (généré côté serveur) */}
            <div className="space-y-2 border-b-2 border-blue-100 pb-3">
              <label className="text-sm font-black text-blue-900 uppercase tracking-tight">Référence ID / Dossier</label>
              <p className="text-base font-bold text-slate-400">
                {currentPatient?.idNumber || "Généré automatiquement à l'enregistrement"}
              </p>
            </div>
          </div>

          {/* Adresse */}
          <div className="mt-8 space-y-2 border-b-2 border-blue-100 pb-3">
            <label className="text-sm font-black text-blue-900 uppercase tracking-tight">Adresse de Résidence</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Dakar, Plateau, Rue 12..."
              disabled={!!currentPatient}
              className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 placeholder:text-slate-200 focus:ring-0 outline-none disabled:opacity-60"
            />
          </div>

          {/* Info envoi automatique */}
          {!currentPatient && formData.phone && (
            <div className="mt-6 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-[10px] font-bold text-blue-700 uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
              Un SMS + WhatsApp de bienvenue avec le lien portail sera envoyé automatiquement
            </div>
          )}

          <div className="mt-10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Certifié Elite Pro</span>
            </div>
            <button
              type="submit"
              disabled={saving || !!currentPatient}
              className={cn(
                "h-9 px-6 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-60",
                isSaved || currentPatient
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-white hover:bg-black"
              )}
            >
              {isSaved || currentPatient ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Enregistrement…" : isSaved || currentPatient ? "Dossier Créé" : "Enregistrer la Fiche"}
            </button>
          </div>
        </form>
      </div>

      {/* ── MODALE BIENVENUE ───────────────────────────────────────────── */}
      <AnimatePresence>
        {welcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-500 p-6 text-white relative">
                <button
                  onClick={() => setWelcomeModal(null)}
                  className="absolute top-4 right-4 p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Dossier créé</p>
                    <h3 className="text-lg font-black">{welcomeModal.patientName}</h3>
                    <p className="text-[11px] text-blue-200 font-bold">N° {welcomeModal.dossier}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Badge mode démo ou envoi réel */}
                {welcomeModal.welcome.simulated ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Mode démo — Messages simulés (clés API non configurées)
                  </div>
                ) : welcomeModal.welcome.channels.length > 0 ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    Messages envoyés avec succès
                  </div>
                ) : null}

                {/* Canaux */}
                {welcomeModal.welcome.channels.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Canaux notifiés
                    </p>
                    <div className="flex gap-2">
                      {welcomeModal.welcome.channels.includes('whatsapp') && (
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                          {welcomeModal.welcome.simulated && <span className="opacity-60">(sim.)</span>}
                        </div>
                      )}
                      {welcomeModal.welcome.channels.includes('sms') && (
                        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                          <Smartphone className="h-3.5 w-3.5" />
                          SMS
                          {welcomeModal.welcome.simulated && <span className="opacity-60">(sim.)</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lien portail */}
                {welcomeModal.welcome.link && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      Lien portail patient
                    </p>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded p-3">
                      <p className="flex-1 text-xs font-mono text-slate-600 truncate">
                        {welcomeModal.welcome.link}
                      </p>
                      <button
                        onClick={handleCopyLink}
                        title="Copier le lien"
                        className="flex-shrink-0 flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copié !" : "Copier"}
                      </button>
                    </div>
                    <a
                      href={welcomeModal.welcome.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ouvrir le portail patient
                    </a>
                  </div>
                )}

                {/* Message d'erreur partielle */}
                {welcomeModal.welcome.error && (
                  <p className="text-[10px] text-red-600 font-bold">
                    Avertissement : {welcomeModal.welcome.error}
                  </p>
                )}

                {/* Message si pas de téléphone */}
                {!welcomeModal.welcome.link && welcomeModal.welcome.channels.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Aucun numéro de téléphone renseigné — le message de bienvenue n&apos;a pas été envoyé.
                    Vous pouvez l&apos;envoyer manuellement depuis le module <strong>Communication</strong>.
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setWelcomeModal(null)}
                  className="px-6 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white text-[10px] font-black uppercase tracking-widest rounded transition-colors"
                >
                  Continuer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
