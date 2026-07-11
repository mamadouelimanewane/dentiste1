"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalMessage {
  id: string;
  body: string;
  direction: "inbound" | "outbound";
  status: string;
  created_at: string;
  media_url: string | null;
  media_type: string | null;
}

export default function PortalMessagesPage() {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const load = async () => {
    const res = await fetch("/api/portal/messages");
    const data = await res.json();
    if (res.ok) setMessages(data.messages);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch("/api/portal/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      setText("");
      await load();
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setSending(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, "note-vocale.webm");
          const res = await fetch("/api/portal/messages/audio", { method: "POST", body: formData });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Échec de l'envoi.");
          }
          await load();
        } catch (err) {
          setRecordError(err instanceof Error ? err.message : "Erreur inconnue.");
        } finally {
          setSending(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecordError("Impossible d'accéder au microphone — vérifiez les autorisations de votre navigateur.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded shadow-sm flex flex-col h-[70vh]">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <h2 className="text-sm font-black text-slate-900">Messagerie avec le cabinet</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center mt-10">Aucun message pour l'instant.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[75%] p-3 rounded-2xl text-sm",
              m.direction === "inbound"
                ? "self-end ml-auto bg-blue-600 text-white rounded-br-none"
                : "bg-white border border-slate-200 rounded-bl-none"
            )}
          >
            {m.media_url ? (
              <audio controls src={m.media_url} className="max-w-full" style={{ height: 32 }} />
            ) : (
              m.body
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {recordError && (
        <p className="px-4 pt-2 text-xs text-red-500">{recordError}</p>
      )}
      <div className="p-4 border-t border-slate-100 flex items-center gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={recording ? "Enregistrement en cours…" : "Écrivez votre message…"}
          disabled={recording}
          className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none disabled:opacity-50"
        />
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={sending}
          title={recording ? "Arrêter l'enregistrement" : "Enregistrer une note vocale"}
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-40",
            recording ? "bg-rose-600 animate-pulse" : "bg-slate-400 hover:bg-slate-500"
          )}
        >
          {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          onClick={handleSend}
          disabled={sending || !text.trim() || recording}
          className="h-10 w-10 bg-blue-600 disabled:opacity-40 rounded-full flex items-center justify-center text-white"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
