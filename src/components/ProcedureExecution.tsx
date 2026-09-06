"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, ShieldCheck, Clock, Plus, Check } from "lucide-react";
import { DENTAL_NOMENCLATURE, DentalProcedure, D_VALUE, prixSelonD } from "@/lib/pricing";
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
  // Un échec de chargement affichait « Aucun acte saisi » — indiscernable
  // d'un dossier vierge. Le praticien pouvait conclure qu'aucun soin n'avait
  // été enregistré et ressaisir toute la séance.
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Base tarifaire de la séance.
  //
  // Les actes étaient enregistrés au prix figé du catalogue, c'est-à-dire au
  // tarif du cabinet — quelle que soit la convention. Le devis, lui, avait été
  // rendu paramétrable : un patient couvert par une IPM signait donc un devis
  // calculé sur SA lettre-clé, puis était facturé sur celle du cabinet. Le
  // décalage n'apparaissait nulle part.
  //
  // La séance suit désormais la base du devis accepté le plus récent, à défaut
  // celle du cabinet, et l'écran dit laquelle il applique.
  const [valeurD, setValeurD] = useState<number>(D_VALUE);
  const [nomBase, setNomBase] = useState<string>("Tarif du cabinet");
  const [baseErreur, setBaseErreur] = useState<string | null>(null);

  const chargerBase = useCallback(async () => {
    if (!currentPatient) return;
    try {
      const [convRes, devisRes] = await Promise.all([
        fetch("/api/conventions"),
        fetch(`/api/quotes?patientId=${currentPatient.id}`),
      ]);
      const conv = await convRes.json();
      const devis = await devisRes.json();
      if (!convRes.ok) throw new Error(conv?.error || "Base tarifaire du cabinet non chargée.");

      const baseCabinet =
        typeof conv?.valeurCabinet === "number" ? conv.valeurCabinet : D_VALUE;

      const accepte = devisRes.ok
        ? (devis.quotes || []).find(
            (q: { status?: string; valeur_d?: number | null }) =>
              q.status === "accepted" && q.valeur_d
          )
        : null;

      if (accepte) {
        setValeurD(Number(accepte.valeur_d));
        setNomBase(accepte.convention || "Base du devis accepté");
      } else {
        setValeurD(baseCabinet);
        setNomBase("Tarif du cabinet");
      }
      setBaseErreur(null);
    } catch (e) {
      // Sans base chargée, on reste sur celle par défaut et on le dit plutôt
      // que d'enregistrer des actes à un tarif peut-être faux.
      setBaseErreur(
        e instanceof Error
          ? `${e.message} Les actes seraient enregistrés au tarif par défaut (D = ${D_VALUE} F).`
          : "Base tarifaire non chargée."
      );
    }
  }, [currentPatient]);

  const loadActs = useCallback(async () => {
    if (!currentPatient) return;
    setChargement(true);
    try {
      const res = await fetch(`/api/executed-acts?patientId=${currentPatient.id}&unbilled=true`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chargement des actes impossible.");
      setExecutedActs(data.acts);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Chargement des actes impossible.");
    } finally {
      setChargement(false);
    }
  }, [currentPatient]);

  // Historique complet (y compris les actes déjà facturés) : sert à colorer
  // l'odontogramme. Auparavant aucun état n'était transmis, donc toutes les
  // dents s'affichaient comme saines quel que soit le passé du patient.
  const loadHistory = useCallback(async () => {
    if (!currentPatient) return;
    try {
      const res = await fetch(`/api/executed-acts?patientId=${currentPatient.id}`);
      const data = await res.json();
      if (res.ok) setHistoryActs(data.acts || []);
      // L'odontogramme se colore à partir de cet historique : s'il n'arrive
      // pas, les dents s'affichent saines. Le message d'erreur ci-dessus
      // prévient que l'écran n'est pas à jour.
      else setErreur(data.error || "Historique indisponible : l'odontogramme peut être incomplet.");
    } catch {
      setErreur("Historique indisponible : l'odontogramme peut être incomplet.");
    }
  }, [currentPatient]);

  useEffect(() => {
    loadActs();
    loadHistory();
    chargerBase();
  }, [loadActs, loadHistory, chargerBase]);

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
        price: prixSelonD(procedure, valeurD),
      }),
    });
    // Un échec restait muet : l'acte n'apparaissait pas et le praticien
    // recliquait sans comprendre, au risque de l'enregistrer deux fois.
    if (res.ok) {
      setErreur(null);
      loadActs();
      loadHistory();
    } else {
      const d = await res.json().catch(() => ({}));
      setErreur(d.error || "L'acte n'a pas été enregistré.");
    }
  };

  const removeAct = async (id: string, label: string) => {
    // Retirer un acte réalisé est un geste sur le dossier de soins, pas un
    // détail d'interface : il se confirme, et son échec se dit.
    if (!window.confirm(`Retirer « ${label} » de la séance ?`)) return;
    const res = await fetch(`/api/executed-acts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setErreur(null);
      loadActs();
      loadHistory();
    } else {
      const d = await res.json().catch(() => ({}));
      setErreur(d.error || "L'acte n'a pas pu être retiré.");
    }
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
      {erreur && (
        <div className="flex items-start gap-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-sm p-3">
          <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{erreur}</span>
        </div>
      )}

      {/* ODONTOGRAMME VISUEL */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-[#1E3A8A] p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Odontogramme & Sélection</h3>
          </div>
          <span className="text-[9px] font-bold text-blue-200 uppercase">Cliquez sur une dent pour l'isoler</span>
        </div>

        {/* Plus de défilement horizontal : l'arcade se replie par quadrant
            quand la largeur manque (voir Odontogram). Un cadre qui défile
            latéralement cachait la moitié de la bouche. */}
        <div className="p-4 sm:p-8 flex flex-col items-center gap-6 bg-slate-50/50">
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
          {/* Cet avertissement était en petites capitales gris pâle, centré
              sur quatre lignes : la mise en forme qu'on réserve aux mentions
              qu'on espère voir ignorées. C'est pourtant ce qu'il faut lire. */}
          <p className="avertissement-clinique text-slate-600 max-w-xl">
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
          {/* Base tarifaire appliquée : les actes étaient enregistrés au tarif
              du cabinet même quand le devis signé retenait une autre lettre-clé. */}
          <div className="px-4 py-2 border-b border-slate-100 bg-white">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {nomBase} — D = {valeurD.toLocaleString("fr-FR")} F
            </p>
            {baseErreur && (
              <p className="mt-1 text-[10px] font-bold text-rose-700 leading-relaxed">{baseErreur}</p>
            )}
          </div>
          <div className="flex-1 min-h-0 max-h-[420px]">
            <ActCatalogPicker onPick={addAct} ctaLabel="Enregistrer l'acte" valeurD={valeurD} />
          </div>
        </div>

        {/* ACTES RÉALISÉS (SÉANCE) */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
             <h4 className="text-[10px] font-bold uppercase tracking-widest">Actes de la Séance</h4>
             <span className="text-xs font-black">{total.toLocaleString()} FCFA</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] p-4">
            {chargement ? (
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center py-10">
                Chargement…
              </p>
            ) : executedActs.length === 0 ? (
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
                        onClick={() => removeAct(act.id, act.label)}
                        // Le bouton n'apparaissait qu'au survol : sur une
                        // tablette au fauteuil, sans survol, il était
                        // inatteignable.
                        // Le rouge revient à l'alerte clinique : retirer une
                        // ligne saisie par erreur n'est pas un danger, et ce
                        // bouton répété sur chaque acte dominait la liste.
                        className="text-[10px] font-medium text-slate-500 hover:text-rose-700 hover:underline"
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
