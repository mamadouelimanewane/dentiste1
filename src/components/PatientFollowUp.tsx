"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Archive, FileCheck, Star, ArrowRight, MessageSquare, Mic, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { PatientImaging } from "./PatientImaging";
import { PatientDocuments } from "./PatientDocuments";

export function PatientFollowUp() {
  const { currentPatient } = usePatient();
  const [nextAppointment, setNextAppointment] = useState("");
  const [satisfaction, setSatisfaction] = useState(5);
  const [isArchived, setIsArchived] = useState(false);
  const [dictations, setDictations] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointmentCreated, setAppointmentCreated] = useState(false);
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>("");
  const [apptType, setApptType] = useState("Contrôle");
  const [seanceCloturee, setSeanceCloturee] = useState<boolean | null>(null);
  const [duration, setDuration] = useState(30);

  // La liste des praticiens alimente le choix du prochain rendez-vous. Un
  // échec la laissait vide, sans un mot et sans même de `.catch` : le
  // sélecteur restait sur « Non assigné » et le rendez-vous partait sans
  // praticien, ce qui ressemblait à un choix.
  useEffect(() => {
    fetch("/api/practitioners")
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d?.error || "Praticiens non chargés.");
        return d;
      })
      .then((data) => setPractitioners(data.practitioners || []))
      .catch((e) =>
        setError(
          `${e instanceof Error && e.message ? e.message : "Praticiens non chargés."} Le rendez-vous serait créé sans praticien affecté.`
        )
      );
  }, []);

  // Notes vocales de CE patient.
  //
  // L'historique des dictées est global au navigateur : cet écran affichait
  // donc, sous « Notes Vocales IA (Séance) », les dictées prises pour
  // n'importe quel autre patient — des observations cliniques attribuées au
  // mauvais dossier. On ne retient que celles rattachées au dossier ouvert.
  useEffect(() => {
    if (!currentPatient) {
      setDictations([]);
      return;
    }
    try {
      const saved = localStorage.getItem("dentiste_lite_dictations");
      const toutes = saved ? JSON.parse(saved) : [];
      setDictations(
        (Array.isArray(toutes) ? toutes : []).filter(
          (d: { patientId?: string | null }) => d.patientId === currentPatient.id
        )
      );
    } catch {
      setDictations([]);
    }
  }, [currentPatient]);

  const handleFinalize = async () => {
    setError(null);

    // Clôture réelle de la séance.
    //
    // Le bouton disait « Finaliser & archiver la séance » et ne faisait
    // qu'une chose : créer le prochain rendez-vous. Le rendez-vous du jour
    // restait « programmé » en base — la séance n'était archivée nulle part,
    // et la note de satisfaction saisie juste au-dessus était simplement
    // perdue. On clôt donc le rendez-vous du jour et on y attache la note.
    if (currentPatient) {
      setSaving(true);
      try {
        const debut = new Date();
        debut.setHours(0, 0, 0, 0);
        const fin = new Date(debut);
        fin.setDate(fin.getDate() + 1);
        const params = new URLSearchParams({ from: debut.toISOString(), to: fin.toISOString() });
        const res = await fetch(`/api/appointments?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "L'agenda du jour n'a pas pu être lu.");

        const duJour = (data.appointments || []).find(
          (a: { patient_id?: string; status?: string }) =>
            a.patient_id === currentPatient.id && a.status !== "cancelled" && a.status !== "no_show"
        );

        if (duJour) {
          const maj = await fetch(`/api/appointments/${duJour.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "complete", satisfaction }),
          });
          const majData = await maj.json().catch(() => ({}));
          if (!maj.ok) throw new Error(majData.error || "La séance n'a pas pu être clôturée.");
          setSeanceCloturee(true);
        } else {
          // Dire ce qui n'a pas eu lieu plutôt que d'afficher « archivé ».
          setSeanceCloturee(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }

    if (nextAppointment && currentPatient) {
      setSaving(true);
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: currentPatient.id,
            practitionerId: selectedPractitioner || undefined,
            scheduledAt: new Date(nextAppointment).toISOString(),
            durationMinutes: duration,
            type: apptType,
            notes: "Rendez-vous programmé depuis la clôture de séance.",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
           if (res.status === 409) throw new Error("Conflit d'agenda à cet horaire pour ce praticien.");
           throw new Error(data.error || "Échec de la programmation du rendez-vous.");
        }
        setAppointmentCreated(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
        setSaving(false);
        return;
      } finally {
        setSaving(false);
      }
    }
    setIsArchived(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* IMAGING GALLERY */}
      <PatientImaging />

      {/* Documents du dossier : ce que le patient a envoyé depuis son portail
          n'était visible nulle part côté cabinet. */}
      <PatientDocuments />

      {/* CLOTURE */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-[#0F172A] p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-emerald-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Clôture du Dossier</h3>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase">
            {currentPatient ? `Dossier : ${currentPatient.idNumber}` : "Aucun patient sélectionné"}
          </span>
        </div>

        <div className="p-8 space-y-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3">{error}</div>
          )}
          {/* Dictations Summary */}
          {dictations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Notes vocales de ce dossier</h4>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-sm p-4 space-y-3">
                {dictations.map((d, i) => (
                  <div key={d.id || i} className="border-b border-slate-200 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{d.category}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{d.date}</span>
                    </div>
                    <p className="text-sm text-slate-700 italic">"{d.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Appointment */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Prochain Rendez-vous</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="datetime-local" 
                className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-300 transition-all"
                value={nextAppointment}
                onChange={(e) => setNextAppointment(e.target.value)}
              />
              <select
                value={selectedPractitioner}
                onChange={(e) => setSelectedPractitioner(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-300 transition-all appearance-none"
              >
                <option value="">-- Non assigné --</option>
                {practitioners.map(p => (
                  <option key={p.id} value={p.id}>Dr. {p.full_name}</option>
                ))}
              </select>
              <select
                value={apptType}
                onChange={(e) => setApptType(e.target.value)}
                className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-300 transition-all appearance-none"
              >
                <option value="Contrôle">Contrôle</option>
                <option value="Consultation">Consultation</option>
                <option value="Soins">Soins</option>
                <option value="Prothèse">Prothèse</option>
                <option value="Chirurgie">Chirurgie</option>
                <option value="Urgence">Urgence</option>
              </select>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-300 transition-all appearance-none"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 heure</option>
                <option value={90}>1h 30</option>
              </select>
            </div>
            
            <div className="mt-4">
              {currentPatient?.phone ? (
                <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wide">
                    {nextAppointment ? "Rappel automatique programmé (WhatsApp/SMS)" : "Un rappel sera envoyé 24h avant le RDV"}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Ce patient n'a pas de numéro — aucun rappel ne sera envoyé</p>
                </div>
              )}
            </div>
          </div>

          {/* Satisfaction */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Expérience Patient</h4>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <button 
                  key={i} 
                  onClick={() => setSatisfaction(i)}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center border transition-all",
                    satisfaction >= i ? "bg-yellow-50 border-yellow-200 text-yellow-500" : "bg-slate-50 border-slate-100 text-slate-300"
                  )}
                >
                  <Star className={cn("h-5 w-5", satisfaction >= i ? "fill-current" : "")} />
                </button>
              ))}
              <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">Note: {satisfaction}/5</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Cette note est rattachée à la séance lors de la clôture. Elle n&apos;est pas visible du
              patient.
            </p>
          </div>

          {/* Final Action */}
          <div className="pt-10">
            <button
              onClick={handleFinalize}
              disabled={isArchived || saving}
              className={cn(
                "w-full h-14 rounded-sm flex items-center justify-center gap-3 transition-all disabled:cursor-default",
                isArchived
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100"
              )}
            >
              {isArchived ? (
                <>
                  <FileCheck className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Séance Clôturée</span>
                </>
              ) : (
                <>
                  <Archive className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    {saving ? "Enregistrement…" : "Finaliser & Archiver la Séance"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dire ce qui a réellement eu lieu. « Séance clôturée » s'affichait
          quoi qu'il arrive, alors que rien n'était enregistré. */}
      {isArchived && (
        <div className="text-center space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {seanceCloturee
              ? `Séance clôturée dans l'agenda, satisfaction ${satisfaction}/5 enregistrée.`
              : "Aucun rendez-vous du jour à clôturer pour ce patient : la note de satisfaction n'a pas été enregistrée."}
          </p>
          {appointmentCreated && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Prochain rendez-vous programmé et ajouté à l&apos;agenda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
