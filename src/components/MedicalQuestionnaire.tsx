"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Check, AlertCircle, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";

const QUESTIONS = [
  { id: "heart", label: "Problèmes cardiaques" },
  { id: "bp", label: "Hypertension artérielle" },
  { id: "diabetes", label: "Diabète" },
  { id: "allergy", label: "Allergies (Anesthésie, Antibiotiques...)" },
  { id: "blood", label: "Problèmes de coagulation" },
  { id: "pregnancy", label: "Grossesse en cours" },
  { id: "meds", label: "Traitement médical en cours" },
];

interface MedicalHistory {
  answers?: Record<string, boolean>;
  notes?: string;
  updatedAt?: string;
}

// Les antécédents sont désormais enregistrés dans patients.medical_history.
// Auparavant ils n'existaient que dans l'état React : tout était perdu dès
// qu'on changeait d'écran, et le praticien ne voyait jamais ces réponses —
// alors qu'une coagulopathie ou une grossesse conditionne l'anesthésie et
// les prescriptions.
export function MedicalQuestionnaire() {
  const { currentPatient } = usePatient();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  // Distingue « ce patient n'a pas d'antécédent » de « je n'ai pas pu les
  // relire ». Sans cette distinction, un échec de relecture affichait toutes
  // les cases décochées — et un enregistrement écrasait alors les
  // antécédents réels par des valeurs vides.
  const [relu, setRelu] = useState(false);
  const [chargeErreur, setChargeErreur] = useState<string | null>(null);

  const load = useCallback(async (patientId: string) => {
    setRelu(false);
    setChargeErreur(null);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      const data = await res.json();
      // `res.ok` n'était pas vérifié : une erreur serveur renvoyait un objet
      // sans `patient`, donc un historique vide indiscernable d'un patient
      // sans antécédent.
      if (!res.ok) throw new Error(data?.error || "Antécédents non relus.");
      const hist: MedicalHistory | null = data?.patient?.medical_history || null;
      setAnswers(hist?.answers || {});
      setNotes(hist?.notes || "");
      setLastUpdate(hist?.updatedAt || null);
      setRelu(true);
    } catch {
      setChargeErreur(
        "Les antécédents de ce patient n'ont pas pu être relus. Les cases ci-dessous sont vides par défaut : n'enregistrez pas, vous effaceriez ce qui est au dossier. Rechargez la page."
      );
    }
  }, []);

  useEffect(() => {
    if (currentPatient) load(currentPatient.id);
    else {
      setAnswers({});
      setNotes("");
      setLastUpdate(null);
      setRelu(false);
      setChargeErreur(null);
    }
  }, [currentPatient, load]);

  const toggle = (id: string) => {
    setAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!currentPatient) return;
    // Garde-fou : enregistrer un formulaire qu'on n'a pas pu relire revient à
    // effacer les antécédents du dossier. Une coagulopathie ou une grossesse
    // disparaîtrait, et le praticien verrait un historique vierge avant une
    // anesthésie ou une prescription.
    if (!relu) {
      setError("Antécédents non relus : enregistrement bloqué pour ne pas effacer le dossier. Rechargez la page.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/patients/${currentPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medical_history: { answers, notes, updatedAt: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'enregistrement.");
      setSaved(true);
      setLastUpdate(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const vigilances = QUESTIONS.filter((q) => answers[q.id]);

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-12 text-center">
        <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Antécédents médicaux</h3>
        <p className="text-xs text-slate-500 mt-2">
          Sélectionnez un patient pour saisir ou consulter ses antécédents.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-rose-50/30 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <div>
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Antécédents Médicaux</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {currentPatient.name}
              {lastUpdate && ` · mis à jour le ${new Date(lastUpdate).toLocaleDateString("fr-FR")}`}
            </p>
          </div>
        </div>
        <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded uppercase">
          Points de vigilance
        </span>
      </div>

      {vigilances.length > 0 && (
        <div className="px-5 pt-4">
          <div className="bg-rose-50 border border-rose-200 rounded-sm p-3">
            <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">
              À signaler au praticien : {vigilances.map((v) => v.label).join(" · ")}
            </p>
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {QUESTIONS.map((q) => (
            <div
              key={q.id}
              onClick={() => toggle(q.id)}
              className={cn(
                "flex items-center justify-between p-3 rounded border transition-all cursor-pointer select-none",
                answers[q.id]
                  ? "border-rose-200 bg-rose-50/50"
                  : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
              )}
            >
              <span className={cn(
                "text-xs font-black uppercase tracking-tight",
                answers[q.id] ? "text-rose-900" : "text-blue-900"
              )}>
                {q.label}
              </span>
              <div className={cn(
                "h-5 w-5 rounded flex items-center justify-center border transition-all",
                answers[q.id] ? "bg-rose-600 border-rose-600 text-white" : "bg-white border-slate-200"
              )}>
                {answers[q.id] && <Check className="h-3.5 w-3.5" />}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-b-2 border-blue-100 pb-3 mt-8">
          <label className="text-sm font-black text-blue-900 uppercase tracking-tight ml-1">
            Observations Supplémentaires
          </label>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
            placeholder="Détaillez ici toute autre pathologie ou traitement..."
            className="w-full bg-transparent border-none rounded-none p-2 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 outline-none min-h-[80px] resize-none"
          />
        </div>

        {/* L'avertissement est au-dessus du bouton, pas en tête de page : c'est
            là que se prend la décision d'enregistrer. */}
        {chargeErreur && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold rounded-sm p-3 leading-relaxed">
            {chargeErreur}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3">{error}</div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !!chargeErreur}
            title={chargeErreur ? "Antécédents non relus : enregistrement bloqué." : undefined}
            className={cn(
              "h-11 px-6 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 disabled:opacity-50",
              saved ? "bg-emerald-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Enregistrement..." : saved ? "Antécédents enregistrés" : "Enregistrer les antécédents"}
          </button>
        </div>
      </div>
    </div>
  );
}
