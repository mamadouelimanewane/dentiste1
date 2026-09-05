"use client";

import React, { useState, useEffect } from "react";
import { Settings, Building2, Phone, Mail, MapPin, Globe, FileText, UploadCloud, Save, CheckCircle2, ShieldCheck, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Aucune mention légale pré-remplie.
//
// Ces champs portaient des valeurs inventées mais parfaitement plausibles :
// NINEA « 001234567 2V2 », RCCM « SN-DKR-2026-B-1234 », RPPS
// « 10123456789 », téléphone « +221 33 800 00 00 ». Un administrateur
// ouvrant cet écran voyait des champs déjà remplis, pouvait les croire
// exacts et enregistrer — le cabinet se retrouvait alors avec un NINEA
// fabriqué, qui partait ensuite sur toutes ses factures.
//
// Un champ vide se voit et se remplit ; un faux numéro passe inaperçu.
const DEFAULT_SETTINGS = {
  clinicName: "CABINET DENTAIRE DU CAP VERT",
  slogan: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  rpps: "",
  ninea: "",
  rccm: "",
  currency: "FCFA",
  // Valeur par défaut de la lettre-clé D, en FCFA.
  valeurD: "1200",
};

export function ClinicSettings() {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);
  // Les paramètres ont-ils été relus en base ? Tant que non, enregistrer
  // écraserait le vrai paramétrage du cabinet par les valeurs par défaut —
  // nom, téléphone, NINEA et RCCM compris, alors qu'ils figurent sur les
  // factures.
  const [relu, setRelu] = useState(false);
  const [chargeErreur, setChargeErreur] = useState<string | null>(null);

  // Bases tarifaires. Chaque prix du catalogue est une cotation multipliée par
  // la valeur de la lettre-clé D, qui dépend de la convention appliquée. Une
  // base erronée décale TOUS les devis et TOUTES les factures — d'où un écran
  // dédié, plutôt qu'une constante dans le code.
  const [conventions, setConventions] = useState<{ id: string; nom: string; valeur_d: number; actif: boolean }[]>([]);
  const [nouvNom, setNouvNom] = useState("");
  const [nouvD, setNouvD] = useState("");
  const [convErreur, setConvErreur] = useState<string | null>(null);
  const [convOccupe, setConvOccupe] = useState(false);

  const chargerConventions = () => {
    fetch("/api/conventions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setConventions(d.conventions || []))
      .catch(() => setConvErreur("Conventions non chargées."));
  };

  useEffect(chargerConventions, []);

  const ajouterConvention = async () => {
    setConvErreur(null);
    setConvOccupe(true);
    try {
      const res = await fetch("/api/conventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nouvNom.trim(), valeurD: Number(nouvD) }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Ajout impossible.");
      setNouvNom("");
      setNouvD("");
      chargerConventions();
    } catch (e) {
      setConvErreur(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setConvOccupe(false);
    }
  };

  const modifierConvention = async (id: string, valeurD: number) => {
    setConvErreur(null);
    const res = await fetch("/api/conventions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, valeurD }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setConvErreur(d.error || "Modification impossible.");
      return;
    }
    chargerConventions();
  };

  useEffect(() => {
    fetch("/api/clinic-settings")
      .then(async (res) => {
        const d = await res.json();
        // `res.ok` n'était pas vérifié : une erreur serveur laissait le
        // formulaire sur ses valeurs par défaut, indiscernables d'un cabinet
        // non encore paramétré.
        if (!res.ok) throw new Error(d?.error || "Paramètres non relus.");
        return d;
      })
      .then((data) => {
        setRelu(true);
        if (data.settings) {
          setFormData({
            clinicName: data.settings.clinic_name ?? DEFAULT_SETTINGS.clinicName,
            valeurD: String(data.settings.valeur_d ?? 1200),
            slogan: data.settings.slogan ?? "",
            phone: data.settings.phone ?? "",
            email: data.settings.email ?? "",
            website: data.settings.website ?? "",
            address: data.settings.address ?? "",
            rpps: data.settings.rpps ?? "",
            ninea: data.settings.ninea ?? "",
            rccm: data.settings.rccm ?? "",
            currency: data.settings.currency ?? "FCFA",
          });
        }
      })
      .catch(() =>
        setChargeErreur(
          "Les paramètres du cabinet n'ont pas pu être relus. Les champs ci-dessous affichent des valeurs par défaut : n'enregistrez pas, vous remplaceriez le paramétrage réel (nom, NINEA, RCCM…). Rechargez la page."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relu) {
      setError("Paramètres non relus : enregistrement bloqué pour ne pas écraser le paramétrage du cabinet. Rechargez la page.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/clinic-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'enregistrement.");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-slate-900 text-white rounded flex items-center justify-center shadow-lg">
            <Settings className="h-5 w-5 text-slate-300" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Paramètres du Cabinet</h2>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configuration Globale</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: LOGO & VISUAL IDENTITY */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ImageIcon className="h-4 w-4 text-blue-600" /> Identité Visuelle
              </h3>
              
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-32 w-32 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center group cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors relative overflow-hidden">
                  {/* Pseudo Logo Placeholder */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <UploadCloud className="h-8 w-8 mb-2" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Logo (PNG/JPG)</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-medium text-center px-4">
                  Le logo sera utilisé sur les devis, factures, ordonnances et emails.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nom du Cabinet</label>
                  <input 
                    type="text" 
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Slogan (Optionnel)</label>
                  <input 
                    type="text" 
                    name="slogan"
                    value={formData.slogan}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONTACT & LEGAL */}
          <div className="md:col-span-2 space-y-6">
            
            {/* COORDONNEES */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="h-4 w-4 text-emerald-500" /> Coordonnées
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> Téléphone Principal</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Non renseigné — apparaîtra vide sur les factures et devis"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" /> Email de Contact</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Adresse Postale Complète</label>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Non renseignée — apparaîtra vide sur les factures et devis"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><Globe className="h-3 w-3" /> Site Internet</label>
                  <input 
                    type="text" 
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* INFORMATIONS LEGALES & FISCALES */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="h-4 w-4 text-amber-500" /> Informations Légales & Fiscales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">N° Ordre / RPPS (Praticien Référant)</label>
                  <input 
                    type="text" 
                    name="rpps"
                    value={formData.rpps}
                    onChange={handleChange}
                    placeholder="Non renseigné — apparaîtra vide sur les factures et devis"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">NINEA / N° SIRET</label>
                  <input 
                    type="text" 
                    name="ninea"
                    value={formData.ninea}
                    onChange={handleChange}
                    placeholder="Non renseigné — apparaîtra vide sur les factures et devis"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">N° RCCM (Registre du Commerce)</label>
                  <input 
                    type="text" 
                    name="rccm"
                    value={formData.rccm}
                    onChange={handleChange}
                    placeholder="Non renseigné — apparaîtra vide sur les factures et devis"
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Devise Principale</label>
                  <select 
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                  >
                    <option value="FCFA">FCFA (Franc CFA)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* BASES TARIFAIRES */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-6 space-y-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="h-4 w-4 text-blue-600" /> Bases tarifaires
          </h3>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Chaque prix du catalogue est une <strong>cotation</strong> (D5, D10, D15…)
            multipliée par la valeur de la lettre-clé D. Cette valeur dépend de la
            convention appliquée. <strong>Une base erronée décale tous les devis et
            toutes les factures</strong>, proportionnellement et sans qu&apos;aucun écran
            ne le signale : vérifiez-la auprès de chaque organisme.
          </p>

          <div className="max-w-xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
              Tarif du cabinet — valeur de D
            </label>
            <input
              type="number"
              name="valeurD"
              value={formData.valeurD}
              onChange={handleChange}
              min={100}
              max={100000}
              className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              S&apos;applique aux patients sans convention. Exemple : une consultation
              cotée D5 vaut {(5 * (Number(formData.valeurD) || 0)).toLocaleString("fr-FR")} F.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Conventions ({conventions.length})
            </p>
            {convErreur && (
              <p className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                {convErreur}
              </p>
            )}
            {conventions.length === 0 && (
              <p className="text-[11px] text-slate-500">
                Aucune convention enregistrée : tous les devis utilisent le tarif du cabinet.
              </p>
            )}
            {conventions.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm font-bold text-slate-800 truncate">{c.nom}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">D =</span>
                <input
                  type="number"
                  defaultValue={c.valeur_d}
                  min={100}
                  max={100000}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v !== c.valeur_d) modifierConvention(c.id, v);
                  }}
                  className="w-28 px-2 py-1.5 border border-slate-200 rounded-sm text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div className="flex flex-wrap items-end gap-3 pt-2">
              <div className="flex-1 min-w-[180px]">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  Nouvelle convention
                </label>
                <input
                  value={nouvNom}
                  onChange={(e) => setNouvNom(e.target.value)}
                  placeholder="Ex : IPM Cap Vert"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-32">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">
                  Valeur de D
                </label>
                <input
                  type="number"
                  value={nouvD}
                  onChange={(e) => setNouvD(e.target.value)}
                  placeholder="1200"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* type="button" : ce bouton ne doit pas soumettre le formulaire
                  des paramètres du cabinet, qui est un enregistrement distinct. */}
              <button
                type="button"
                onClick={ajouterConvention}
                disabled={convOccupe || !nouvNom.trim() || !nouvD}
                className="h-10 px-4 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>

        {chargeErreur && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-sm p-3 leading-relaxed">
            {chargeErreur}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-4">
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving || loading || !!chargeErreur}
            title={chargeErreur ? "Paramètres non relus : enregistrement bloqué." : undefined}
            className={cn(
              "h-12 px-8 rounded-sm text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-60",
              isSaved
                ? "bg-emerald-600 text-white shadow-emerald-900/20"
                : "bg-slate-900 text-white hover:bg-black shadow-slate-900/20"
            )}
          >
            {isSaved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Enregistrement…" : isSaved ? "Paramètres Enregistrés" : "Sauvegarder les Paramètres"}
          </button>
        </div>
      </form>
    </div>
  );
}
