"use client";

import React, { useState, useEffect } from "react";
import {
  User, Save, CheckCircle2, CreditCard, X, Copy, Check,
  MessageCircle, Smartphone, AlertTriangle, ExternalLink, Sparkles, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient, mapDbPatientToContext } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/lib/ToastContext";

interface WelcomeResult {
  link: string | null;
  simulated: boolean;
  channels: string[];
  error?: string;
}

export function PatientRegistration() {
  const { currentPatient, setCurrentPatient } = usePatient();
  const { toast } = useToast();
  
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [welcomeModal, setWelcomeModal] = useState<{
    patientName: string;
    dossier: string;
    welcome: WelcomeResult;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    mutuelle: "",
    allergies: "",
    whatsappPhone: "",
  });
  // Le dossier complet a-t-il été relu en base ? Tant que non, enregistrer
  // reviendrait à effacer les champs que l'écran ne connaît pas.
  const [dossierRelu, setDossierRelu] = useState(true);
  const [chargeErreur, setChargeErreur] = useState<string | null>(null);

  // Le dossier est relu en base, pas reconstruit depuis le contexte.
  //
  // Le contexte patient ne transporte que nom, date de naissance, téléphone
  // et adresse : allergies et mutuelle n'y sont pas. Le formulaire les
  // laissait donc vides — et les renvoyait vides au serveur. Corriger un
  // simple numéro de téléphone depuis cet écran EFFAÇAIT l'allergie
  // enregistrée. Le badge disparaissait de l'en-tête, et le praticien
  // prescrivait sans le savoir.
  useEffect(() => {
    if (currentPatient) {
      const parts = currentPatient.name.split(" ");
      const lastName = parts.pop() || "";
      const firstName = parts.join(" ");

      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        birthDate: currentPatient.birthDate || "",
        phone: currentPatient.phone || "",
        address: currentPatient.address || "",
      }));
      setIsEditing(false);

      setDossierRelu(false);
      setChargeErreur(null);
      fetch(`/api/patients/${currentPatient.id}`)
        .then(async (r) => {
          const d = await r.json();
          if (!r.ok) throw new Error(d?.error || "Dossier non relu.");
          return d;
        })
        .then((d) => {
          const p = d.patient || {};
          setFormData(prev => ({
            ...prev,
            birthDate: p.birth_date ? String(p.birth_date).slice(0, 10) : prev.birthDate,
            phone: p.phone || prev.phone,
            address: p.address || prev.address,
            allergies: p.allergies || "",
            mutuelle: p.mutuelle || "",
            whatsappPhone: p.whatsapp_phone || "",
          }));
          setDossierRelu(true);
        })
        .catch(() =>
          setChargeErreur(
            "Le dossier n'a pas pu être relu en entier. Allergies et mutuelle sont peut-être absentes de l'écran : n'enregistrez pas, vous les effaceriez. Rechargez la page."
          )
        );
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        birthDate: "",
        phone: "",
        email: "",
        address: "",
        mutuelle: "",
        allergies: "",
        whatsappPhone: "",
      });
      setIsEditing(true); // Auto-edit if no patient
      setDossierRelu(true); // création : rien à écraser
      setChargeErreur(null);
    }
  }, [currentPatient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Garde-fou : enregistrer un dossier qu'on n'a pas pu relire en entier
    // écraserait les champs absents de l'écran — allergies au premier chef.
    if (currentPatient && !dossierRelu) {
      setError("Dossier non relu en entier : enregistrement bloqué pour ne pas effacer les allergies ou la mutuelle. Rechargez la page.");
      return;
    }
    setSaving(true);
    setError(null);
    
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    try {
      if (currentPatient) {
        // Mode UPDATE — PATCH /api/patients/:id
        const res = await fetch(`/api/patients/${currentPatient.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            birth_date: formData.birthDate || null,
            phone: formData.phone,
            whatsapp_phone: formData.whatsappPhone || null,
            address: formData.address,
            allergies: formData.allergies,
            mutuelle: formData.mutuelle,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Échec de la mise à jour du dossier.");
        }

        const data = await res.json();
        setCurrentPatient(mapDbPatientToContext(data.patient));
        toast("Fiche patient mise à jour avec succès", "success");
        setIsEditing(false);
      } else {
        // Mode CREATION
        const res = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            birthDate: formData.birthDate || null,
            phone: formData.phone,
            whatsappPhone: formData.whatsappPhone || null,
            address: formData.address,
            allergies: formData.allergies,
            mutuelle: formData.mutuelle,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec de la création du dossier.");
        
        setCurrentPatient(mapDbPatientToContext(data.patient));
        setIsSaved(true);
        toast("Dossier patient créé avec succès", "success");

        if (data.welcome && (data.welcome.link || data.welcome.channels?.length > 0)) {
          setWelcomeModal({
            patientName: data.patient.full_name,
            dossier: data.patient.dossier_number,
            welcome: data.welcome,
          });
        }

        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      toast(err instanceof Error ? err.message : "Erreur inconnue.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm max-w-3xl mx-auto overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#0F172A] p-6 text-white flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Fiche Identification</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Elite ERP Dentaire — Dossier Patient</p>
          </div>
          <div className="flex items-center gap-3">
            {currentPatient && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </button>
            )}
            <div className="h-10 w-10 border border-slate-700 bg-slate-800 rounded flex items-center justify-center">
              <User className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {chargeErreur && (
            <div className="mb-6 bg-amber-50 border border-amber-300 text-amber-900 text-sm font-bold rounded-sm p-3 flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{chargeErreur}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Section 1: Identité */}
          <div className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b pb-2">Identité</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Prénom</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder={isEditing ? "Mamadou" : "Non renseigné"}
                  disabled={!isEditing}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 hover:bg-white disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:shadow-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Nom</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder={isEditing ? "Diallo" : "Non renseigné"}
                  disabled={!isEditing}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 hover:bg-white disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:shadow-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Né(e) le</label>
                {/* Un champ de date désactivé affiche « jj/mm/aaaa » quoi
                    qu'on fasse : sur une fiche en lecture, ce masque se lisait
                    comme une valeur. En consultation, on écrit la date — ou
                    l'on dit qu'elle manque. */}
                {isEditing ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                ) : (
                  <p className={cn("text-sm py-2", formData.birthDate ? "font-bold text-slate-900" : "text-slate-400")}>
                    {formData.birthDate
                      ? new Date(formData.birthDate).toLocaleDateString("fr-FR")
                      : "Non renseignée"}
                  </p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Référence / Dossier</label>
                <p className="text-sm font-black text-blue-600 py-2">
                  {currentPatient?.idNumber || "Généré automatiquement"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Contact */}
          <div className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b pb-2">Contact & Localisation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={isEditing ? "+221 77 000 00 00" : "Non renseigné"}
                  disabled={!isEditing}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 hover:bg-white disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:shadow-none"
                />
              </div>

              {/* Ligne WhatsApp. Beaucoup de patients ont deux puces : sans ce
                  champ, les rappels WhatsApp partaient vers la ligne d'appel,
                  qui n'a pas forcément WhatsApp. La colonne existait et l'envoi
                  s'en servait déjà — il manquait simplement de quoi la saisir. */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  WhatsApp <span className="text-slate-400 normal-case font-medium">(si différent)</span>
                </label>
                <input
                  type="tel"
                  name="whatsappPhone"
                  value={formData.whatsappPhone}
                  onChange={handleChange}
                  placeholder={isEditing ? "Même numéro que ci-dessus" : "Non renseigné"}
                  disabled={!isEditing}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 hover:bg-white disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:shadow-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Email (Optionnel)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={isEditing ? "patient@email.com" : "Non renseigné"}
                  disabled={!isEditing}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 hover:bg-white disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:shadow-none"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Adresse de Résidence</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={isEditing ? "Dakar, Plateau, Rue 12..." : "Non renseignée"}
                  disabled={!isEditing}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 hover:bg-white disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:shadow-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Médical & Administratif */}
          <div className="mb-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b pb-2">Médical & Administratif</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Mutuelle / IPM</label>
                <input
                  type="text"
                  name="mutuelle"
                  value={formData.mutuelle}
                  onChange={handleChange}
                  placeholder={isEditing ? "Ex : IPM Entreprise, AXA..." : "Aucune mutuelle renseignée"}
                  disabled={!isEditing}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300 hover:bg-white disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:shadow-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest text-red-500">Allergies Connues</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder={isEditing ? "Ex : Pénicilline, Latex..." : "Aucune allergie notée"}
                  disabled={!isEditing}
                  className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3.5 text-sm font-bold text-red-900 placeholder:text-red-300 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all shadow-sm hover:border-red-300 hover:bg-white disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 disabled:shadow-none"
                />
              </div>
            </div>
          </div>

          {/* Info envoi automatique (uniquement création) */}
          {!currentPatient && formData.phone && isEditing && (
            <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-xs font-bold text-blue-700">
              <Sparkles className="h-4 w-4 flex-shrink-0" />
              Un SMS + WhatsApp de bienvenue avec le lien portail sera envoyé automatiquement
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Certifié Elite Pro</span>
            </div>
            
            {isEditing && (
              <div className="flex items-center gap-3">
                {currentPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset to patient context values
                      const parts = currentPatient.name.split(" ");
                      setFormData(prev => ({
                        ...prev,
                        firstName: parts.slice(0, -1).join(" ") || currentPatient.name,
                        lastName: parts.length > 1 ? parts.pop() || "" : "",
                        birthDate: currentPatient.birthDate || "",
                        phone: currentPatient.phone || "",
                        address: currentPatient.address || "",
                      }));
                    }}
                    className="h-10 px-5 rounded-md text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving || !!chargeErreur}
                  title={chargeErreur ? "Dossier non relu en entier : enregistrement bloqué." : undefined}
                  className={cn(
                    "h-10 px-6 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-60",
                    isSaved ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200"
                  )}
                >
                  {isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {saving ? "Enregistrement…" : isSaved ? "Enregistré" : currentPatient ? "Sauvegarder" : "Créer le Dossier"}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ── MODALE BIENVENUE (inchangée) ───────────────────────────────────────────── */}
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
