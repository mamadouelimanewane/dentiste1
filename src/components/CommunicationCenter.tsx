"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, MessageCircle, MessageSquare, User, AlertTriangle, Plus, X, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Thread {
  patient_id: string;
  full_name: string;
  phone: string | null;
  last_message: string;
  last_direction: "inbound" | "outbound";
  last_channel: "whatsapp" | "sms" | "portal";
  created_at: string;
}

interface Message {
  id: string;
  patient_id: string;
  phone: string | null;
  channel: "whatsapp" | "sms" | "portal";
  direction: "inbound" | "outbound";
  body: string;
  status: string;
  media_url: string | null;
  created_at: string;
}

interface PatientHit {
  id: string;
  full_name: string;
  phone: string | null;
  dossier_number: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function CommunicationCenter() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [search, setSearch] = useState("");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [patientQuery, setPatientQuery] = useState("");
  const [patientHits, setPatientHits] = useState<PatientHit[]>([]);
  // Canaux réellement branchés sur un fournisseur. Quand aucun ne l'est,
  // l'application ne fait pas semblant d'envoyer : elle prépare le message
  // pour que l'assistante l'envoie depuis le téléphone du cabinet.
  const [canauxAuto, setCanauxAuto] = useState<{ whatsapp: boolean; sms: boolean } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(() => {
    setLoadingThreads(true);
    fetch("/api/messages/threads")
      .then((res) => res.json())
      .then((data) => setThreads(data.threads || []))
      .catch(() => setError("Impossible de charger les conversations."))
      .finally(() => setLoadingThreads(false));
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const loadMessages = useCallback((patientId: string) => {
    setLoadingMessages(true);
    fetch(`/api/messages/threads?patientId=${patientId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setError("Impossible de charger le fil de discussion."))
      .finally(() => setLoadingMessages(false));
  }, []);

  useEffect(() => {
    if (activePatientId) loadMessages(activePatientId);
  }, [activePatientId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Recherche de patient pour démarrer une nouvelle conversation.
  useEffect(() => {
    if (!showNew || !patientQuery.trim()) {
      setPatientHits([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/patients?q=${encodeURIComponent(patientQuery)}`)
        .then((res) => res.json())
        .then((data) => setPatientHits(data.patients || []))
        .catch(() => setPatientHits([]));
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery, showNew]);

  useEffect(() => {
    fetch("/api/config/status")
      .then((r) => r.json())
      .then((d) => setCanauxAuto({ whatsapp: !!d.whatsapp, sms: !!d.sms }))
      // En cas d'échec, on suppose qu'aucun canal n'est branché : proposer
      // l'envoi manuel à tort est sans conséquence, laisser croire à un envoi
      // automatique qui n'aura pas lieu ne l'est pas.
      .catch(() => setCanauxAuto({ whatsapp: false, sms: false }));
  }, []);

  const activeThread = threads.find((t) => t.patient_id === activePatientId);
  const envoiAutoDispo = canauxAuto ? canauxAuto[channel] : false;
  const activePhone = activeThread?.phone || messages.find((m) => m.phone)?.phone || null;

  const filteredThreads = threads.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (t.phone || "").includes(search)
  );

  const startConversation = (p: PatientHit) => {
    if (!threads.find((t) => t.patient_id === p.id)) {
      setThreads((prev) => [
        {
          patient_id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          last_message: "",
          last_direction: "outbound",
          last_channel: "whatsapp",
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setActivePatientId(p.id);
    setShowNew(false);
    setPatientQuery("");
  };

  // Prépare le message et ouvre WhatsApp (ou l'application SMS) dessus.
  // L'assistante appuie sur envoyer : le message part pour de bon, mais par
  // une main humaine. Il est donc enregistré « à envoyer », pas « envoyé » —
  // tant que personne n'a confirmé, l'historique ne prétend rien.
  const handleSendManuel = async () => {
    const text = inputText.trim();
    if (!text || !activePatientId || !activePhone || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/manuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: activePatientId,
          phone: activePhone,
          message: text,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la préparation.");
      setInputText("");
      // Ouvert depuis le clic de l'utilisateur : les navigateurs bloquent
      // l'ouverture d'un onglet déclenchée après coup par du code.
      window.open(data.lien, "_blank", "noopener,noreferrer");
      loadMessages(activePatientId);
      loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSending(false);
    }
  };

  const confirmerEnvoi = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/messages/${id}/confirmer`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la confirmation.");
      if (activePatientId) loadMessages(activePatientId);
      loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  };

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activePatientId || !activePhone || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: activePatientId,
          phone: activePhone,
          message: text,
          channel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.");
      setInputText("");
      loadMessages(activePatientId);
      loadThreads();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row h-[700px]">
      {/* ── COLONNE GAUCHE : CONVERSATIONS RÉELLES ── */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col bg-slate-50/50 max-h-64 md:max-h-none">
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Messages</h2>
            <button
              onClick={() => setShowNew((v) => !v)}
              title="Nouvelle conversation"
              className="h-8 w-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {showNew ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={showNew ? "Chercher un patient..." : "Filtrer les conversations..."}
              value={showNew ? patientQuery : search}
              onChange={(e) => (showNew ? setPatientQuery(e.target.value) : setSearch(e.target.value))}
              className="w-full bg-slate-100 border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 pl-9 pr-4 text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNew ? (
            <>
              {patientHits.map((p) => (
                <div
                  key={p.id}
                  onClick={() => startConversation(p)}
                  className="p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <p className="font-semibold text-slate-900 text-sm">{p.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {p.dossier_number} · {p.phone || "Aucun numéro"}
                  </p>
                </div>
              ))}
              {patientQuery && patientHits.length === 0 && (
                <p className="p-4 text-sm text-slate-500 text-center">Aucun patient trouvé.</p>
              )}
              {!patientQuery && (
                <p className="p-4 text-sm text-slate-500 text-center">
                  Cherchez un patient pour démarrer une conversation.
                </p>
              )}
            </>
          ) : (
            <>
              {loadingThreads && <p className="p-4 text-sm text-slate-400 text-center">Chargement...</p>}
              {!loadingThreads && filteredThreads.length === 0 && (
                <p className="p-4 text-sm text-slate-500 text-center">
                  Aucune conversation. Utilisez « + » pour écrire à un patient.
                </p>
              )}
              {filteredThreads.map((t) => (
                <div
                  key={t.patient_id}
                  onClick={() => setActivePatientId(t.patient_id)}
                  className={cn(
                    "p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-100",
                    activePatientId === t.patient_id
                      ? "bg-blue-50/50 border-l-4 border-l-blue-600"
                      : "border-l-4 border-l-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{t.full_name}</span>
                    <span className="text-xs text-slate-500">{formatTime(t.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {t.last_direction === "outbound" && <span className="text-slate-400">Vous : </span>}
                    {t.last_message || "—"}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── COLONNE DROITE : FIL RÉEL ── */}
      <div className="w-full md:w-2/3 flex flex-col bg-white min-h-0">
        {activePatientId ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{activeThread?.full_name || "Patient"}</h3>
                <p className="text-xs text-slate-500">{activePhone || "Aucun numéro enregistré"}</p>
              </div>
            </div>

            {/* L'erreur s'affiche désormais juste au-dessus de la zone de
                saisie, avec la porte de sortie qui va avec — en tête de fil,
                elle était hors du regard au moment d'agir. */}

            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-4">
              {loadingMessages && <p className="text-sm text-slate-400 text-center">Chargement...</p>}
              {!loadingMessages && messages.length === 0 && (
                <p className="text-sm text-slate-400 text-center">
                  Aucun message échangé avec ce patient pour l&apos;instant.
                </p>
              )}
              {messages.map((msg) => {
                const isMine = msg.direction === "outbound";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[75%]",
                      isMine ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "px-4 py-2.5 rounded-2xl shadow-sm",
                        isMine
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      {msg.media_url && (
                        <a
                          href={msg.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn("text-xs underline", isMine ? "text-blue-100" : "text-blue-600")}
                        >
                          Pièce jointe
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                      <span>{formatTime(msg.created_at)}</span>
                      {msg.channel === "whatsapp" && <MessageCircle className="h-3 w-3" />}
                      {msg.channel === "sms" && <MessageSquare className="h-3 w-3" />}
                      {isMine && msg.status === "failed" && (
                        <span className="text-rose-500 font-bold">échec</span>
                      )}
                      {isMine && msg.status === "simulated" && (
                        <span className="text-amber-500 font-bold">simulé</span>
                      )}
                      {/* Préparé mais pas encore parti : le distinguer d'un
                          message envoyé est tout l'intérêt de ce statut. */}
                      {isMine && msg.status === "a_envoyer" && (
                        <>
                          <span className="text-amber-600 font-bold">à envoyer</span>
                          <button
                            onClick={() => confirmerEnvoi(msg.id)}
                            title="Je l'ai envoyé depuis le téléphone du cabinet"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold transition-colors"
                          >
                            <Check className="h-3 w-3" />
                            confirmer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 bg-white">
              {!activePhone && (
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  Ce patient n&apos;a pas de numéro enregistré — impossible de lui écrire.
                </div>
              )}
              {activePhone && canauxAuto && !envoiAutoDispo && (
                <div className="mb-3 flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5 text-slate-400" />
                  <span>
                    L&apos;envoi automatique par {channel === "whatsapp" ? "WhatsApp" : "SMS"}{" "}
                    n&apos;est pas encore ouvert.{" "}
                    <strong>
                      {channel === "whatsapp" ? "WhatsApp s'ouvrira" : "L'application SMS s'ouvrira"}{" "}
                      avec le message déjà écrit
                    </strong>{" "}
                    — il ne vous reste qu&apos;à appuyer sur envoyer, puis à le confirmer ici.
                  </span>
                </div>
              )}
              {/* L'échec d'un envoi automatique est le moment précis où
                  l'assistante a besoin de l'autre voie : le fournisseur peut
                  être paramétré et refuser quand même (compte non vérifié,
                  hors fenêtre de 24h, crédit épuisé). Sans cette porte de
                  sortie ici, le message est perdu et le patient non prévenu. */}
              {error && (
                <div className="mb-3 flex items-start justify-between gap-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <span className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </span>
                  {inputText.trim() && activePhone && (
                    <button
                      onClick={handleSendManuel}
                      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 font-bold transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Envoyer moi-même
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 bg-slate-100 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 border border-transparent transition-all">
                <div className="flex bg-white rounded-lg p-0.5 shadow-sm">
                  <button
                    onClick={() => setChannel("whatsapp")}
                    title="Envoyer via WhatsApp"
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      channel === "whatsapp" ? "bg-emerald-100 text-emerald-700" : "text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setChannel("sms")}
                    title="Envoyer par SMS"
                    className={cn(
                      "p-2 rounded-md transition-colors",
                      channel === "sms" ? "bg-blue-100 text-blue-700" : "text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (envoiAutoDispo ? handleSendMessage() : handleSendManuel())
                  }
                  disabled={!activePhone}
                  placeholder={`Message via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}...`}
                  className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-slate-800 placeholder:text-slate-400 disabled:cursor-not-allowed"
                />

                {/* Voie manuelle toujours offerte, même quand un fournisseur
                    est paramétré : « paramétré » ne veut pas dire « fonctionne »
                    — un compte non vérifié, une fenêtre de 24h expirée ou un
                    crédit épuisé se découvrent à l'envoi, parfois seulement
                    après coup. L'assistante n'a alors pas à attendre l'échec
                    pour envoyer elle-même. */}
                {envoiAutoDispo && (
                  <button
                    onClick={handleSendManuel}
                    disabled={sending || !inputText.trim() || !activePhone}
                    title={`Envoyer moi-même depuis ${channel === "whatsapp" ? "WhatsApp" : "l'application SMS"}`}
                    className="h-10 w-10 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-500 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}

                {/* Sans fournisseur branché, le bouton n'envoie pas : il ouvre
                    WhatsApp sur le message. L'icône le dit, pour que personne
                    ne croie l'avoir envoyé en cliquant. */}
                <button
                  onClick={envoiAutoDispo ? handleSendMessage : handleSendManuel}
                  disabled={sending || !inputText.trim() || !activePhone}
                  title={
                    envoiAutoDispo
                      ? "Envoyer"
                      : `Ouvrir ${channel === "whatsapp" ? "WhatsApp" : "l'application SMS"} avec ce message`
                  }
                  className={cn(
                    "h-10 px-3 min-w-10 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md",
                    envoiAutoDispo
                      ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                  )}
                >
                  {envoiAutoDispo ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Ouvrir</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
