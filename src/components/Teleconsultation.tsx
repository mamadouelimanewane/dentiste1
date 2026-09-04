"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Video, PhoneCall, Star, Clock, Users, Activity, FileText, Pill, Save, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

interface UpcomingAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  type: string | null;
  duration_minutes: number;
  scheduled_at: string;
  daily_room_url: string | null;
}

export function Teleconsultation({ onNavigate }: { onNavigate?: (step: number) => void } = {}) {
  const [activeTab, setActiveTab] = useState<'avenir' | 'historique'>('avenir');
  const [isCalling, setIsCalling] = useState(false);
  const [activePatient, setActivePatient] = useState<string | null>(null);
  // Le nom seul ne permet pas de rattacher une note à un dossier.
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  // Notes de séance. La zone de saisie n'était reliée à rien et le bouton
  // « Sauvegarder » n'avait aucune action : le praticien écrivait ses
  // observations pendant la téléconsultation, cliquait, et tout était perdu
  // sans le moindre avertissement.
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesMsg, setNotesMsg] = useState<string | null>(null);
  const [notesErr, setNotesErr] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [joining, setJoining] = useState<string | null>(null);
  const [simulatedMode, setSimulatedMode] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<DailyCall | null>(null);

  const enregistrerNotes = async () => {
    if (!notes.trim()) return;
    if (!activePatientId) {
      setNotesErr("Rejoignez d'abord une consultation : la note doit être rattachée à un dossier.");
      return;
    }
    setSavingNotes(true);
    setNotesErr(null);
    setNotesMsg(null);
    try {
      const res = await fetch("/api/clinical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: activePatientId, content: notes.trim(), type: "teleconsultation" }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Échec de l'enregistrement.");
      setNotes("");
      setNotesMsg("Note enregistrée dans le dossier du patient.");
    } catch (e) {
      setNotesErr(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSavingNotes(false);
    }
  };

  const loadAppointments = useCallback(async () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const params = new URLSearchParams({ from: start.toISOString(), to: end.toISOString() });
    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    if (res.ok) {
      setAppointments(
        data.appointments
          .filter((a: any) => a.status === "scheduled")
          .map((a: any) => ({
            id: a.id,
            patient_id: a.patient_id,
            patient_name: a.patient_name,
            type: a.type,
            duration_minutes: a.duration_minutes,
            scheduled_at: a.scheduled_at,
            daily_room_url: a.daily_room_url,
          }))
      );
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleJoin = async (appointmentId: string, patientName: string, patientId: string) => {
    setJoining(appointmentId);
    setActivePatient(patientName);
    setActivePatientId(patientId);
    setNotesMsg(null);
    setNotesErr(null);
    try {
      const res = await fetch("/api/video/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setJoining(null);
        return;
      }

      if (data.simulated || !data.url) {
        setSimulatedMode(true);
        setIsCalling(true);
        setJoining(null);
        return;
      }

      setSimulatedMode(false);
      setIsCalling(true);
      // Laisse le temps au conteneur vidéo de se monter avant d'y attacher l'iframe Daily.
      setTimeout(() => {
        if (!videoContainerRef.current) return;
        const callFrame = DailyIframe.createFrame(videoContainerRef.current, {
          iframeStyle: { width: "100%", height: "100%", border: "0" },
          showLeaveButton: true,
        });
        callFrame.join({ url: data.url });
        callFrame.on("left-meeting", () => {
          setIsCalling(false);
          callFrame.destroy();
          callFrameRef.current = null;
        });
        callFrameRef.current = callFrame;
      }, 50);
    } finally {
      setJoining(null);
    }
  };

  const handleLeave = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    setIsCalling(false);
  };

  useEffect(() => {
    return () => {
      callFrameRef.current?.destroy();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RDV aujourd&apos;hui</p>
            <p className="text-xl font-black text-slate-900">{appointments.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statut vidéo</p>
            <p className="text-sm font-black text-slate-900">Daily.co</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Durée moyenne</p>
            <p className="text-xl font-black text-slate-900">28 min</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded flex items-center justify-center">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Satisfaction</p>
            <p className="text-xl font-black text-slate-900">4.9/5</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Teleconsult Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Screen */}
          <div className="bg-slate-900 aspect-video rounded-sm flex items-center justify-center relative overflow-hidden border border-slate-800 shadow-lg group">
            {isCalling ? (
              simulatedMode ? (
                <div className="absolute inset-0 flex flex-col">
                  <div className="absolute top-4 left-4 flex items-center gap-2 z-10 bg-amber-500/90 px-3 py-1.5 rounded-full">
                    <AlertTriangle className="h-3.5 w-3.5 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Mode démo — Daily.co non configuré</span>
                  </div>
                  <div className="flex-1 bg-slate-800 relative">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <div className="h-24 w-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border-2 border-blue-500 animate-pulse">
                            <Users className="h-10 w-10 text-blue-400" />
                          </div>
                          <p className="text-white font-black text-lg uppercase tracking-widest">{activePatient}</p>
                          <div className="flex items-center gap-2 justify-center">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Connexion chiffrée de bout en bout</span>
                          </div>
                        </div>
                     </div>
                     <div className="absolute bottom-4 right-4 w-40 aspect-video bg-slate-700 border border-slate-600 rounded shadow-2xl flex items-center justify-center overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-br from-blue-900 to-slate-900 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-blue-300 uppercase">Vous</span>
                        </div>
                     </div>
                  </div>
                  <div className="h-20 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-6">
                     <button onClick={handleLeave} className="h-12 w-24 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/40 text-[10px] font-black uppercase tracking-widest">
                      Quitter
                     </button>
                  </div>
                </div>
              ) : (
                <div ref={videoContainerRef} className="absolute inset-0" />
              )
            ) : (
              <>
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Live Connect</span>
                </div>

                <div className="text-center space-y-4">
                  <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <Video className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">Aucune session active</h3>
                    <p className="text-xs text-slate-400 mt-1">Rejoignez un patient depuis la liste des rendez-vous du jour</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notes & Actions */}
          <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">Notes de Session</h4>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors min-h-[120px] resize-none"
              placeholder={
                activePatient
                  ? `Observations pour ${activePatient} — enregistrées dans son dossier.`
                  : "Rejoignez une consultation pour prendre des notes rattachées au dossier."
              }
            ></textarea>

            {notesErr && (
              <p className="flex items-start gap-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                {notesErr}
              </p>
            )}
            {notesMsg && (
              <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
                {notesMsg}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={enregistrerNotes}
                disabled={savingNotes || !notes.trim() || !activePatientId}
                title={!activePatientId ? "Rejoignez d'abord une consultation" : "Enregistrer dans le dossier du patient"}
                className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="h-3 w-3" /> {savingNotes ? "Enregistrement…" : "Sauvegarder"}
              </button>
              {/* Ce bouton n'ouvrait rien. Il conduit maintenant au module
                  Ordonnances, où l'ordonnance est réellement rédigée et
                  enregistrée — plutôt que de laisser croire qu'un clic suffit. */}
              <button
                onClick={() => onNavigate?.(17)}
                disabled={!onNavigate}
                className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors disabled:opacity-40"
              >
                <Pill className="h-3 w-3" /> Rédiger une ordonnance
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Appointments */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('avenir')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2",
                activeTab === 'avenir' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"
              )}
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2",
                activeTab === 'historique' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"
              )}
            >
              Historique
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {activeTab === 'avenir' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Rendez-vous du jour</p>
                {appointments.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-8">Aucun rendez-vous aujourd&apos;hui.</p>
                )}
                {appointments.map((apt) => (
                  <div key={apt.id} className="border border-slate-100 rounded p-3 hover:border-slate-300 transition-all bg-white group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded flex items-center justify-center text-xs font-black bg-blue-100 text-blue-700">
                          {apt.patient_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{apt.patient_name}</p>
                          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                            {apt.type || "Consultation"} • {apt.duration_minutes} min
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-blue-900 tracking-tighter">
                          {new Date(apt.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoin(apt.id, apt.patient_name, apt.patient_id)}
                      disabled={joining === apt.id}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      <PhoneCall className="h-3 w-3" /> {joining === apt.id ? "Connexion…" : "Rejoindre"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'historique' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-400 py-10">
                <Clock className="h-8 w-8 opacity-50" />
                <p className="text-xs font-medium">L&apos;historique des consultations apparaîtra ici.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
