"use client";

import React, { useState } from "react";
import { MessageCircle, X, Send, User, ChevronDown, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: number;
  sender: string;
  avatar: string;
  text: string;
  time: string;
  isMe: boolean;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 1, sender: "Sophie (Accueil)", avatar: "S", text: "Dr. Niang, le patient Dupont est arrivé en salle d'attente.", time: "10:15", isMe: false },
  { id: 2, sender: "Dr. Niang", avatar: "N", text: "Merci Sophie, je finis la pano et je le prends.", time: "10:16", isMe: true },
  { id: 3, sender: "Marie (Assistante)", avatar: "M", text: "Le box 2 est stérilisé et prêt.", time: "10:20", isMe: false },
];

export function StaffChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages([
      ...messages,
      {
        id: Date.now(),
        sender: "Moi",
        avatar: "M",
        text: input,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isMe: true
      }
    ]);
    setInput("");
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
                <div className="relative">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Staff du Cabinet</h3>
                  <p className="text-[10px] text-slate-400 font-medium">3 en ligne</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2", msg.isMe ? "flex-row-reverse" : "")}>
                  {!msg.isMe && (
                    <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {msg.avatar}
                    </div>
                  )}
                  <div className={cn("max-w-[75%] flex flex-col", msg.isMe ? "items-end" : "items-start")}>
                    {!msg.isMe && <span className="text-[9px] font-bold text-slate-400 ml-1 mb-1">{msg.sender}</span>}
                    <div className={cn("p-2.5 rounded-xl text-xs", msg.isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-tl-none")}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[8px] text-slate-400">{msg.time}</span>
                      {msg.isMe && <CheckCheck className="h-3 w-3 text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
              <input
                type="text"
                placeholder="Écrire un message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-full px-4 py-2 text-xs outline-none transition-all"
              />
              <button 
                type="submit" 
                disabled={!input.trim()}
                className="h-8 w-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="h-3.5 w-3.5 -ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110",
          isOpen ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : (
          <>
            <MessageCircle className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold">1</span>
          </>
        )}
      </button>
    </div>
  );
}
