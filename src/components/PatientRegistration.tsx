"use client";

import React, { useState, useEffect } from "react";
import { User, Save, CheckCircle2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient, mapDbPatientToContext } from "@/lib/context";

export function PatientRegistration() {
  const { currentPatient, setCurrentPatient } = usePatient();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (currentPatient) return; // dossier déjà créé pour cette session
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

  return (
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
  );
}
