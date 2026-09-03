"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquareText, Send, Printer, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";

interface Explication {
  id: string;
  texte_fr: string;
  texte_wo: string | null;
  source: { actes?: { label: string; prix: number }[]; total?: number; partMutuelle?: number | null };
  modele: string;
  envoye_le: string | null;
  created_at: string;
}

// Reformulation du plan de soins en langage courant, français et wolof.
//
// Le praticien décide, l'application calcule les montants, le modèle ne fait
// que rédiger autour. Rien ne part au patient sans que le praticien ait relu :
// un texte transmis sans relecture engagerait le cabinet sur des mots qu'il
// n'a pas choisis.
export function ExplicationPatient() {
  const { currentPatient } = usePatient();
  const [explication, setExplication] = useState<Explication | null>(null);
  const [historique, setHistorique] = useState<Explication[]>([]);
  const [disponible, setDisponible] = useState(true);
  const [langue, setLangue] = useState<"fr" | "wo">("fr");
  const [enCours, setEnCours] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!currentPatient) return;
    try {
      const res = await fetch(`/api/explications?patientId=${currentPatient.id}`);
      const d = await res.json();
      if (res.ok) {
        setHistorique(d.explications || []);
        setDisponible(d.disponible !== false);
        if ((d.explications || []).length > 0) setExplication(d.explications[0]);
      }
    } catch {
      /* l'historique n'est pas indispensable au fonctionnement */
    }
  }, [currentPatient]);

  useEffect(() => {
    charger();
  }, [charger]);

  const generer = async () => {
    if (!currentPatient) return;
    setEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch("/api/explications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: currentPatient.id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Échec de la rédaction.");
      setExplication(d.explication);
      setHistorique((prev) => [d.explication, ...prev]);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setEnCours(false);
    }
  };

  const envoyer = async () => {
    if (!explication) return;
    setEnvoiEnCours(true);
    setErreur(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/explications/${explication.id}/envoyer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ langue }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Échec de l'envoi.");
      setMessage(
        d.simulated
          ? "Message enregistré (aucun canal d'envoi configuré)."
          : `Envoyé au patient par ${d.canal === "sms" ? "SMS" : "WhatsApp"}.`
      );
      charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const imprimer = () => {
    if (!explication) return;
    const texte = langue === "wo" ? explication.texte_wo : explication.texte_fr;
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8">
      <title>Plan de soins — ${currentPatient?.name || ""}</title>
      <style>
        body{font-family:Georgia,serif;max-width:17cm;margin:2cm auto;line-height:1.7;color:#111}
        h1{font-size:16pt;margin-bottom:4pt}
        .sous{font-size:10pt;color:#555;margin-bottom:24pt}
        .texte{font-size:12pt;white-space:pre-wrap}
        .pied{margin-top:32pt;font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:8pt}
      </style></head><body>
      <h1>Cabinet Dentaire du Cap Vert</h1>
      <p class="sous">Plan de soins — ${currentPatient?.name || ""} — ${new Date().toLocaleDateString("fr-FR")}</p>
      <div class="texte">${(texte || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string))}</div>
      <p class="pied">Ce document explique les soins proposés par votre praticien. Il ne remplace pas le devis, qui seul fait foi pour les montants.</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  if (!currentPatient) {
    return (
      <div className="bg-white border border-slate-200 rounded-sm p-8 text-center shadow-sm">
        <MessageSquareText className="h-8 w-8 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500">
          Sélectionnez un patient pour préparer l&apos;explication de son plan de soins.
        </p>
      </div>
    );
  }

  const texteAffiche = explication
    ? langue === "wo"
      ? explication.texte_wo
      : explication.texte_fr
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-blue-600" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">
            Expliquer les soins au patient
          </h3>
        </div>
        <button
          onClick={generer}
          disabled={enCours || !disponible}
          className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
        >
          {enCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {enCours ? "Rédaction..." : explication ? "Régénérer" : "Rédiger"}
        </button>
      </div>

      <div className="p-4 space-y-3">
        {!disponible && (
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-sm p-2">
            Assistant de rédaction non configuré.
          </p>
        )}
        {erreur && (
          <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-2">{erreur}</p>
        )}
        {message && (
          <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-sm p-2">
            {message}
          </p>
        )}

        {explication ? (
          <>
            <div className="flex gap-1.5">
              {([
                ["fr", "Français"],
                ["wo", "Wolof"],
              ] as const).map(([id, libelle]) => (
                <button
                  key={id}
                  onClick={() => setLangue(id)}
                  disabled={id === "wo" && !explication.texte_wo}
                  className={cn(
                    "px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all disabled:opacity-40",
                    langue === id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  )}
                >
                  {libelle}
                </button>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm">
              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{texteAffiche}</p>
            </div>

            {/* Les montants affichés viennent du dossier, pas du texte rédigé :
                c'est ce qui permet au praticien de vérifier d'un coup d'œil que
                la reformulation n'a rien inventé. */}
            {explication.source?.actes && (
              <div className="border border-slate-200 rounded-sm overflow-hidden">
                <p className="px-3 py-1.5 bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                  Données du dossier ayant servi à ce texte
                </p>
                <ul className="divide-y divide-slate-100">
                  {explication.source.actes.map((a, i) => (
                    <li key={i} className="px-3 py-1.5 flex justify-between text-[11px]">
                      <span className="text-slate-700">{a.label}</span>
                      <span className="font-bold text-slate-900">
                        {Number(a.prix).toLocaleString("fr-FR")} F
                      </span>
                    </li>
                  ))}
                  <li className="px-3 py-1.5 flex justify-between text-[11px] bg-slate-50">
                    <span className="font-black uppercase tracking-widest text-slate-500">Total</span>
                    <span className="font-black text-slate-900">
                      {Number(explication.source.total || 0).toLocaleString("fr-FR")} F
                    </span>
                  </li>
                </ul>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-sm">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-900 leading-relaxed">
                Texte rédigé automatiquement à partir des soins que vous avez saisis.{" "}
                <strong>Relisez-le avant de l&apos;envoyer</strong> : il partira au nom du cabinet.
                Il n&apos;ajoute aucun soin et ne pose aucun diagnostic — comparez les montants
                ci-dessus avec le devis.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={envoyer}
                disabled={envoiEnCours}
                className="flex items-center gap-2 px-4 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 transition-colors"
              >
                {envoiEnCours ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Envoyer au patient
              </button>
              <button
                onClick={imprimer}
                className="flex items-center gap-2 px-4 py-2 rounded-sm border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimer
              </button>
            </div>

            {explication.envoye_le && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Dernier envoi : {new Date(explication.envoye_le).toLocaleString("fr-FR")}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Saisissez les soins ou établissez un devis, puis cliquez sur <strong>Rédiger</strong> :
            le plan sera reformulé en mots simples, en français et en wolof, que vous pourrez
            relire, imprimer ou envoyer au patient.
          </p>
        )}

        {historique.length > 1 && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-1">
            {historique.length} version(s) enregistrée(s) pour ce patient
          </p>
        )}
      </div>
    </div>
  );
}
