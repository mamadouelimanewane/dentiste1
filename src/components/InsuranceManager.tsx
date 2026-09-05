"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ShieldCheck, FileText, Landmark, Plus, AlertCircle, CheckCircle, TrendingUp, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";

interface Claim {
  id: string;
  patient_name: string;
  provider: string;
  claim_type: string | null;
  amount: number;
  status: "pending" | "submitted" | "approved" | "rejected" | "paid";
  created_at: string;
  // La facture rattachée est déjà encaissée en totalité alors que la demande
  // court toujours : relancer l'assureur reviendrait à réclamer une somme
  // déjà perçue auprès du patient.
  facture_soldee?: boolean;
  invoice_number?: string | null;
}

const STATUS_LABEL: Record<Claim["status"], string> = {
  pending: "En attente",
  submitted: "Soumis",
  approved: "Validé",
  rejected: "Rejeté",
  paid: "Réglé",
};

const STATUS_BADGE: Record<Claim["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  paid: "bg-emerald-100 text-emerald-700",
};

export function InsuranceManager() {
  const { currentPatient } = usePatient();
  const [claims, setClaims] = useState<Claim[]>([]);
  // Nombre réel de demandes, distinct du nombre de lignes reçues.
  const [total, setTotal] = useState(0);
  const [tronque, setTronque] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ provider: "", policyNumber: "", claimType: "IPM", amount: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insurance-claims");
      const data = await res.json();
      if (res.ok) {
        setClaims(data.claims);
        setTotal(typeof data.total === "number" ? data.total : data.claims.length);
        setTronque(!!data.tronque);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/insurance-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentPatient.id,
          provider: form.provider,
          policyNumber: form.policyNumber,
          claimType: form.claimType,
          amount: Number(form.amount),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ provider: "", policyNumber: "", claimType: "IPM", amount: "" });
        loadClaims();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const [majEnCours, setMajEnCours] = useState<string | null>(null);
  const [erreurMaj, setErreurMaj] = useState<string | null>(null);

  const changerStatut = async (id: string, status: Claim["status"]) => {
    setMajEnCours(id);
    try {
      const res = await fetch("/api/insurance-claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la mise à jour.");
      setClaims((prev) => prev.map((c) => (c.id === id ? data.claim : c)));
    } catch (e) {
      setErreurMaj(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setMajEnCours(null);
    }
  };

  const pendingCount = claims.filter((c) => c.status === "pending" || c.status === "submitted").length;
  const paidTotal = claims.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.amount), 0);
  const rate = claims.length > 0 ? Math.round((claims.filter((c) => c.status === "paid" || c.status === "approved").length / claims.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-blue-900 text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Gestion des Mutuelles</h2>
            <div className="flex items-center gap-2">
              <Landmark className="h-3 w-3 text-blue-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assurances & IPM</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(true)}
            disabled={!currentPatient}
            title={!currentPatient ? "Sélectionnez un patient d'abord" : ""}
            className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Demande PEC
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "PEC en attente", value: loading ? "…" : String(pendingCount), icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Règlements reçus", value: loading ? "…" : `${paidTotal.toLocaleString()} F`, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Taux de Validation", value: loading ? "…" : `${rate}%`, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded", kpi.bg)}>
                  <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</span>
             </div>
             <span className="text-2xl font-black text-slate-900">{kpi.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="overflow-x-auto">
            {erreurMaj && (
              <p className="m-3 p-2 bg-rose-50 border border-rose-200 rounded-sm text-[11px] text-rose-700">
                {erreurMaj}
              </p>
            )}
            <table className="w-full text-left">
              <caption className="sr-only">Demandes de prise en charge</caption>
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="p-3">Patient</th>
                  <th className="p-3">Assureur</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Statut</th>
                  <th className="p-3">Faire évoluer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {/* Sans cette mention, une demande ancienne absente de la
                    liste passait pour inexistante. */}
                {tronque && !loading && (
                  <p className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 mb-3">
                    {claims.length} demandes affichées sur {total} — les dossiers non soldés sont remontés en tête.
                  </p>
                )}
                {!loading && claims.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      Aucune demande de prise en charge pour l'instant.
                    </td>
                  </tr>
                )}
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900 text-xs">{claim.patient_name}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <div>
                          <p className="text-xs font-black text-slate-700">{claim.provider}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{claim.claim_type || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-black text-slate-900 text-xs">{Number(claim.amount).toLocaleString()} F</td>
                    <td className="p-3 text-xs text-slate-500">{new Date(claim.created_at).toLocaleDateString("fr-FR")}</td>
                    <td className="p-3 text-center">
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", STATUS_BADGE[claim.status])}>
                        {STATUS_LABEL[claim.status]}
                      </span>
                      {claim.facture_soldee && (claim.status === "pending" || claim.status === "submitted") && (
                        <p className="mt-1 text-[9px] font-bold text-rose-700 leading-tight">
                          Facture {claim.invoice_number || ""} déjà encaissée en totalité — ne pas relancer
                          l&apos;assureur sans vérifier.
                        </p>
                      )}
                    </td>
                    {/* Aucune action n'existait : une demande restait « en
                        attente » à vie, et les indicateurs de cet écran ne
                        pouvaient jamais dépasser zéro. */}
                    <td className="p-3">
                      <select
                        value={claim.status}
                        disabled={majEnCours === claim.id}
                        onChange={(e) => changerStatut(claim.id, e.target.value as Claim["status"])}
                        className="px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border border-slate-200 bg-white text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        {(Object.keys(STATUS_LABEL) as Claim["status"][]).map((st) => (
                          <option key={st} value={st}>
                            {STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Demande PEC — {currentPatient?.name}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assureur / Mutuelle</label>
                <input
                  required
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                  placeholder="AXA, IPM, Gras Savoye..."
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">N° Police / Adhérent</label>
                <input
                  value={form.policyNumber}
                  onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Montant (FCFA)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold py-2 rounded transition-colors"
              >
                {submitting ? "Envoi…" : "Créer la demande"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-5 rounded-sm flex items-center gap-4">
         <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
            <FileText className="h-6 w-6" />
         </div>
         {/* Annonçait un module « à venir dans une prochaine mise à jour »
             alors que rien n'est engagé. Une promesse sans date ni plan est
             une dette affichée au cabinet à chaque ouverture de l'écran. */}
         <div>
            <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Conventions</h4>
            <p className="text-xs text-blue-700 font-medium">
              Les taux de prise en charge se saisissent au cas par cas sur chaque facture.
              Aucun barème de convention n&apos;est enregistré dans le logiciel.
            </p>
         </div>
      </div>
    </div>
  );
}
