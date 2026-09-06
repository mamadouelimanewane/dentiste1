"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, User, Phone, Calendar, FolderOpen, ArrowUpRight, Send, ShieldOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient, mapDbPatientToContext } from "@/lib/context";

interface PatientRow {
  id: string;
  dossier_number: string;
  full_name: string;
  phone: string | null;
  status: string;
  created_at: string;
}

export function PatientDirectory() {
  const { setCurrentPatient } = usePatient();
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  // Nombre réel de dossiers correspondant à la recherche, qui n'est pas le
  // nombre de lignes reçues : l'API en renvoie au plus 100.
  const [total, setTotal] = useState(0);
  const [tronque, setTronque] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portalFeedback, setPortalFeedback] = useState<string | null>(null);
  const [confirmingAnonymizeId, setConfirmingAnonymizeId] = useState<string | null>(null);
  const [anonymizing, setAnonymizing] = useState<string | null>(null);
  const [rechercheErreur, setRechercheErreur] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      const data = await res.json();
      if (res.ok) {
        setPatients(data.patients);
        setTotal(typeof data.total === "number" ? data.total : data.patients.length);
        setTronque(!!data.tronque);
        setRechercheErreur(null);
      } else {
        // Une recherche qui échouait laissait la liste en l'état, sans un mot :
        // le comptoir en concluait que le patient n'existait pas et rouvrait un
        // second dossier au même nom.
        setRechercheErreur(
          data.error || "La recherche a échoué. Ne créez pas de dossier avant d'avoir rechargé cet écran."
        );
      }
    } catch {
      setRechercheErreur(
        "Réseau indisponible : la recherche n'a pas abouti. Ne créez pas de dossier avant d'avoir rechargé cet écran."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(searchQuery), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, search]);

  const anonymizePatient = async (patient: PatientRow) => {
    setAnonymizing(patient.id);
    setPortalFeedback(null);
    try {
      const res = await fetch(`/api/patients/${patient.id}/anonymize`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'anonymisation.");
      setConfirmingAnonymizeId(null);
      search(searchQuery);
    } catch (e) {
      setPortalFeedback(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setAnonymizing(null);
    }
  };

  const openPatientFile = async (patient: PatientRow) => {
    setRechercheErreur(null);
    try {
      const res = await fetch(`/api/patients/${patient.id}`);
      const data = await res.json();
      if (!res.ok || !data.patient) {
        throw new Error(data.error || "Ce dossier n'a pas pu être ouvert.");
      }
      setCurrentPatient(mapDbPatientToContext(data.patient));
    } catch (e) {
      // Un échec muet laissait le dossier PRÉCÉDENT actif : le praticien
      // croyait avoir changé de patient et travaillait sur le mauvais.
      setRechercheErreur(
        e instanceof Error
          ? `${e.message} Le dossier précédemment ouvert reste actif — vérifiez le bandeau « Patient actif ».`
          : "Erreur inconnue."
      );
    }
  };

  const sendPortalAccess = async (patient: PatientRow, channel: "whatsapp" | "sms") => {
    setPortalFeedback(null);
    try {
      const res = await fetch("/api/portal/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id, channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.");
      setPortalFeedback(
        data.simulated ? `Lien (mode démo, non envoyé réellement) : ${data.link}` : "Lien envoyé au patient."
      );
    } catch (e) {
      setPortalFeedback(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <FolderOpen className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            {/* Redisait « Recherche de dossiers », déjà en titre de page. */}
            <h2 className="text-sm font-bold text-slate-900">Rechercher un dossier</h2>
            <div className="flex items-center gap-2">
              <Search className="h-3 w-3 text-amber-500" />
              <p className="text-[11px] text-slate-500">Par nom, numéro de dossier ou téléphone</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-96 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-sm shadow-inner transition-all focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, dossier ou téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs font-bold outline-none w-full placeholder:text-slate-400 text-slate-900"
          />
        </div>
      </div>

      {rechercheErreur && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-sm p-3 leading-relaxed">
          {rechercheErreur}
        </div>
      )}

      {portalFeedback && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-sm p-3 break-all">
          {portalFeedback}
        </div>
      )}

      <div className="bg-[#0F172A] text-white p-6 rounded-sm flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-8 w-full">
          {/* « Recherche de dossiers » en titre de page, « Rechercher un
              dossier » dans le bandeau au-dessus, et ici « Dossiers patients
              — recherche par nom, numéro de dossier ou téléphone » : trois
              fois la même chose avant d'atteindre la liste. Ne reste que le
              compteur, seule information de ce bloc. */}
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dossiers au fichier</p>
              {/* Affichait `patients.length`, donc au plus 100 : un cabinet de
                  300 dossiers lisait « Total Patients : 100 ». */}
              <p className="text-2xl font-black text-white">{loading ? "…" : total}</p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/20 to-transparent" />
        <User className="absolute -right-4 -top-4 h-32 w-32 text-amber-500 opacity-20" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-sm shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span className="text-slate-900 font-black">{loading ? "…" : total}</span> patient(s) trouvé(s)
          </p>
          {/* Sans cette mention, les dossiers les plus anciens disparaissaient
              de l'annuaire et le personnel les croyait absents du logiciel. */}
          {tronque && !loading && (
            <p className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              {patients.length} affichés sur {total} — précisez votre recherche pour trouver un dossier plus ancien.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patients.length > 0 ? (
            patients.map((patient) => (
              <div key={patient.id} className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 hover:border-amber-300 transition-colors group flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{patient.full_name}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{patient.dossier_number}</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest bg-emerald-100 text-emerald-700">
                    {patient.status}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {patient.phone || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" /> Créé le {new Date(patient.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>

                {confirmingAnonymizeId === patient.id ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-sm p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] font-bold text-rose-800 uppercase leading-tight">
                        Action irréversible : nom, téléphone, adresse et identifiant seront effacés. L'historique clinique/facturation reste conservé de façon anonyme.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => anonymizePatient(patient)}
                        disabled={anonymizing === patient.id}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest"
                      >
                        {anonymizing === patient.id ? "..." : "Confirmer"}
                      </button>
                      <button
                        onClick={() => setConfirmingAnonymizeId(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openPatientFile(patient)}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#1E3A8A] text-slate-700 hover:text-white border border-slate-200 hover:border-[#1E3A8A] px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Ouvrir <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => sendPortalAccess(patient, "whatsapp")}
                      title="Envoyer l'accès au portail patient par WhatsApp"
                      className="px-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-sm transition-all"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmingAnonymizeId(patient.id)}
                      title="Anonymiser ce dossier (droit à l'oubli)"
                      className="px-3 bg-slate-50 hover:bg-rose-600 text-slate-500 hover:text-white border border-slate-200 hover:border-rose-600 rounded-sm transition-all"
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 bg-slate-50 border border-slate-200 border-dashed rounded-sm p-12 text-center flex flex-col items-center">
              <Search className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-black text-slate-700 uppercase tracking-tight">
                {loading ? "Recherche…" : "Aucun patient trouvé"}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {loading ? "" : "Créez un dossier depuis l'étape Accueil, ou modifiez vos critères."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
