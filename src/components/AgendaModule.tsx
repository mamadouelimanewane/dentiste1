"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar as CalendarIcon, Clock, Users, Plus, Search,
  ChevronLeft, ChevronRight, CheckCircle2, ListTodo,
  X, MessageCircle, Smartphone, Send,
  AlertTriangle, Bell, Check, User, LogIn, XCircle, UserX, CalendarClock,
  Maximize2, Minimize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";
import { createGoogleCalendarUrl, downloadIcsFile } from "@/lib/google-calendar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string | null;
  practitioner_id: string | null;
  practitioner_name: string | null;
  scheduled_at: string;
  duration_minutes: number;
  type: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  checked_in_at: string | null;
}

interface Practitioner {
  id: string;
  full_name: string;
}

interface PatientHit {
  id: string;
  full_name: string;
  phone: string | null;
  dossier_number: string;
}

interface NotifyResult {
  simulated: boolean;
  channels: string[];
  messageBody?: string;
  error?: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = [
  "Consultation", "Détartrage", "Extraction", "Dévitalisation",
  "Pose couronne", "Blanchiment", "Contrôle", "Orthodontie",
  "Radiographie", "Prothèse", "Implant", "Urgence"
];

const PRACTITIONER_COLORS = [
  { solid: "bg-blue-500", light: "bg-blue-500/15", border: "border-blue-500/30", borderLeft: "border-l-blue-500", text: "text-blue-900", textLight: "text-blue-700" },
  { solid: "bg-emerald-500", light: "bg-emerald-500/15", border: "border-emerald-500/30", borderLeft: "border-l-emerald-500", text: "text-emerald-900", textLight: "text-emerald-700" },
  { solid: "bg-violet-500", light: "bg-violet-500/15", border: "border-violet-500/30", borderLeft: "border-l-violet-500", text: "text-violet-900", textLight: "text-violet-700" },
  { solid: "bg-orange-500", light: "bg-orange-500/15", border: "border-orange-500/30", borderLeft: "border-l-orange-500", text: "text-orange-900", textLight: "text-orange-700" },
  { solid: "bg-rose-500", light: "bg-rose-500/15", border: "border-rose-500/30", borderLeft: "border-l-rose-500", text: "text-rose-900", textLight: "text-rose-700" },
  { solid: "bg-cyan-500", light: "bg-cyan-500/15", border: "border-cyan-500/30", borderLeft: "border-l-cyan-500", text: "text-cyan-900", textLight: "text-cyan-700" },
  { solid: "bg-amber-500", light: "bg-amber-500/15", border: "border-amber-500/30", borderLeft: "border-l-amber-500", text: "text-amber-900", textLight: "text-amber-700" },
  { solid: "bg-indigo-500", light: "bg-indigo-500/15", border: "border-indigo-500/30", borderLeft: "border-l-indigo-500", text: "text-indigo-900", textLight: "text-indigo-700" },
];

const DEFAULT_COLOR = { solid: "bg-slate-400", light: "bg-slate-400/15", border: "border-slate-400/30", borderLeft: "border-l-slate-400", text: "text-slate-800", textLight: "text-slate-600" };

const WEEK_DAYS = [
  { name: "lun", label: "Lundi" },
  { name: "mar", label: "Mardi" },
  { name: "mer", label: "Mercredi" },
  { name: "jeu", label: "Jeudi" },
  { name: "ven", label: "Vendredi" },
  { name: "sam", label: "Samedi" },
  { name: "dim", label: "Dimanche" },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h → 19h

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekStart(offset = 0): Date {
  const now = new Date();
  const day = now.getDay(); // 0=sun
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) + offset * 7;
  const d = new Date(now);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatLabel(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });
}

function practitionerColor(id: string | null, practitioners: Practitioner[]) {
  if (!id) return DEFAULT_COLOR;
  const idx = practitioners.findIndex(p => p.id === id);
  if (idx === -1) return DEFAULT_COLOR;
  return PRACTITIONER_COLORS[idx % PRACTITIONER_COLORS.length];
}

// ── Composant principal ───────────────────────────────────────────────────────

export function AgendaModule() {
  const { currentPatient, setCurrentPatient } = usePatient();
  const [activeTab, setActiveTab] = useState<"Agenda" | "Attente">("Agenda");
  const [agendaView, setAgendaView] = useState<"team" | "week">("team");
  const [weekOffset, setWeekOffset] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Modal création RDV
  const [showModal, setShowModal] = useState(false);
  const [prefilledDay, setPrefilledDay] = useState(0);
  const [prefilledHour, setPrefilledHour] = useState(9);

  // Résultat notification / erreurs
  const [notifyResult, setNotifyResult] = useState<NotifyResult | null>(null);
  const [conflictSkipped, setConflictSkipped] = useState<{ scheduledAt: string; conflictWith?: string }[]>([]);

  // Action sur un RDV existant
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [quickMessage, setQuickMessage] = useState("");
  const [quickMessageChannel, setQuickMessageChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [sendingQuickMessage, setSendingQuickMessage] = useState(false);
  const [quickMessageSent, setQuickMessageSent] = useState(false);

  const activeDate = new Date();
  activeDate.setDate(activeDate.getDate() + dayOffset);
  activeDate.setHours(0, 0, 0, 0);

  const weekStart = agendaView === "week"
    ? getWeekStart(weekOffset)
    : (() => {
        const d = new Date(activeDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        return d;
      })();

  const weekDays = WEEK_DAYS.map((d, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    return { ...d, date: date.getDate(), fullDate: date, isToday };
  });

  const monthLabel = weekStart.toLocaleString("fr-FR", { month: "long", year: "numeric" });
  const teamDayLabel = activeDate.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const from = agendaView === "week" ? new Date(weekStart) : new Date(activeDate);
    const to = agendaView === "week" ? new Date(weekStart) : new Date(activeDate);
    if (agendaView === "week") to.setDate(to.getDate() + 7);
    else to.setDate(to.getDate() + 1);
    try {
      const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
      if (selectedPractitioner !== "all") params.set("practitionerId", selectedPractitioner);
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      if (res.ok) setAppointments(data.appointments);
    } finally {
      setLoading(false);
    }
  }, [agendaView, weekStart, activeDate.getTime(), selectedPractitioner]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch("/api/practitioners")
      .then(res => res.json())
      .then(data => setPractitioners(data.practitioners || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    setQuickMessage("");
    setQuickMessageSent(false);
  }, [activeAppt?.id]);

  const openModal = (dayIdx = 0, hour = 9) => {
    setPrefilledDay(dayIdx);
    setPrefilledHour(hour);
    setNotifyResult(null);
    setConflictSkipped([]);
    setShowModal(true);
  };

  const handleAppointmentAdded = (notify: NotifyResult | null, skipped: typeof conflictSkipped) => {
    setNotifyResult(notify);
    setConflictSkipped(skipped);
    setShowModal(false);
    loadAppointments();
  };

  const runAction = async (appt: Appointment, action: "check-in" | "complete" | "cancel" | "no-show") => {
    await fetch(`/api/appointments/${appt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActiveAppt(null);
    loadAppointments();
  };

  const sendQuickMessage = async () => {
    if (!activeAppt || !quickMessage.trim() || !activeAppt.patient_phone) return;
    setSendingQuickMessage(true);
    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: activeAppt.patient_id,
          phone: activeAppt.patient_phone,
          message: quickMessage,
          channel: quickMessageChannel,
        }),
      });
      setQuickMessage("");
      setQuickMessageSent(true);
      setTimeout(() => setQuickMessageSent(false), 2500);
    } finally {
      setSendingQuickMessage(false);
    }
  };

  const submitReschedule = async () => {
    if (!activeAppt || !rescheduleDate) return;
    const res = await fetch(`/api/appointments/${activeAppt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reschedule", scheduledAt: new Date(rescheduleDate).toISOString() }),
    });
    if (res.ok) {
      setActiveAppt(null);
      setRescheduleDate("");
      loadAppointments();
    }
  };

  const todaysAppointments = appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    const now = new Date();
    return d.toDateString() === now.toDateString() && a.status === "scheduled";
  }).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  return (
    <div className={cn(
      "animate-in fade-in duration-500",
      isFullscreen ? "fixed inset-0 z-[100] bg-[#F1F5F9] p-4 sm:p-6 overflow-y-auto flex flex-col space-y-6" : "space-y-6"
    )}>
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Elite Planner Pro</h2>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3 w-3 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Agenda Cabinet</p>
            </div>
          </div>
        </div>

        {/* Filtre praticien */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedPractitioner("all")}
            className={cn(
              "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all",
              selectedPractitioner === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
            )}
          >
            Tous
          </button>
          {practitioners.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setSelectedPractitioner(p.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all",
                selectedPractitioner === p.id
                  ? cn(PRACTITIONER_COLORS[idx % PRACTITIONER_COLORS.length], "text-white border-transparent")
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", selectedPractitioner === p.id ? "bg-white/70" : PRACTITIONER_COLORS[idx % PRACTITIONER_COLORS.length])} />
              {p.full_name}
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest rounded-full shadow-lg transition-all hover:scale-105",
              isFullscreen 
                ? "bg-slate-800 text-white shadow-slate-900/30 hover:bg-slate-900" 
                : "bg-emerald-600 text-white shadow-emerald-500/30 hover:bg-emerald-700 hover:shadow-emerald-500/50"
            )}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span>{isFullscreen ? "Réduire" : "Plein écran"}</span>
          </button>
        </div>
      </div>

      {/* Bannière résultat notification */}
      <AnimatePresence>
        {notifyResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "flex items-start gap-3 p-4 rounded-sm border text-sm font-medium",
              notifyResult.simulated
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            )}
          >
            {notifyResult.simulated
              ? <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              : <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[11px] uppercase tracking-widest mb-1">
                {notifyResult.simulated
                  ? "RDV créé — Notification simulée (mode démo)"
                  : "RDV créé — Notification envoyée ✓"}
              </p>
              {notifyResult.channels?.length > 0 && (
                <div className="flex gap-2 mt-1">
                  {notifyResult.channels.includes("whatsapp") && (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </span>
                  )}
                  {notifyResult.channels.includes("sms") && (
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      <Smartphone className="h-3 w-3" /> SMS
                    </span>
                  )}
                </div>
              )}
              {conflictSkipped.length > 0 && (
                <p className="mt-2 text-[10px] font-bold">
                  ⚠️ {conflictSkipped.length} occurrence(s) récurrente(s) ignorée(s) pour conflit de créneau.
                </p>
              )}
            </div>
            <button onClick={() => setNotifyResult(null)} className="flex-shrink-0 p-1 hover:opacity-60 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-6", isFullscreen && "flex-1")}>
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cette semaine</p>
              <div className="flex items-end gap-1 justify-center text-blue-900">
                <span className="text-2xl font-black">{appointments.length}</span>
                <span className="text-[10px] font-bold mb-1">RDV</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aujourd&apos;hui</p>
              <div className="flex items-end gap-1 justify-center text-emerald-600">
                <span className="text-2xl font-black">{todaysAppointments.length}</span>
              </div>
            </div>
          </div>

          {currentPatient && (
            <div className="bg-blue-50 border border-blue-100 rounded-sm p-4">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-2">Patient actif</p>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-xs">
                  {currentPatient.name[0]}
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900">{currentPatient.name}</p>
                  <p className="text-[9px] text-blue-500">{currentPatient.phone || "—"}</p>
                </div>
              </div>
              <button
                onClick={() => openModal(0, 9)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Créer un RDV
              </button>
            </div>
          )}

          {/* Export / Synchronisation Google Calendar */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Sync Google Calendar</p>
            </div>
            <a
              href="/api/calendar/ics"
              target="_blank"
              download="agenda-cabinet.ics"
              className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded transition-all"
            >
              Exporter Flux iCal (.ics)
            </a>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-[#0F172A] text-white flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-blue-400" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">RDV de la semaine</h4>
            </div>
            <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
              {!loading && appointments.length === 0 && (
                <p className="p-4 text-[10px] text-slate-400 text-center uppercase tracking-widest">Aucun RDV</p>
              )}
              {appointments.map(appt => {
                const colors = practitionerColor(appt.practitioner_id, practitioners);
                return (
                  <button
                    key={appt.id}
                    onClick={() => setActiveAppt(appt)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={cn("h-2 w-2 rounded-full flex-shrink-0", colors.solid)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-900 truncate">{appt.patient_name}</p>
                      <p className="text-[9px] text-slate-400">{appt.type} · {new Date(appt.scheduled_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    {appt.status !== "scheduled" && (
                      <span className="text-[8px] font-black uppercase text-slate-400">{appt.status}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ZONE PRINCIPALE */}
        <div className={cn(
          "lg:col-span-3 bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col",
          isFullscreen ? "h-[calc(100vh-140px)]" : "h-[680px]"
        )}>
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-sm shadow-sm px-2 py-1">
                <button onClick={() => agendaView === "week" ? setWeekOffset(w => w - 1) : setDayOffset(d => d - 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-black text-slate-900 uppercase min-w-[150px] text-center">
                  {agendaView === "week" ? monthLabel : teamDayLabel}
                </span>
                <button onClick={() => agendaView === "week" ? setWeekOffset(w => w + 1) : setDayOffset(d => d + 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button onClick={() => { setWeekOffset(0); setDayOffset(0); }} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Aujourd&apos;hui</button>

              <div className="flex gap-1 bg-slate-200/50 p-1 rounded border border-slate-200 ml-2">
                <button onClick={() => setAgendaView("team")} className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-colors", agendaView === "team" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Équipe</button>
                <button onClick={() => setAgendaView("week")} className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded transition-colors", agendaView === "week" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Semaine</button>
              </div>
            </div>

            <div className="flex gap-2 bg-white border border-slate-200 rounded-sm p-1 shadow-sm">
              {(["Agenda", "Attente"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all",
                    activeTab === tab ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => openModal(0, 9)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-sm text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-blue-900/20"
            >
              <Plus className="h-4 w-4" /> Réserver
            </button>
          </div>

          {activeTab === "Agenda" ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b border-slate-200 bg-white/95 backdrop-blur-md flex-shrink-0 sticky top-0 z-20 shadow-sm">
                <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white/50" />
                {agendaView === "week" ? weekDays.map((day, idx) => (
                  <div key={idx} className={cn("flex-1 py-3 text-center border-r border-slate-200 last:border-r-0 flex flex-col items-center gap-1 min-w-[120px]", day.isToday ? "bg-blue-50/50" : "")}>
                    <span className={cn("text-xs font-black uppercase tracking-widest", day.isToday ? "text-blue-600" : "text-slate-400")}>{day.name}</span>
                    <span className={cn("text-xl font-black", day.isToday ? "text-blue-700" : "text-slate-800")}>{day.date}</span>
                    {day.isToday && <div className="h-1 w-1 rounded-full bg-blue-600 mt-0.5" />}
                  </div>
                )) : [...practitioners, { id: null, full_name: "Non assigné / Urgences" }].map((p, idx) => (
                  <div key={idx} className="flex-1 py-3 text-center border-r border-slate-200 last:border-r-0 flex flex-col items-center gap-1 bg-slate-50/30 min-w-[150px]">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 px-2 line-clamp-1">{p.full_name}</span>
                    <div className={cn("h-1 w-8 rounded-full mt-1", practitionerColor(p.id, practitioners))} />
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-auto relative">
                <div className="absolute inset-0 flex flex-col pointer-events-none min-w-max">
                  {HOURS.map(h => <div key={h} className="h-20 border-b border-slate-100 w-full" />)}
                </div>

                <div className="absolute inset-0 flex min-w-max">
                  <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white relative z-10">
                    {HOURS.map(h => (
                      <div key={h} className="h-20 border-b border-slate-100 flex items-start justify-center pt-2">
                        <span className="text-xs font-bold text-slate-400">{h}:00</span>
                      </div>
                    ))}
                  </div>

                  {/* Current Time Line */}
                  <div className="absolute left-16 right-0 z-20 pointer-events-none" style={{
                    top: `${Math.max(0, (new Date().getHours() + new Date().getMinutes()/60 - 8)) * 80}px`,
                    display: new Date().getHours() >= 8 && new Date().getHours() < 20 ? 'block' : 'none'
                  }}>
                    <div className="flex items-center -ml-14">
                      <div className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm relative z-30">
                        {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="h-0.5 w-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] relative z-20">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    </div>
                  </div>

                  {agendaView === "week" ? weekDays.map((day, dayIdx) => (
                    <div key={dayIdx} className={cn("flex-1 border-r border-slate-100 last:border-r-0 relative group min-w-[120px]", day.isToday ? "bg-blue-50/20" : "")}>
                      {appointments.filter(a => new Date(a.scheduled_at).toDateString() === day.fullDate.toDateString()).map(appt => {
                        const apptDate = new Date(appt.scheduled_at);
                        const hourFloat = apptDate.getHours() + apptDate.getMinutes() / 60;
                        if (hourFloat < 8 || hourFloat > 20) return null;
                        const colors = practitionerColor(appt.practitioner_id, practitioners);
                        return (
                          <motion.button
                            layoutId={`appt-${appt.id}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={appt.id}
                            onClick={() => setActiveAppt(appt)}
                            className={cn(
                              "absolute left-1 right-1 rounded-lg text-xs font-black px-2 py-1.5 z-10 overflow-hidden shadow-sm text-left transition-all hover:scale-[1.02] hover:shadow-md border border-l-4 backdrop-blur-sm group",
                              colors.light, colors.border, colors.borderLeft, colors.text,
                              appt.status !== "scheduled" && "opacity-60 grayscale"
                            )}
                            style={{ top: `${(hourFloat - 8) * 80 + 4}px`, height: "72px" }}
                          >
                            <p className="truncate tracking-tight leading-tight">{appt.patient_name}</p>
                            <p className={cn("truncate text-[10px] leading-tight font-bold mt-0.5", colors.textLight)}>{appt.type}</p>
                            <div className="flex items-center gap-1 mt-1 opacity-80">
                              {appt.checked_in_at && <LogIn className="h-3 w-3" />}
                              {appt.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                              {appt.status === "cancelled" && <XCircle className="h-3 w-3" />}
                              {appt.status === "no_show" && <UserX className="h-3 w-3" />}
                            </div>
                          </motion.button>
                        );
                      })}

                      {HOURS.map(h => (
                        <button
                          key={h}
                          onClick={() => openModal(dayIdx, h)}
                          className="absolute w-full opacity-0 hover:opacity-100 transition-all flex items-center justify-center z-0 p-1"
                          style={{ top: `${(h - 8) * 80}px`, height: "80px" }}
                          title={`Créer un RDV le ${day.label} à ${h}:00`}
                        >
                          <div className="w-full h-full border-2 border-dashed border-blue-400/50 bg-blue-50/50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs uppercase tracking-widest backdrop-blur-sm">
                            <Plus className="h-4 w-4 mr-1" /> Ajouter
                          </div>
                        </button>
                      ))}
                    </div>
                  )) : [...practitioners, { id: null, full_name: "Non assigné" }].map((p, colIdx) => (
                    <div key={colIdx} className="flex-1 border-r border-slate-100 last:border-r-0 relative group min-w-[150px]">
                      {appointments.filter(a => new Date(a.scheduled_at).toDateString() === activeDate.toDateString() && a.practitioner_id === p.id).map(appt => {
                        const apptDate = new Date(appt.scheduled_at);
                        const hourFloat = apptDate.getHours() + apptDate.getMinutes() / 60;
                        if (hourFloat < 8 || hourFloat > 20) return null;
                        const colors = practitionerColor(appt.practitioner_id, practitioners);
                        return (
                          <motion.button
                            layoutId={`appt-team-${appt.id}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={appt.id}
                            onClick={() => setActiveAppt(appt)}
                            className={cn(
                              "absolute left-1 right-1 rounded-lg text-xs font-black px-2 py-1.5 z-10 overflow-hidden shadow-sm text-left transition-all hover:scale-[1.02] hover:shadow-md border border-l-4 backdrop-blur-sm group",
                              colors.light, colors.border, colors.borderLeft, colors.text,
                              appt.status !== "scheduled" && "opacity-60 grayscale"
                            )}
                            style={{ top: `${(hourFloat - 8) * 80 + 4}px`, height: "72px" }}
                          >
                            <p className="truncate tracking-tight leading-tight">{appt.patient_name}</p>
                            <p className={cn("truncate text-[10px] leading-tight font-bold mt-0.5", colors.textLight)}>{appt.type}</p>
                            <div className="flex items-center gap-1 mt-1 opacity-80">
                              {appt.checked_in_at && <LogIn className="h-3 w-3" />}
                              {appt.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                              {appt.status === "cancelled" && <XCircle className="h-3 w-3" />}
                              {appt.status === "no_show" && <UserX className="h-3 w-3" />}
                            </div>
                          </motion.button>
                        );
                      })}

                      {HOURS.map(h => {
                        const activeDayIdx = weekDays.findIndex(d => d.fullDate.toDateString() === activeDate.toDateString());
                        return (
                          <button
                            key={h}
                            onClick={() => openModal(activeDayIdx >= 0 ? activeDayIdx : 0, h)}
                            className="absolute w-full opacity-0 hover:opacity-100 transition-all flex items-center justify-center z-0 p-1"
                            style={{ top: `${(h - 8) * 80}px`, height: "80px" }}
                          >
                            <div className="w-full h-full border-2 border-dashed border-blue-400/50 bg-blue-50/50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs uppercase tracking-widest backdrop-blur-sm">
                              <Plus className="h-4 w-4 mr-1" /> Ajouter
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {weekOffset === 0 && (
                  <>
                    <div className="absolute left-16 right-0 h-[2px] bg-red-500 z-30 shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse"
                      style={{ top: `${Math.max(0, (new Date().getHours() - 8) * 80 + (new Date().getMinutes() / 60) * 80)}px` }} />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-red-600 z-30 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse border border-white"
                      style={{ top: `${Math.max(-4, (new Date().getHours() - 8) * 80 + (new Date().getMinutes() / 60) * 80 - 4)}px`, left: "55px" }} />
                  </>
                )}
              </div>
            </div>
          ) : (
            /* SALLE D'ATTENTE */
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {todaysAppointments.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-40 py-20">
                  <Users className="h-10 w-10" />
                  <p className="text-xs font-bold uppercase tracking-widest">Aucun rendez-vous aujourd&apos;hui</p>
                </div>
              )}
              {todaysAppointments.map(appt => (
                <div key={appt.id} className="group relative flex items-center gap-4 p-5 border border-slate-200/60 rounded-2xl bg-white/60 backdrop-blur-md shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className={cn("h-12 w-12 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-inner", practitionerColor(appt.practitioner_id, practitioners).solid)}>
                    {appt.patient_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900">{appt.patient_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">
                      {new Date(appt.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {appt.type} · {appt.practitioner_name || "Non assigné"}
                    </p>
                  </div>
                  {appt.checked_in_at ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                        <LogIn className="h-3.5 w-3.5" /> Arrivé {new Date(appt.checked_in_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={() => {
                          const patientInfo = {
                            id: appt.patient_id,
                            name: appt.patient_name,
                            phone: appt.patient_phone || "",
                            idNumber: "—",
                            birthDate: "",
                            address: ""
                          };
                          // @ts-ignore
                          currentPatient?.id !== appt.patient_id && setCurrentPatient?.(patientInfo);
                        }}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all shadow-sm"
                      >
                        Prendre en charge
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => runAction(appt, "check-in")}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all"
                    >
                      <LogIn className="h-3.5 w-3.5" /> Enregistrer l&apos;arrivée
                    </button>
                  )}
                  <button
                    onClick={() => runAction(appt, "complete")}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    title="Marquer terminé"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => runAction(appt, "no-show")}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="Absent"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL CRÉATION RDV */}
      <AnimatePresence>
        {showModal && (
          <BookingModal
            weekDays={weekDays}
            initialDay={prefilledDay}
            initialHour={prefilledHour}
            currentPatient={currentPatient}
            practitioners={practitioners}
            onClose={() => setShowModal(false)}
            onConfirm={handleAppointmentAdded}
          />
        )}
      </AnimatePresence>

      {/* PANNEAU ACTIONS SUR UN RDV */}
      <AnimatePresence>
        {activeAppt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 pb-24"
            onClick={() => setActiveAppt(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-500 p-5 text-white">
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200">Rendez-vous</p>
                <h3 className="text-base font-black">{activeAppt.patient_name}</h3>
                <p className="text-xs text-blue-100 mt-1">{formatLabel(activeAppt.scheduled_at)}</p>
                <p className="text-[10px] text-blue-200 mt-0.5">{activeAppt.type} · {activeAppt.practitioner_name || "Non assigné"}</p>
              </div>
              <div className="p-5 space-y-2">
                {/* Message rapide */}
                {activeAppt.patient_phone ? (
                  <div className="pb-3 mb-1 border-b border-slate-100 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={quickMessage}
                        onChange={e => setQuickMessage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendQuickMessage()}
                        placeholder="Message rapide au patient..."
                        className="flex-1 border border-slate-200 rounded px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setQuickMessageChannel(c => c === "whatsapp" ? "sms" : "whatsapp")}
                        title={quickMessageChannel === "whatsapp" ? "WhatsApp (cliquer pour SMS)" : "SMS (cliquer pour WhatsApp)"}
                        className={cn(
                          "h-8 w-8 flex-shrink-0 rounded flex items-center justify-center transition-colors",
                          quickMessageChannel === "whatsapp" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {quickMessageChannel === "whatsapp" ? <MessageCircle className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={sendQuickMessage}
                        disabled={!quickMessage.trim() || sendingQuickMessage}
                        className="h-8 w-8 flex-shrink-0 rounded bg-slate-900 hover:bg-black text-white flex items-center justify-center transition-colors disabled:opacity-40"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {quickMessageSent && (
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">✓ Message envoyé</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 font-bold uppercase pb-3 mb-1 border-b border-slate-100">
                    Pas de numéro enregistré pour ce patient.
                  </p>
                )}

                {activeAppt.status === "scheduled" && (
                  <>
                    {!activeAppt.checked_in_at && (
                      <button onClick={() => runAction(activeAppt, "check-in")} className="w-full flex items-center gap-2 px-4 py-2.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest transition-colors">
                        <LogIn className="h-4 w-4" /> Enregistrer l&apos;arrivée
                      </button>
                    )}
                    <button onClick={() => runAction(activeAppt, "complete")} className="w-full flex items-center gap-2 px-4 py-2.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest transition-colors">
                      <CheckCircle2 className="h-4 w-4" /> Marquer terminé
                    </button>
                    <button onClick={() => runAction(activeAppt, "no-show")} className="w-full flex items-center gap-2 px-4 py-2.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest transition-colors">
                      <UserX className="h-4 w-4" /> Patient absent
                    </button>
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-slate-400" />
                        <input
                          type="datetime-local"
                          value={rescheduleDate}
                          onChange={e => setRescheduleDate(e.target.value)}
                          className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs"
                        />
                      </div>
                      <button
                        onClick={submitReschedule}
                        disabled={!rescheduleDate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-700 text-xs font-bold uppercase tracking-widest transition-colors"
                      >
                        Replanifier
                      </button>
                    </div>

                    {/* Google Calendar Integrations */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <a
                        href={createGoogleCalendarUrl({
                          title: `RDV Dentaire - ${activeAppt.patient_name}`,
                          startTime: activeAppt.scheduled_at,
                          durationMinutes: activeAppt.duration_minutes || 30,
                          patientName: activeAppt.patient_name,
                          practitionerName: activeAppt.practitioner_name || undefined,
                          description: `Soin: ${activeAppt.type || 'Consultation'}`
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
                      >
                        <CalendarIcon className="h-4 w-4" /> Ajouter à Google Calendar
                      </a>
                      <button
                        onClick={() => downloadIcsFile({
                          title: `RDV Dentaire - ${activeAppt.patient_name}`,
                          startTime: activeAppt.scheduled_at,
                          durationMinutes: activeAppt.duration_minutes || 30,
                          patientName: activeAppt.patient_name,
                          practitionerName: activeAppt.practitioner_name || undefined,
                          description: `Soin: ${activeAppt.type || 'Consultation'}`
                        })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        Télécharger Fichier .ICS
                      </button>
                    </div>

                    <button onClick={() => runAction(activeAppt, "cancel")} className="w-full flex items-center gap-2 px-4 py-2.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-widest transition-colors">
                      <XCircle className="h-4 w-4" /> Annuler le rendez-vous
                    </button>
                  </>
                )}
                {activeAppt.status !== "scheduled" && (
                  <p className="text-center text-xs font-bold text-slate-400 uppercase py-4">
                    Statut : {activeAppt.status}
                  </p>
                )}
                <button onClick={() => setActiveAppt(null)} className="w-full text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sous-composant : Modal création RDV ───────────────────────────────────────

interface BookingModalProps {
  weekDays: Array<{ name: string; label: string; date: number; fullDate: Date; isToday: boolean }>;
  initialDay: number;
  initialHour: number;
  currentPatient: { id: string; name: string; phone: string; idNumber: string } | null;
  practitioners: Practitioner[];
  onClose: () => void;
  onConfirm: (notify: NotifyResult | null, skipped: { scheduledAt: string; conflictWith?: string }[]) => void;
}

function BookingModal({ weekDays, initialDay, initialHour, currentPatient, practitioners, onClose, onConfirm }: BookingModalProps) {
  const [selectedPatients, setSelectedPatients] = useState<PatientHit[]>(
    currentPatient ? [{ id: currentPatient.id, full_name: currentPatient.name, phone: currentPatient.phone, dossier_number: currentPatient.idNumber }] : []
  );
  const [patientQuery, setPatientQuery] = useState(currentPatient?.name || "");
  const [patientResults, setPatientResults] = useState<PatientHit[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [practitionerId, setPractitionerId] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedType, setSelectedType] = useState("Consultation");
  const [duration, setDuration] = useState(30);
  const [recurrence, setRecurrence] = useState<"none" | "weekly" | "biweekly" | "monthly">("none");
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [multiMode, setMultiMode] = useState<"sequential" | "concurrent">("sequential");
  const [channel, setChannel] = useState<"both" | "whatsapp" | "sms" | "none">("both");
  const [sending, setSending] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const appointmentIso = (() => {
    const d = new Date(weekDays[selectedDay].fullDate);
    d.setHours(selectedHour, 0, 0, 0);
    return d.toISOString();
  })();

  const previewMessage =
    `🦷 Bonjour ${selectedPatients.length > 0 ? selectedPatients[0].full_name : "…"},\n\n` +
    `Votre rendez-vous au Cabinet Dentaire du Cap Vert est confirmé :\n\n` +
    `📅 ${formatLabel(appointmentIso)}\n` +
    `🔧 ${selectedType}\n\n` +
    `Pour modifier ou annuler, répondez à ce message ou contactez-nous.\n` +
    `À bientôt !`;

  const handlePatientQueryChange = (value: string) => {
    setPatientQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.trim().length < 2) {
      setPatientResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (res.ok) {
        setPatientResults(data.patients);
        setShowResults(true);
      }
    }, 250);
  };

  const pickPatient = (p: PatientHit) => {
    if (!selectedPatients.find(x => x.id === p.id)) {
      setSelectedPatients([...selectedPatients, p]);
    }
    setPatientQuery("");
    setShowResults(false);
  };

  const removePatient = (id: string) => {
    setSelectedPatients(selectedPatients.filter(x => x.id !== id));
  };

  const handleConfirm = async () => {
    if (selectedPatients.length === 0) return;
    setSending(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientIds: selectedPatients.map(p => p.id),
          practitionerId: practitionerId || undefined,
          scheduledAt: appointmentIso,
          durationMinutes: duration,
          type: selectedType,
          recurrence,
          recurrenceCount: recurrence === "none" ? 1 : recurrenceCount,
          multiMode: selectedPatients.length > 1 ? multiMode : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Échec de la création du rendez-vous.");
        setSending(false);
        return;
      }

      let notifyResult: NotifyResult | null = null;
      // On prend juste le premier patient pour simuler l'affichage de la notification dans l'UI
      const firstPatient = selectedPatients[0];
      const phone = firstPatient.phone;
      if (channel !== "none" && phone) {
        try {
          const notifyRes = await fetch("/api/appointments/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId: firstPatient.id,
              patientName: firstPatient.full_name,
              phone,
              appointmentDate: appointmentIso,
              appointmentType: selectedType,
              channel,
            }),
          });
          const notifyData = await notifyRes.json();
          notifyResult = {
            simulated: notifyData.simulated,
            channels: notifyData.results?.map((r: { channel: string }) => r.channel) || [],
            messageBody: notifyData.messageBody,
            error: notifyData.error,
          };
        } catch {
          notifyResult = { simulated: false, channels: [], error: "Erreur réseau." };
        }
      }

      setSending(false);
      onConfirm(notifyResult, data.skipped || []);
    } catch {
      setErrorMsg("Erreur réseau.");
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 pb-24"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[calc(100vh-4rem)] flex flex-col"
      >
        <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-500 p-6 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Elite Planner Pro</p>
              <h3 className="text-xl font-black">Nouveau Rendez-vous</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-white/20 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-lg p-4">{errorMsg}</div>
          )}

            {/* Recherche patient */}
          <div className="relative">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">
              Patient(s) <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedPatients.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm">
                  <span>{p.full_name}</span>
                  <button onClick={() => removePatient(p.id)} className="p-0.5 hover:bg-blue-200 rounded-full transition-colors ml-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                value={patientQuery}
                onChange={e => handlePatientQueryChange(e.target.value)}
                onFocus={() => patientResults.length > 0 && setShowResults(true)}
                placeholder="Rechercher pour ajouter un patient (nom, dossier, tél)..."
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
              />
            </div>
            {showResults && patientResults.length > 0 && (
              <div className="absolute z-10 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {patientResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => pickPatient(p)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <p className="text-sm font-bold text-slate-900">{p.full_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.dossier_number} · {p.phone || "—"}</p>
                  </button>
                ))}
              </div>
            )}
            
            {selectedPatients.length > 1 && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
                  Mode de réservation multiple
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMultiMode("sequential")}
                    className={cn(
                      "flex-1 px-3 py-2 text-xs font-bold uppercase rounded-md border transition-colors",
                      multiMode === "sequential" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    À la suite
                  </button>
                  <button
                    onClick={() => setMultiMode("concurrent")}
                    className={cn(
                      "flex-1 px-3 py-2 text-xs font-bold uppercase rounded-md border transition-colors",
                      multiMode === "concurrent" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    Même créneau
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed">
                  {multiMode === "sequential" 
                    ? "Les patients seront programmés l'un après l'autre (ex: 10h00, 10h30, 11h00)." 
                    : "Les patients seront programmés exactement à la même heure (ex: 10h00, 10h00, 10h00)."}
                </p>
              </div>
            )}
          </div>

          {/* Praticien */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Praticien</label>
            <select
              value={practitionerId}
              onChange={e => setPractitionerId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white shadow-sm"
            >
              <option value="">Non assigné</option>
              {practitioners.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          {/* Jour */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2.5">Jour</label>
            <div className="flex gap-2 flex-wrap">
              {weekDays.map((d, idx) => (
                <button key={idx} onClick={() => setSelectedDay(idx)}
                  className={cn("px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all border",
                    selectedDay === idx
                      ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                      : d.isToday
                      ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-white"
                  )}>
                  {d.name} {d.date}
                </button>
              ))}
            </div>
          </div>

          {/* Heure + Type + Durée */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Heure</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  value={selectedHour}
                  onChange={e => setSelectedHour(Number(e.target.value))}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white shadow-sm"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Type de soin</label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white shadow-sm"
              >
                {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Durée</label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white shadow-sm"
              >
                {[15, 30, 45, 60, 90].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
          </div>

          {/* Récurrence */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2.5">Récurrence</label>
            <div className="flex gap-2.5 flex-wrap items-center">
              {[
                { val: "none", label: "Unique" },
                { val: "weekly", label: "Hebdomadaire" },
                { val: "biweekly", label: "Toutes les 2 sem." },
                { val: "monthly", label: "Mensuelle" },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setRecurrence(opt.val as typeof recurrence)}
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest border transition-all",
                    recurrence === opt.val ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
              {recurrence !== "none" && (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">× </span>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    value={recurrenceCount}
                    onChange={e => setRecurrenceCount(Number(e.target.value))}
                    className="w-16 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-center shadow-sm"
                  />
                  <span className="text-xs font-bold text-slate-500 uppercase">occurrences</span>
                </div>
              )}
            </div>
          </div>

          {/* Notification */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Bell className="h-5 w-5 text-slate-500" />
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest">Notification patient</p>
            </div>

            {selectedPatients.length > 0 && !selectedPatients.some(p => p.phone) && (
              <p className="text-sm text-amber-700 font-bold bg-amber-100/50 p-3 rounded-lg border border-amber-200">⚠️ Aucun patient sélectionné n&apos;a de numéro enregistré — aucune notification ne pourra être envoyée.</p>
            )}

            <div className="flex gap-2.5 flex-wrap">
              {[
                { val: "both", icon: null, label: "WhatsApp + SMS", cls: "bg-slate-900 text-white border-slate-900 shadow-md" },
                { val: "whatsapp", icon: MessageCircle, label: "WhatsApp", cls: "bg-green-600 text-white border-green-600 shadow-md" },
                { val: "sms", icon: Smartphone, label: "SMS seulement", cls: "bg-blue-600 text-white border-blue-600 shadow-md" },
                { val: "none", icon: null, label: "Aucune", cls: "bg-white text-slate-500 border-slate-300" },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setChannel(opt.val as typeof channel)}
                  disabled={selectedPatients.length > 0 && !selectedPatients.some(p => p.phone) && opt.val !== "none"}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest border transition-all disabled:opacity-40",
                    channel === opt.val ? opt.cls : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700"
                  )}
                >
                  {channel === opt.val && opt.val !== "none" && <Check className="h-4 w-4" />}
                  {opt.icon && <opt.icon className="h-4 w-4" />}
                  {opt.label}
                </button>
              ))}
            </div>

            {channel !== "none" && selectedPatients.some(p => p.phone) && (
              <button
                onClick={() => setPreviewVisible(v => !v)}
                className="text-sm font-bold text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
              >
                {previewVisible ? "Masquer l'aperçu" : "Voir l'aperçu du message"} →
              </button>
            )}

            <AnimatePresence>
              {previewVisible && channel !== "none" && (
                <motion.pre
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="text-sm font-mono bg-white border border-slate-200 rounded-lg p-4 whitespace-pre-wrap text-slate-600 overflow-hidden shadow-inner mt-3"
                >
                  {previewMessage}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 rounded-b-xl">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            {weekDays[selectedDay].label} {weekDays[selectedDay].date} · <span className="text-slate-900">{selectedHour}:00</span> · {selectedType}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedPatients.length === 0 || sending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
            >
              {sending ? (
                <><span className="animate-spin">⏳</span> Envoi…</>
              ) : (
                <><Send className="h-4 w-4" /> Confirmer &amp; Notifier</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
