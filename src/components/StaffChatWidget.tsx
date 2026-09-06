"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MessageCircle, X, Send, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface StaffMessage {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function StaffChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<StaffMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch("/api/staff-chat")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages) setMessages(data.messages);
      })
      .catch(() => {
        /* silencieux : le widget ne doit pas polluer l'écran en cas de coupure */
      });
  }, []);

  // Chargé à l'ouverture puis rafraîchi périodiquement — uniquement tant que
  // le panneau est ouvert, pour ne pas interroger l'API en permanence.
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    load();
    setLoading(false);
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [isOpen, load]);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/staff-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'envoi.");
      setInput("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-[calc(100vw-3rem)] sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mb-4"
            style={{ height: "400px", maxHeight: "calc(100vh - 120px)" }}
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Staff du Cabinet</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Messagerie interne</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {loading && messages.length === 0 && (
                <p className="text-xs text-slate-400 text-center">Chargement...</p>
              )}
              {!loading && messages.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">
                  Aucun message. Écrivez le premier à votre équipe.
                </p>
              )}
              {messages.map((msg) => {
                const isMe = msg.author_id === user.id;
                return (
                  <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "")}>
                    {!isMe && (
                      <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {initials(msg.author_name)}
                      </div>
                    )}
                    <div className={cn("max-w-[75%] flex flex-col", isMe ? "items-end" : "items-start")}>
                      {!isMe && (
                        <span className="text-[9px] font-bold text-slate-400 ml-1 mb-1">{msg.author_name}</span>
                      )}
                      <div
                        className={cn(
                          "p-2.5 rounded-xl text-xs whitespace-pre-wrap break-words",
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white border border-slate-200 text-slate-700 rounded-tl-none"
                        )}
                      >
                        {msg.body}
                      </div>
                      <span className="text-[8px] text-slate-400 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {error && (
              <p className="px-4 py-2 text-[10px] font-bold text-rose-600 bg-rose-50 border-t border-rose-100">
                {error}
              </p>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="Écrire à l'équipe..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-full px-4 py-2 text-xs outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="h-8 w-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5 -ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Messagerie interne"
        aria-label="Messagerie interne"
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110",
          isOpen ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
        )}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
