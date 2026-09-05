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
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    fetch("/api/practitioners")
      .then(res => res.json())
      .then(data => {
        if (data.practitioners) setPractitioners(data.practitioners);
      });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("dentiste_lite_dictations");
    if (saved) {
      setDictations(JSON.parse(saved));
    }
  }, []);

  const handleFinalize = async () => {
    setError(null);
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
                <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Notes Vocales IA (Séance)</h4>
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

      {isArchived && (
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {appointmentCreated
              ? "Prochain rendez-vous programmé et ajouté à l'agenda."
              : "Séance clôturée."}
          </p>
        </div>
      )}
    </div>
  );
}
