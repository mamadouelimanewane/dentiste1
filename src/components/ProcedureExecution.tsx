"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, ShieldCheck, Clock, Plus, Check } from "lucide-react";
import { DENTAL_NOMENCLATURE, DentalProcedure } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { Odontogram } from "@/components/Odontogram";
import { ActCatalogPicker } from "@/components/ActCatalogPicker";

// Standard FDI notation teeth
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

interface ExecutedAct {
  id: string;
  code: string | null;
  label: string;
  tooth: number | null;
  price: number;
  performed_at: string;
}

export function ProcedureExecution() {
  const { currentPatient } = usePatient();
  const [executedActs, setExecutedActs] = useState<ExecutedAct[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [historyActs, setHistoryActs] = useState<ExecutedAct[]>([]);

  const loadActs = useCallback(async () => {
    if (!currentPatient) return;
    const res = await fetch(`/api/executed-acts?patientId=${currentPatient.id}&unbilled=true`);
    const data = await res.json();
    if (res.ok) setExecutedActs(data.acts);
  }, [currentPatient]);

  // Historique complet (y compris les actes déjà facturés) : sert à colorer
  // l'odontogramme. Auparavant aucun état n'était transmis, donc toutes les
  // dents s'affichaient comme saines quel que soit le passé du patient.
  const loadHistory = useCallback(async () => {
    if (!currentPatient) return;
    const res = await fetch(`/api/executed-acts?patientId=${currentPatient.id}`);
    const data = await res.json();
    if (res.ok) setHistoryActs(data.acts || []);
  }, [currentPatient]);

  useEffect(() => {
    loadActs();
    loadHistory();
  }, [loadActs, loadHistory]);

  // État des dents déduit uniquement des actes réellement enregistrés — on
  // ne marque jamais une carie "supposée", seulement ce qui a été fait :
  // extraction => dent absente, restauration/prothèse => dent soignée.
  const toothStates = React.useMemo(() => {
    const states: Record<number, "healthy" | "caries" | "filled" | "missing"> = {};
    for (const act of historyActs) {
      if (!act.tooth) continue;
      const label = (act.label || "").toLowerCase();
      const extraction = /extraction|germectomie|avulsion/.test(label);
      if (extraction) {
        states[act.tooth] = "missing";
      } else if (states[act.tooth] !== "missing") {
        states[act.tooth] = "filled";
      }
    }
    return states;
  }, [historyActs]);

  const addAct = async (procedure: DentalProcedure) => {
    if (!currentPatient) return;
    const res = await fetch("/api/executed-acts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: currentPatient.id,
        code: procedure.id,
        label: procedure.label,
        tooth: selectedTooth || undefined,
        price: procedure.price || 0,
      }),
    });
    if (res.ok) loadActs();
  };

  const removeAct = async (id: string) => {
    await fetch(`/api/executed-acts/${id}`, { method: "DELETE" });
    loadActs();
  };

  const toggleTooth = (tooth: number) => {
    setSelectedTooth(selectedTooth === tooth ? null : tooth);
  };

  const total = executedActs.reduce((sum, act) => sum + Number(act.price), 0);

  if (!currentPatient) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-2 border border-blue-100 shadow-sm">
          <Activity className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Espace Clinique</h2>
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
          Sélectionnez un patient depuis l'agenda ou créez un nouveau dossier pour accéder à l'odontogramme et saisir des actes médicaux.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ODONTOGRAMME VISUEL */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Odontogramme & Sélection</h3>
          </div>
          <span className="text-[9px] font-bold text-blue-200 uppercase">Cliquez sur une dent pour l'isoler</span>
        </div>

        <div className="p-8 flex flex-col items-center gap-6 bg-slate-50/50 overflow-x-auto">
          <Odontogram
            selectedTooth={selectedTooth}
            onSelectTooth={toggleTooth}
            toothStates={toothStates}
          />
          <div className="flex items-center gap-5 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="h-3 w-3 rounded-sm border border-slate-300 bg-white" /> Aucun acte enregistré
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="h-3 w-3 rounded-sm border border-slate-300 bg-[#bfdbfe]" /> Dent soignée
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="h-3 w-3 rounded-sm border border-slate-300 bg-slate-100" /> Extraite
            </span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center max-w-lg">
            État reconstitué à partir des actes enregistrés dans ce logiciel — il ne remplace pas
            l&apos;examen clinique et ne reflète pas les soins réalisés ailleurs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CATALOGUE DES ACTES */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Catalogue des Soins</h4>
             <span className={cn(
               "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
               selectedTooth ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
             )}>
               {selectedTooth ? `Cible: Dent ${selectedTooth}` : "Cible Générale"}
             </span>
          </div>
          <div className="flex-1 min-h-0 max-h-[420px]">
            <ActCatalogPicker onPick={addAct} ctaLabel="Enregistrer l'acte" />
          </div>
        </div>

        {/* ACTES RÉALISÉS (SÉANCE) */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
             <h4 className="text-[10px] font-bold uppercase tracking-widest">Actes de la Séance</h4>
             <span className="text-xs font-black">{total.toLocaleString()} FCFA</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] p-4">
            {executedActs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30 py-10">
                <Activity className="h-10 w-10" />
                <p className="text-xs font-bold uppercase tracking-widest">Aucun acte saisi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {executedActs.map(act => (
                  <div key={act.id} className="flex items-center gap-4 p-3 border border-slate-100 rounded-sm bg-slate-50/50 group animate-in fade-in slide-in-from-left-2">
                    <div className="h-8 w-8 rounded bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {act.tooth ? (
                        <span className="text-[10px] font-black text-blue-600">{act.tooth}</span>
                      ) : (
                        <Check className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-900 truncate uppercase">{act.label}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        {new Date(act.performed_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-900">{Number(act.price).toLocaleString()}</p>
                      <button
                        onClick={() => removeAct(act.id)}
                        className="text-[9px] font-bold text-rose-500 uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sécurisé & Certifié</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-3 w-3" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Fin de séance estimée: +15m</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
