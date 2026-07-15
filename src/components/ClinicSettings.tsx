"use client";

import React, { useState, useEffect } from "react";
import { Settings, Building2, Phone, Mail, MapPin, Globe, FileText, UploadCloud, Save, CheckCircle2, ShieldCheck, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_SETTINGS = {
  clinicName: "CABINET DENTAIRE DU CAP VERT",
  slogan: "L'excellence dentaire au Cap Vert",
  phone: "+221 33 800 00 00",
  email: "contact@capvert-dentaire.sn",
  website: "www.capvert-dentaire.sn",
  address: "Avenue du Cap Vert, Dakar, Sénégal",
  rpps: "10123456789",
  ninea: "001234567 2V2",
  rccm: "SN-DKR-2026-B-1234",
  currency: "FCFA",
};

export function ClinicSettings() {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    fetch("/api/clinic-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setFormData({
            clinicName: data.settings.clinic_name ?? DEFAULT_SETTINGS.clinicName,
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-4">
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving || loading}
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
