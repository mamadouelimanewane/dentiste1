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
import { usePatient, mapDbPatientToContext } from "@/lib/context";
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

// Plage affichée par défaut : une journée de cabinet ordinaire.
const HEURE_DEBUT_DEFAUT = 8;
const HEURE_FIN_DEFAUT = 19;

// Plage proposée à la réservation. Plus large que la grille par défaut :
// l'écran ne permettait de créer un rendez-vous qu'entre 8h et 19h, alors
// que l'API en accepte à toute heure (prise de RDV en ligne, report, série
// récurrente décalée). Le cabinet ne pouvait donc pas saisir une urgence de
// 7h alors qu'elle pouvait exister en base.
const HEURES_RESERVATION = Array.from({ length: 16 }, (_, i) => i + 6); // 6h → 21h

// Grille horaire réellement affichée : la plage par défaut, ÉLARGIE pour
// contenir tous les rendez-vous de la période.
//
// Sans cet élargissement, un rendez-vous hors de 8h–19h était purement et
// simplement absent de la grille — tout en restant compté dans « RDV
// aujourd'hui » et listé dans le résumé de la semaine. Constaté en
// production : un rendez-vous à 7h00 introuvable sur le planning. L'assistante
// voyait deux rendez-vous annoncés et n'en trouvait qu'un.
// Traduit le résultat d'envoi en une phrase qui dit à l'assistante ce que le
// patient sait, et ce qu'il lui reste à faire. « Envoyé » et « à envoyer »
// n'appellent pas la même action de sa part.
function libelleNotification(
  n?: { canal?: string; error?: string; simulated?: boolean } | null
) {
  if (!n) return "Patient NON prévenu : aucun numéro à son dossier. Appelez-le.";
  if (n.error) return `Patient NON prévenu (${n.error}). Appelez-le.`;
  if (n.canal === "manuel")
    return "Message déposé dans la file « À envoyer » — à envoyer depuis Communication.";
  if (n.simulated) return "Message enregistré, mais aucun canal d'envoi n'est configuré.";
  // Ni Meta ni les opérateurs SMS ne confirment la livraison dans leur
  // réponse : ils acceptent la requête, puis rendent compte plus tard par
  // webhook — souvent pour rejeter. Écrire « patient prévenu » ici
  // affirmerait une chose qu'on ignore encore, et que ce cabinet a
  // précisément vu se démentir (erreur 131042 arrivant après un HTTP 200).
  if (n.canal === "whatsapp")
    return "Message remis à WhatsApp. Livraison pas encore confirmée — vérifiez dans Communication.";
  if (n.canal === "sms")
    return "Message remis à l'opérateur SMS. Livraison pas encore confirmée — vérifiez dans Communication.";
  return "Patient NON prévenu. Appelez-le.";
}

// Hauteur d'un rendez-vous, proportionnelle à sa durée (80px par heure).
//
// Tous les blocs faisaient 72px, soit visuellement une heure : un contrôle de
// 15 minutes et une intervention de deux heures occupaient la même place. Le
// praticien ne pouvait donc pas voir d'un coup d'œil comment sa journée était
// remplie — c'est pourtant la première chose qu'on demande à un planning.
//
// Plancher à 30px : en dessous, le nom du patient n'est plus lisible, et un
// rendez-vous illisible est pire qu'un rendez-vous un peu trop grand.
function hauteurBloc(minutes: number | null | undefined) {
  return Math.max(30, ((minutes || 30) / 60) * 80 - 6);
}

// « 14:30 – 15:00 » : l'heure de fin est ce que l'assistante cherche quand
// elle case un patient entre deux rendez-vous.
function plageHeures(iso: string, minutes: number | null | undefined) {
  const debut = new Date(iso);
  const fin = new Date(debut.getTime() + (minutes || 30) * 60000);
  const hhmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${hhmm(debut)} – ${hhmm(fin)}`;
}

function plageHoraire(dates: Date[]) {
  let debut = HEURE_DEBUT_DEFAUT;
  let fin = HEURE_FIN_DEFAUT;
  for (const d of dates) {
    const h = d.getHours();
    if (h < debut) debut = h;
    // +1 : un rendez-vous commencé à 20h doit avoir sa ligne entière.
    if (h > fin) fin = h;
  }
  return Array.from({ length: fin - debut + 1 }, (_, i) => i + debut);
}

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
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Prise en charge depuis la salle d'attente.
  //
  // Le dossier courant était fabriqué à partir des seules données du
  // rendez-vous : nom, téléphone, et le reste inventé — référence de dossier
  // « — », date de naissance, adresse, allergies et mutuelle vides. Deux
  // conséquences concrètes : la facture éditée ensuite portait « — » comme
  // référence de dossier, et surtout le rappel d'allergie de l'ordonnance,
  // qui lit ce champ, ne pouvait RIEN signaler — le silence était garanti
  // pour tout patient pris en charge par ce chemin.
  //
  // On relit donc la fiche complète, et on refuse d'ouvrir le dossier si la
  // lecture échoue plutôt que d'en ouvrir un amputé.
  const [priseEnChargeId, setPriseEnChargeId] = useState<string | null>(null);
  const [priseEnChargeErreur, setPriseEnChargeErreur] = useState<string | null>(null);

  const prendreEnCharge = async (appt: Appointment) => {
    if (currentPatient?.id === appt.patient_id) return;
    setPriseEnChargeId(appt.id);
    setPriseEnChargeErreur(null);
    try {
      const res = await fetch(`/api/patients/${appt.patient_id}`);
      const data = await res.json();
      if (!res.ok || !data.patient) {
        throw new Error(data.error || "Le dossier de ce patient n'a pas pu être ouvert.");
      }
      setCurrentPatient?.(mapDbPatientToContext(data.patient));
    } catch (e) {
      setPriseEnChargeErreur(
        e instanceof Error
          ? `${e.message} N'ouvrez pas de soins sur ce patient tant que son dossier n'est pas chargé.`
          : "Erreur inconnue."
      );
    } finally {
      setPriseEnChargeId(null);
    }
  };

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
  // Motif d'échec des actions de la fiche rendez-vous (annulation, report,
  // message). Sans lui, un refus du serveur restait invisible.
  const [actionError, setActionError] = useState<string | null>(null);
  // Ce qui est advenu du message prévenant le patient d'une annulation ou
  // d'un report. Affiché après fermeture de la fiche, puisque c'est le
  // moment où l'assistante se demande si le patient est au courant.
  const [notifAnnulation, setNotifAnnulation] = useState<string | null>(null);
  // Distingue « aucun rendez-vous » de « je n'ai pas pu les charger ».
  const [chargeErreur, setChargeErreur] = useState<string | null>(null);
  const grilleRef = useRef<HTMLDivElement>(null);
  // Mémorise la vue déjà recadrée, pour ne pas repositionner la grille sous
  // les doigts de l'utilisateur à chaque rechargement des rendez-vous.
  const positionDejaCalee = useRef<string>("");

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

  // L'en-tête n'affichait que le mois du LUNDI : une semaine du 31 août au
  // 6 septembre s'annonçait « août 2026 », alors que cinq de ses sept jours
  // sont en septembre. On nomme les deux bornes de la semaine.
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const monthLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${weekEnd.toLocaleString("fr-FR", { month: "long", year: "numeric" })}`
      : `${weekStart.getDate()} ${weekStart.toLocaleString("fr-FR", { month: "short" })} – ${weekEnd.getDate()} ${weekEnd.toLocaleString("fr-FR", { month: "short", year: "numeric" })}`;
  const teamDayLabel = activeDate.toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  // Les compteurs « Cette semaine » et la liste hebdomadaire affichaient
  // `appointments`, qui ne contient que la fenêtre visible : en vue « équipe »
  // (une seule journée), le cabinet lisait « 0 RDV cette semaine » alors que
  // la semaine était chargée. On charge donc la semaine séparément de la vue.
  const loadWeekAppointments = useCallback(async () => {
    const monday = new Date();
    const jour = (monday.getDay() + 6) % 7; // lundi = 0
    monday.setDate(monday.getDate() - jour);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 7);
    try {
      const params = new URLSearchParams({ from: monday.toISOString(), to: sunday.toISOString() });
      if (selectedPractitioner !== "all") params.set("practitionerId", selectedPractitioner);
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      if (res.ok) setWeekAppointments(data.appointments || []);
    } catch {
      /* le compteur reste sur sa dernière valeur connue */
    }
  }, [selectedPractitioner]);

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
      if (res.ok) {
        setAppointments(data.appointments);
        setChargeErreur(null);
      } else {
        // Un échec de chargement vidait la grille : l'écran annonçait alors
        // « aucun rendez-vous » à un cabinet qui en avait. Le personnel
        // pouvait croire la journée libre.
        setChargeErreur(data.error || "Impossible de charger les rendez-vous. La grille peut être incomplète.");
      }
    } catch {
      setChargeErreur("Réseau indisponible : la grille peut être incomplète.");
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
    loadWeekAppointments();
  }, [loadWeekAppointments]);

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
    loadWeekAppointments();
  };

  // Annuler, pointer une arrivée ou marquer une absence : la réponse du
  // serveur était ignorée. Un refus (403, conflit, panne) refermait la fiche
  // exactement comme un succès, et l'assistante croyait le rendez-vous annulé
  // alors qu'il tenait toujours.
  const runAction = async (appt: Appointment, action: "check-in" | "complete" | "cancel" | "no-show") => {
    if ((action === "cancel" || action === "no-show") && !window.confirm(
      action === "cancel"
        ? `Annuler le rendez-vous de ${appt.patient_name || "ce patient"} ?`
        : `Marquer ${appt.patient_name || "ce patient"} comme absent ?`
    )) return;

    setActionError(null);
    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError(d.error || "L'opération a échoué. Le rendez-vous est inchangé.");
        return;
      }
      const d = await res.json().catch(() => ({}));
      if (action === "cancel") setNotifAnnulation(libelleNotification(d.notification));
      setActiveAppt(null);
      loadAppointments();
      // La vue semaine se rafraîchit aussi : sans cela un rendez-vous annulé
      // disparaissait de la journée mais restait dans le résumé de la semaine.
      loadWeekAppointments();
    } catch {
      setActionError("Réseau indisponible. Le rendez-vous est inchangé.");
    }
  };

  const sendQuickMessage = async () => {
    if (!activeAppt || !quickMessage.trim() || !activeAppt.patient_phone) return;
    setSendingQuickMessage(true);
    setActionError(null);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: activeAppt.patient_id,
          phone: activeAppt.patient_phone,
          message: quickMessage,
          channel: quickMessageChannel,
        }),
      });
      // La confirmation « Envoyé » s'affichait quoi qu'il arrive : la réponse
      // n'était pas lue. Avec les canaux actuellement fermés, l'assistante
      // voyait donc « Envoyé » à chaque tentative sans qu'aucun message ne
      // parte. C'est le contraire de ce que doit faire cet écran.
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError(d.error || "Le message n'est pas parti.");
        return;
      }
      setQuickMessage("");
      setQuickMessageSent(true);
      setTimeout(() => setQuickMessageSent(false), 2500);
    } catch {
      setActionError("Réseau indisponible. Le message n'est pas parti.");
    } finally {
      setSendingQuickMessage(false);
    }
  };

  const submitReschedule = async () => {
    if (!activeAppt || !rescheduleDate) return;
    setActionError(null);
    const res = await fetch(`/api/appointments/${activeAppt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reschedule", scheduledAt: new Date(rescheduleDate).toISOString() }),
    });
    if (res.ok) {
      const d = await res.json().catch(() => ({}));
      setNotifAnnulation(libelleNotification(d.notification));
      setActiveAppt(null);
      setRescheduleDate("");
      loadAppointments();
      loadWeekAppointments();
    } else {
      // Un report refusé (créneau déjà pris, notamment) laissait la fiche
      // ouverte sans un mot : l'utilisateur recliquait sans comprendre.
      const d = await res.json().catch(() => ({}));
      setActionError(d.error || "Report impossible. Vérifiez que le créneau est libre.");
    }
  };

  // Un échec ne doit pas suivre l'utilisateur d'une fiche à l'autre : sans
  // cela, l'erreur d'un rendez-vous s'affichait sur le suivant qu'il ouvre.
  useEffect(() => {
    setActionError(null);
  }, [activeAppt?.id]);

  // Le bandeau disparaît de lui-même, mais assez lentement pour être lu :
  // c'est une information sur ce que le patient sait, pas une décoration.
  useEffect(() => {
    if (!notifAnnulation) return;
    const t = setTimeout(() => setNotifAnnulation(null), 12000);
    return () => clearTimeout(t);
  }, [notifAnnulation]);

  const todaysAppointments = appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    const now = new Date();
    return d.toDateString() === now.toDateString() && a.status === "scheduled";
  }).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  // La grille couvre les deux vues à la fois : en basculant de « Semaine » à
  // « Équipe », l'échelle ne doit pas se déplacer sous les yeux de
  // l'utilisateur.
  const HOURS = plageHoraire(
    [...appointments, ...weekAppointments].map(a => new Date(a.scheduled_at))
  );
  const premiereHeure = HOURS[0];
  // Position verticale d'une heure décimale dans la grille (80px par heure).
  const positionY = (heure: number) => (heure - premiereHeure) * 80;

  // Ouvrir l'agenda sur l'heure qui intéresse, pas sur 8h00.
  //
  // La grille démarrait toujours en haut : sur un écran de 720px elle ne
  // laisse voir que six heures, si bien qu'une consultation en fin de
  // journée affichait une matinée vide et qu'il fallait faire défiler pour
  // trouver les rendez-vous. On se cale sur l'heure courante quand on
  // regarde aujourd'hui, sinon sur le premier rendez-vous de la période.
  //
  // Le repositionnement n'a lieu qu'au changement de vue ou de jour : le
  // refaire à chaque rechargement de données arracherait la grille des
  // mains de l'utilisateur en train de la parcourir.
  const clePosition = `${agendaView}|${weekOffset}|${dayOffset}`;
  useEffect(() => {
    const el = grilleRef.current;
    if (!el || loading) return;
    if (positionDejaCalee.current === clePosition) return;

    const source = agendaView === "week" ? weekAppointments : appointments;
    const heures = source.map(a => new Date(a.scheduled_at).getHours());
    const surAujourdhui = weekOffset === 0 && dayOffset === 0;

    let cible: number | null = null;
    if (surAujourdhui) cible = new Date().getHours();
    else if (heures.length > 0) cible = Math.min(...heures);
    if (cible === null) return;

    positionDejaCalee.current = clePosition;
    // Une heure de marge au-dessus : voir ce qui vient de se terminer aide à
    // se repérer autant que ce qui arrive.
    el.scrollTop = Math.max(0, (cible - 1 - premiereHeure) * 80);
  }, [loading, clePosition, agendaView, weekOffset, dayOffset, appointments, weekAppointments, premiereHeure]);

  return (
    <div className={cn(
      "animate-in fade-in duration-500",
      isFullscreen ? "fixed inset-0 z-[100] bg-[#F1F5F9] p-4 sm:p-6 overflow-y-auto flex flex-col space-y-6" : "space-y-6"
    )}>
      {chargeErreur && (
        <div className="flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          {chargeErreur}
        </div>
      )}

      {/* Sort du patient après une annulation ou un report : a-t-il été
          prévenu, et par quel moyen ? */}
      {notifAnnulation && (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-sm border p-3 text-xs font-bold",
            /NON prévenu/.test(notifAnnulation)
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : /file/.test(notifAnnulation)
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          )}
        >
          <span className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {notifAnnulation}
          </span>
          <button
            onClick={() => setNotifAnnulation(null)}
            className="flex-shrink-0 opacity-60 hover:opacity-100"
            title="Masquer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Le titre du module est déjà écrit juste au-dessus par la page :
            le répéter ici coûtait une bande entière de hauteur sur un écran
            de 720px, où la grille ne commençait qu'à 468px. Les compteurs
            prennent cette place — ils étaient plus bas, dans deux grandes
            cartes, pour afficher deux nombres. */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-5">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aujourd&apos;hui</p>
              <p className="text-xl font-black text-emerald-600 leading-none mt-0.5">
                {todaysAppointments.length}
                <span className="text-[10px] font-bold text-slate-400 ml-1">RDV</span>
              </p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cette semaine</p>
              <p className="text-xl font-black text-blue-900 leading-none mt-0.5">
                {weekAppointments.length}
                <span className="text-[10px] font-bold text-slate-400 ml-1">RDV</span>
              </p>
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
            // Ce bouton était plus gros et plus voyant que « Réserver »,
            // qui est pourtant l'action principale de l'écran. Ramené au
            // gabarit des autres commandes de la barre.
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border transition-all",
              isFullscreen
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
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
          {/* Les compteurs sont remontés dans l'en-tête : deux cartes de
              100px de haut pour deux nombres, c'était autant de grille en
              moins. */}
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

          {/* Export de l'agenda.
              Le bloc s'intitulait « Sync Google Calendar » alors qu'il ne
              synchronise rien : le fichier .ics est une copie figée à
              l'instant du téléchargement. Importée dans Google Calendar, elle
              n'apprend jamais qu'un rendez-vous a été déplacé ou annulé — le
              praticien verrait sur son téléphone un patient qui ne vient
              plus. Le titre dit désormais ce que le bouton fait. */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-3 space-y-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Exporter l&apos;agenda</p>
            </div>
            <a
              href="/api/calendar/ics"
              target="_blank"
              download="agenda-cabinet.ics"
              className="w-full flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded transition-all"
            >
              Télécharger (.ics)
            </a>
            <p className="text-[9px] text-slate-500 leading-relaxed">
              Copie de l&apos;agenda à cet instant, à importer dans Google Calendar ou
              Outlook. Elle ne se met pas à jour toute seule :{" "}
              <strong>après un report ou une annulation, réexportez</strong>.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-[#0F172A] text-white flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-blue-400" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">RDV de la semaine</h4>
            </div>
            <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
              {!loading && weekAppointments.length === 0 && (
                <p className="p-4 text-[10px] text-slate-400 text-center uppercase tracking-widest">Aucun RDV</p>
              )}
              {weekAppointments.map(appt => {
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
          // Hauteur figée à 680px auparavant : sur un portable de 720px la
          // page devait défiler (et la barre de défilement est masquée par
          // `no-scrollbar`, donc rien n'indiquait qu'il y avait une suite).
          // Le planning occupe désormais la hauteur réellement disponible.
          // Mesuré : au-dessus de cette carte, le châssis occupe ~260px, et la
          // barre d'outils + les en-têtes de colonnes en consomment 170 de plus.
          // Un simple `100vh - 260` ramenait donc la grille à 3h sur un écran
          // de 720px — pire que le 680px figé d'origine. Le plancher garantit
          // une demi-journée lisible sur un portable, et le calcul laisse la
          // grille prendre toute la hauteur d'un écran de bureau.
          isFullscreen ? "h-[calc(100vh-140px)]" : "h-[calc(100vh-260px)] min-h-[560px]"
        )}>
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-sm shadow-sm px-2 py-1">
                <button onClick={() => agendaView === "week" ? setWeekOffset(w => w - 1) : setDayOffset(d => d - 1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-black text-slate-900 uppercase min-w-[190px] text-center">
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

            {/* Onglets et bouton réunis : séparés, ils passaient à la ligne
                et coûtaient 44px de planning. */}
            <div className="flex items-center gap-3">
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

              <div ref={grilleRef} className="flex-1 overflow-y-auto overflow-x-auto relative">
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
                    top: `${Math.max(0, positionY(new Date().getHours() + new Date().getMinutes() / 60))}px`,
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
                            title={`${appt.patient_name} — ${plageHeures(appt.scheduled_at, appt.duration_minutes)} · ${appt.type || "Consultation"}`}
                            style={{ top: `${positionY(hourFloat) + 4}px`, height: `${hauteurBloc(appt.duration_minutes)}px` }}
                          >
                            {/* Le contenu suit la hauteur du bloc : sur une
                                consultation de 30 minutes, trois lignes se
                                feraient couper en plein milieu d'un mot. */}
                            {hauteurBloc(appt.duration_minutes) < 52 ? (
                              <p className="truncate tracking-tight leading-tight flex items-center gap-1">
                                <span className={cn("font-bold flex-shrink-0", colors.textLight)}>
                                  {plageHeures(appt.scheduled_at, appt.duration_minutes).split(" – ")[0]}
                                </span>
                                <span className="truncate">{appt.patient_name}</span>
                                {appt.checked_in_at && <LogIn className="h-3 w-3 flex-shrink-0" />}
                                {appt.status === "completed" && <CheckCircle2 className="h-3 w-3 flex-shrink-0" />}
                                {appt.status === "cancelled" && <XCircle className="h-3 w-3 flex-shrink-0" />}
                                {appt.status === "no_show" && <UserX className="h-3 w-3 flex-shrink-0" />}
                              </p>
                            ) : (
                              <>
                                <p className="truncate tracking-tight leading-tight">{appt.patient_name}</p>
                                <p className={cn("truncate text-[10px] leading-tight font-bold mt-0.5", colors.textLight)}>
                                  {plageHeures(appt.scheduled_at, appt.duration_minutes)} · {appt.type}
                                </p>
                                <div className="flex items-center gap-1 mt-1 opacity-80">
                                  {appt.checked_in_at && <LogIn className="h-3 w-3" />}
                                  {appt.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                                  {appt.status === "cancelled" && <XCircle className="h-3 w-3" />}
                                  {appt.status === "no_show" && <UserX className="h-3 w-3" />}
                                </div>
                              </>
                            )}
                          </motion.button>
                        );
                      })}

                      {HOURS.map(h => (
                        <button
                          key={h}
                          onClick={() => openModal(dayIdx, h)}
                          className="absolute w-full opacity-0 hover:opacity-100 transition-all flex items-center justify-center z-0 p-1"
                          style={{ top: `${positionY(h)}px`, height: "80px" }}
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
                            title={`${appt.patient_name} — ${plageHeures(appt.scheduled_at, appt.duration_minutes)} · ${appt.type || "Consultation"}`}
                            style={{ top: `${positionY(hourFloat) + 4}px`, height: `${hauteurBloc(appt.duration_minutes)}px` }}
                          >
                            {/* Le contenu suit la hauteur du bloc : sur une
                                consultation de 30 minutes, trois lignes se
                                feraient couper en plein milieu d'un mot. */}
                            {hauteurBloc(appt.duration_minutes) < 52 ? (
                              <p className="truncate tracking-tight leading-tight flex items-center gap-1">
                                <span className={cn("font-bold flex-shrink-0", colors.textLight)}>
                                  {plageHeures(appt.scheduled_at, appt.duration_minutes).split(" – ")[0]}
                                </span>
                                <span className="truncate">{appt.patient_name}</span>
                                {appt.checked_in_at && <LogIn className="h-3 w-3 flex-shrink-0" />}
                                {appt.status === "completed" && <CheckCircle2 className="h-3 w-3 flex-shrink-0" />}
                                {appt.status === "cancelled" && <XCircle className="h-3 w-3 flex-shrink-0" />}
                                {appt.status === "no_show" && <UserX className="h-3 w-3 flex-shrink-0" />}
                              </p>
                            ) : (
                              <>
                                <p className="truncate tracking-tight leading-tight">{appt.patient_name}</p>
                                <p className={cn("truncate text-[10px] leading-tight font-bold mt-0.5", colors.textLight)}>
                                  {plageHeures(appt.scheduled_at, appt.duration_minutes)} · {appt.type}
                                </p>
                                <div className="flex items-center gap-1 mt-1 opacity-80">
                                  {appt.checked_in_at && <LogIn className="h-3 w-3" />}
                                  {appt.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                                  {appt.status === "cancelled" && <XCircle className="h-3 w-3" />}
                                  {appt.status === "no_show" && <UserX className="h-3 w-3" />}
                                </div>
                              </>
                            )}
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
                            style={{ top: `${positionY(h)}px`, height: "80px" }}
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
                      style={{ top: `${Math.max(0, positionY(new Date().getHours() + new Date().getMinutes() / 60))}px` }} />
                    <div className="absolute w-2.5 h-2.5 rounded-full bg-red-600 z-30 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse border border-white"
                      style={{ top: `${Math.max(-4, positionY(new Date().getHours() + new Date().getMinutes() / 60) - 4)}px`, left: "55px" }} />
                  </>
                )}
              </div>
            </div>
          ) : (
            /* SALLE D'ATTENTE */
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {priseEnChargeErreur && (
                <div className="rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                  {priseEnChargeErreur}
                </div>
              )}
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
                        onClick={() => prendreEnCharge(appt)}
                        disabled={priseEnChargeId === appt.id}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all shadow-sm disabled:opacity-50"
                      >
                        {priseEnChargeId === appt.id ? "Ouverture…" : "Prendre en charge"}
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
                {/* Motif d'échec des actions. Il s'affiche à l'intérieur de la
                    fiche, qui reste ouverte : l'utilisateur voit ce qui a
                    échoué à l'endroit même où il vient de cliquer. */}
                {actionError && (
                  <div className="flex items-start gap-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded p-2.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}

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
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200">Agenda du cabinet</p>
              <h3 className="text-xl font-black">Nouveau rendez-vous</h3>
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
                  {HEURES_RESERVATION.map(h => (
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
