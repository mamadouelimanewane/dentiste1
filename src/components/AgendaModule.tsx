"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon, Clock, Users, Plus, Search,
  ChevronLeft, ChevronRight, CheckCircle2, ListTodo,
  Building2, X, MessageCircle, Smartphone, Send,
  AlertTriangle, Bell, Check, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  type: string;
  date: string; // ISO
  hour: number;
  day: number; // index 0-6 in week
  color: string;
  notified: boolean;
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

const COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500",
  "bg-rose-500", "bg-cyan-500"
];

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

function formatIso(weekStart: Date, dayIdx: number, hour: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIdx);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function formatLabel(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  });
}

// ── Composant principal ───────────────────────────────────────────────────────

export function AgendaModule() {
  const { currentPatient } = usePatient();
  const [activeTab, setActiveTab] = useState<"Agenda" | "Attente" | "Staff">("Agenda");
  const [weekOffset, setWeekOffset] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modal création RDV
  const [showModal, setShowModal] = useState(false);
  const [prefilledDay, setPrefilledDay] = useState(0);
  const [prefilledHour, setPrefilledHour] = useState(9);

  // Résultat notification
  const [notifyResult, setNotifyResult] = useState<NotifyResult | null>(null);

  const weekStart = getWeekStart(weekOffset);

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

  const openModal = (dayIdx = 0, hour = 9) => {
    setPrefilledDay(dayIdx);
    setPrefilledHour(hour);
    setNotifyResult(null);
    setShowModal(true);
  };

  const handleAppointmentAdded = (appt: Appointment, notify: NotifyResult | null) => {
    setAppointments(prev => [...prev, appt]);
    setNotifyResult(notify);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex items-center justify-between shadow-sm">
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
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input type="text" placeholder="Rechercher un patient..." className="bg-transparent border-none text-[10px] font-bold uppercase outline-none w-40" />
          </div>
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
              {notifyResult.messageBody && (
                <pre className="mt-2 text-[10px] bg-white/60 p-2 rounded border border-current/10 whitespace-pre-wrap font-mono max-h-28 overflow-y-auto">
                  {notifyResult.messageBody}
                </pre>
              )}
            </div>
            <button onClick={() => setNotifyResult(null)} className="flex-shrink-0 p-1 hover:opacity-60 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cette semaine</p>
              <div className="flex items-end gap-1 justify-center text-blue-900">
                <span className="text-2xl font-black">{appointments.length}</span>
                <span className="text-[10px] font-bold mb-1">RDV</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notifiés</p>
              <div className="flex items-end gap-1 justify-center text-emerald-600">
                <span className="text-2xl font-black">{appointments.filter(a => a.notified).length}</span>
              </div>
            </div>
          </div>

          {/* Patient actif */}
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

          {/* Liste RDV */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-[#0F172A] text-white flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-blue-400" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">RDV à venir</h4>
            </div>
            <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
              {appointments.length === 0 && (
                <p className="p-4 text-[10px] text-slate-400 text-center uppercase tracking-widest">Aucun RDV</p>
              )}
              {appointments.map(appt => (
                <div key={appt.id} className="p-3 flex items-center gap-3">
                  <div className={cn("h-2 w-2 rounded-full flex-shrink-0", appt.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-900 truncate">{appt.patientName}</p>
                    <p className="text-[9px] text-slate-400">{appt.type} · {new Date(appt.date).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  {appt.notified && (
                    <span title="Notifié"><Bell className="h-3 w-3 text-emerald-500 flex-shrink-0" /></span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CALENDRIER PRINCIPAL */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-[680px]">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-sm shadow-sm px-2 py-1">
                <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-black text-slate-900 uppercase min-w-[110px] text-center">{monthLabel}</span>
                <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button onClick={() => setWeekOffset(0)} className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Aujourd&apos;hui</button>
            </div>

            <div className="flex gap-2 bg-white border border-slate-200 rounded-sm p-1 shadow-sm">
              {(["Agenda", "Attente", "Staff"] as const).map(tab => (
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

          {/* Grille calendrier */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* En-têtes des jours */}
            <div className="flex border-b border-slate-200 bg-white flex-shrink-0">
              <div className="w-16 flex-shrink-0 border-r border-slate-200" />
              {weekDays.map((day, idx) => (
                <div key={idx} className={cn("flex-1 py-3 text-center border-r border-slate-200 last:border-r-0 flex flex-col items-center gap-1", day.isToday ? "bg-blue-50/50" : "")}>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", day.isToday ? "text-blue-600" : "text-slate-400")}>{day.name}</span>
                  <span className={cn("text-lg font-black", day.isToday ? "text-blue-700" : "text-slate-800")}>{day.date}</span>
                  {day.isToday && <div className="h-1 w-1 rounded-full bg-blue-600 mt-0.5" />}
                </div>
              ))}
            </div>

            {/* Grille horaire */}
            <div className="flex-1 overflow-y-auto relative">
              {/* Lignes de fond */}
              <div className="absolute inset-0 flex flex-col pointer-events-none">
                {HOURS.map(h => <div key={h} className="h-20 border-b border-slate-100 w-full" />)}
              </div>

              <div className="absolute inset-0 flex">
                {/* Colonne heures */}
                <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white relative z-10">
                  {HOURS.map(h => (
                    <div key={h} className="h-20 border-b border-slate-100 flex items-start justify-center pt-2">
                      <span className="text-[10px] font-bold text-slate-400">{h}:00</span>
                    </div>
                  ))}
                </div>

                {/* Colonnes jours */}
                {weekDays.map((day, dayIdx) => (
                  <div key={dayIdx} className={cn("flex-1 border-r border-slate-100 last:border-r-0 relative group", day.isToday ? "bg-blue-50/20" : "")}>
                    {/* RDV existants */}
                    {appointments.filter(a => a.day === dayIdx).map(appt => (
                      <div
                        key={appt.id}
                        className={cn("absolute left-1 right-1 rounded text-white text-[9px] font-black px-1.5 py-1 z-10 overflow-hidden shadow-sm", appt.color)}
                        style={{ top: `${(appt.hour - 8) * 80 + 4}px`, height: "72px" }}
                      >
                        <p className="truncate">{appt.patientName}</p>
                        <p className="opacity-80 truncate">{appt.type}</p>
                        {appt.notified && <Bell className="h-2.5 w-2.5 mt-0.5 opacity-80" />}
                      </div>
                    ))}

                    {/* Zones cliquables pour créer un RDV */}
                    {HOURS.map(h => (
                      <button
                        key={h}
                        onClick={() => openModal(dayIdx, h)}
                        className="absolute w-full opacity-0 group-hover:opacity-100 hover:bg-blue-100/40 transition-all flex items-center justify-center z-20"
                        style={{ top: `${(h - 8) * 80}px`, height: "80px" }}
                        title={`Créer un RDV le ${day.label} à ${h}:00`}
                      >
                        <Plus className="h-5 w-5 text-blue-400" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Indicateur heure actuelle */}
              {weekOffset === 0 && (
                <>
                  <div className="absolute left-16 right-0 h-[2px] bg-red-400 z-30 shadow-[0_0_8px_rgba(248,113,113,0.8)]"
                    style={{ top: `${Math.max(0, (new Date().getHours() - 8) * 80 + (new Date().getMinutes() / 60) * 80)}px` }} />
                  <div className="absolute w-2 h-2 rounded-full bg-red-500 z-30"
                    style={{ top: `${Math.max(-4, (new Date().getHours() - 8) * 80 + (new Date().getMinutes() / 60) * 80 - 4)}px`, left: "56px" }} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL CRÉATION RDV ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <BookingModal
            weekDays={weekDays}
            initialDay={prefilledDay}
            initialHour={prefilledHour}
            currentPatient={currentPatient}
            onClose={() => setShowModal(false)}
            onConfirm={handleAppointmentAdded}
          />
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
  currentPatient: { name: string; phone: string; idNumber: string } | null;
  onClose: () => void;
  onConfirm: (appt: Appointment, notify: NotifyResult | null) => void;
}

function BookingModal({ weekDays, initialDay, initialHour, currentPatient, onClose, onConfirm }: BookingModalProps) {
  const [patientName, setPatientName] = useState(currentPatient?.name || "");
  const [phone, setPhone] = useState(currentPatient?.phone || "");
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedType, setSelectedType] = useState("Consultation");
  const [channel, setChannel] = useState<"both" | "whatsapp" | "sms" | "none">("both");
  const [sending, setSending] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const appointmentIso = (() => {
    const d = new Date(weekDays[selectedDay].fullDate);
    d.setHours(selectedHour, 0, 0, 0);
    return d.toISOString();
  })();

  const previewMessage =
    `🦷 Bonjour ${patientName || "…"},\n\n` +
    `Votre rendez-vous au Cabinet Dentaire du Cap Vert est confirmé :\n\n` +
    `📅 ${formatLabel(appointmentIso)}\n` +
    `🔧 ${selectedType}\n\n` +
    `Pour modifier ou annuler, répondez à ce message ou contactez-nous.\n` +
    `À bientôt !`;

  const handleConfirm = async () => {
    if (!patientName) return;
    setSending(true);

    let notifyResult: NotifyResult | null = null;

    // Envoyer la notification si un canal est choisi et qu'un numéro existe
    if (channel !== "none" && phone) {
      try {
        const res = await fetch("/api/appointments/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName,
            phone,
            appointmentDate: appointmentIso,
            appointmentType: selectedType,
            channel,
          }),
        });
        const data = await res.json();
        notifyResult = {
          simulated: data.simulated,
          channels: data.results?.map((r: { channel: string }) => r.channel) || [],
          messageBody: data.messageBody,
          error: data.error,
        };
      } catch {
        notifyResult = { simulated: false, channels: [], error: "Erreur réseau." };
      }
    }

    const newAppt: Appointment = {
      id: `appt_${Date.now()}`,
      patientName,
      phone,
      type: selectedType,
      date: appointmentIso,
      hour: selectedHour,
      day: selectedDay,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      notified: notifyResult !== null && (notifyResult.channels.length > 0),
    };

    setSending(false);
    onConfirm(newAppt, notifyResult);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-blue-200">Elite Planner Pro</p>
              <h3 className="text-base font-black">Nouveau Rendez-vous</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Patient */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                Nom du patient <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="Mamadou Diallo"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                Téléphone
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Jour */}
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Jour</label>
            <div className="flex gap-1.5 flex-wrap">
              {weekDays.map((d, idx) => (
                <button key={idx} onClick={() => setSelectedDay(idx)}
                  className={cn("px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all border",
                    selectedDay === idx
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : d.isToday
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                  )}>
                  {d.name} {d.date}
                </button>
              ))}
            </div>
          </div>

          {/* Heure + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                Heure
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={selectedHour}
                  onChange={e => setSelectedHour(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                >
                  {HOURS.map(h => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                Type de soin
              </label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
              >
                {APPOINTMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Notification */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Notification patient</p>
            </div>

            {!phone && (
              <p className="text-[10px] text-amber-600 font-bold">⚠️ Renseignez un numéro pour envoyer une notification.</p>
            )}

            <div className="flex gap-2 flex-wrap">
              {[
                { val: "both", icon: null, label: "WhatsApp + SMS", cls: "bg-slate-900 text-white border-slate-900" },
                { val: "whatsapp", icon: MessageCircle, label: "WhatsApp", cls: "bg-green-600 text-white border-green-600" },
                { val: "sms", icon: Smartphone, label: "SMS seulement", cls: "bg-blue-600 text-white border-blue-600" },
                { val: "none", icon: null, label: "Aucune", cls: "bg-slate-100 text-slate-500 border-slate-200" },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setChannel(opt.val as typeof channel)}
                  disabled={!phone && opt.val !== "none"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-40",
                    channel === opt.val ? opt.cls : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  )}
                >
                  {channel === opt.val && opt.val !== "none" && <Check className="h-3 w-3" />}
                  {opt.icon && <opt.icon className="h-3.5 w-3.5" />}
                  {opt.label}
                </button>
              ))}
            </div>

            {channel !== "none" && phone && (
              <button
                onClick={() => setPreviewVisible(v => !v)}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                {previewVisible ? "Masquer" : "Aperçu"} du message →
              </button>
            )}

            <AnimatePresence>
              {previewVisible && channel !== "none" && (
                <motion.pre
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="text-[10px] font-mono bg-white border border-slate-200 rounded p-3 whitespace-pre-wrap text-slate-600 overflow-hidden"
                >
                  {previewMessage}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            {weekDays[selectedDay].label} {weekDays[selectedDay].date} · {selectedHour}:00 · {selectedType}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 rounded transition-colors">
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={!patientName || sending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded transition-all shadow-md shadow-blue-900/20 disabled:opacity-50"
            >
              {sending ? (
                <><span className="animate-spin">⏳</span> Envoi…</>
              ) : (
                <><Send className="h-3.5 w-3.5" /> Confirmer &amp; Notifier</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
