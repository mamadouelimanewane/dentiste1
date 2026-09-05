"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Upload, Trash2, Eye, EyeOff, AlertTriangle, Download } from "lucide-react";
import { usePatient } from "@/lib/context";
import { cn } from "@/lib/utils";

// Documents du dossier, côté cabinet.
//
// Le portail patient annonçait « Fichiers échangés avec le cabinet » et
// savait déposer un fichier — mais aucun écran du cabinet ne les affichait,
// et le cabinet ne pouvait rien partager en retour. Un patient qui envoyait
// son bilan sanguin avant une extraction lisait « Envoyé » ; personne ne le
// recevait. Cet écran ferme les deux directions.

interface DocumentDossier {
  id: string;
  file_name: string;
  blob_url: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_patient: boolean;
  visible_to_patient: boolean;
  created_at: string;
  depose_par: string | null;
}

function poidsLisible(octets: number | null) {
  if (!octets) return "";
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function PatientDocuments() {
  const { currentPatient } = usePatient();
  const [documents, setDocuments] = useState<DocumentDossier[]>([]);
  const [chargeErreur, setChargeErreur] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [visiblePatient, setVisiblePatient] = useState(false);
  const [majEnCours, setMajEnCours] = useState<string | null>(null);
  const champFichier = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    if (!currentPatient) {
      setDocuments([]);
      setChargeErreur(null);
      return;
    }
    try {
      const res = await fetch(`/api/patient-documents?patientId=${currentPatient.id}`);
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.documents || []);
        setChargeErreur(null);
      } else {
        // Une liste vide sur échec ferait croire que le patient n'a rien
        // envoyé — exactement l'inverse de ce qu'il faut savoir avant un acte.
        setChargeErreur(data.error || "Les documents de ce dossier n'ont pas pu être chargés.");
      }
    } catch {
      setChargeErreur("Réseau indisponible : les documents de ce dossier n'ont pas pu être chargés.");
    }
  }, [currentPatient]);

  useEffect(() => {
    charger();
  }, [charger]);

  const deposer = async (fichier: File) => {
    if (!currentPatient) return;
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const formData = new FormData();
      formData.append("file", fichier);
      formData.append("patientId", currentPatient.id);
      formData.append("visibleToPatient", visiblePatient ? "true" : "false");
      const res = await fetch("/api/patient-documents", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Le document n'a pas pu être déposé.");
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setEnvoiEnCours(false);
      if (champFichier.current) champFichier.current.value = "";
    }
  };

  const basculerVisibilite = async (doc: DocumentDossier) => {
    setMajEnCours(doc.id);
    setErreur(null);
    try {
      const res = await fetch("/api/patient-documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: doc.id, visibleToPatient: !doc.visible_to_patient }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Le partage n'a pas pu être modifié.");
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setMajEnCours(null);
    }
  };

  const supprimer = async (doc: DocumentDossier) => {
    // Retirer une pièce d'un dossier de santé se confirme, et son échec se dit.
    if (!window.confirm(`Retirer « ${doc.file_name} » du dossier ?`)) return;
    setMajEnCours(doc.id);
    setErreur(null);
    try {
      const res = await fetch(`/api/patient-documents?id=${doc.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Le document n'a pas pu être retiré.");
      await charger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setMajEnCours(null);
    }
  };

  const recus = documents.filter((d) => d.uploaded_by_patient).length;

  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
      <div className="bg-[#0F172A] p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Documents du Dossier</h3>
        </div>
        <span className="text-[9px] font-bold text-slate-500 uppercase">
          {recus > 0 ? `${recus} reçu${recus > 1 ? "s" : ""} du patient` : "Aucun envoi du patient"}
        </span>
      </div>

      <div className="p-6 space-y-4">
        {!currentPatient && (
          <p className="text-xs text-slate-400 italic">
            Sélectionnez un patient pour consulter les documents de son dossier.
          </p>
        )}

        {chargeErreur && (
          <div className="flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {chargeErreur}
          </div>
        )}
        {erreur && (
          <div className="rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
            {erreur}
          </div>
        )}

        {currentPatient && (
          <div className="flex flex-wrap items-center gap-3 border border-dashed border-slate-300 rounded-sm p-4">
            <input
              ref={champFichier}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              disabled={envoiEnCours}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) deposer(f);
              }}
              className="text-xs"
            />
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
              <input
                type="checkbox"
                checked={visiblePatient}
                onChange={(e) => setVisiblePatient(e.target.checked)}
                className="h-4 w-4"
              />
              Visible par le patient sur son portail
            </label>
            {envoiEnCours && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
                <Upload className="h-3 w-3" /> Dépôt en cours…
              </span>
            )}
          </div>
        )}

        {currentPatient && documents.length === 0 && !chargeErreur && (
          <p className="text-xs text-slate-400 italic">Aucun document dans ce dossier.</p>
        )}

        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center gap-3 border border-slate-200 rounded-sm px-3 py-2"
            >
              <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs font-black text-slate-800 break-all">{doc.file_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {doc.uploaded_by_patient
                    ? "Envoyé par le patient"
                    : `Déposé par ${doc.depose_par || "le cabinet"}`}{" "}
                  · {new Date(doc.created_at).toLocaleDateString("fr-FR")} · {poidsLisible(doc.size_bytes)}
                </p>
              </div>

              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                  doc.visible_to_patient ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                )}
              >
                {doc.visible_to_patient ? "Visible du patient" : "Interne"}
              </span>

              <a
                href={doc.blob_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3 w-3" /> Ouvrir
              </a>

              <button
                type="button"
                onClick={() => basculerVisibilite(doc)}
                disabled={majEnCours === doc.id}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {doc.visible_to_patient ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {doc.visible_to_patient ? "Retirer du portail" : "Partager"}
              </button>

              <button
                type="button"
                onClick={() => supprimer(doc)}
                disabled={majEnCours === doc.id}
                className="flex items-center gap-1 px-3 py-1.5 border border-rose-200 rounded-sm text-[10px] font-black uppercase tracking-widest text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Retirer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
