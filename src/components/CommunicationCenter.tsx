"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Send, MessageCircle, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
}

interface Message {
  id: string;
  sender: "Moi" | "Contact";
  text: string;
  time: string;
  channel?: "whatsapp" | "sms";
}

// Données fictives pour la démonstration
const DEMO_CONTACTS: Contact[] = [
  { id: "1", name: "Mamadou Dia", phone: "221770000001", lastMessage: "Je voudrais un rendez-vous...", time: "14:20" },
  { id: "2", name: "Aïssatou Sow", phone: "221770000002", lastMessage: "Merci pour les soins d'hier !", time: "10:12" },
  { id: "3", name: "Fatou Diop", phone: "221770000003", lastMessage: "Est-ce que je peux avoir mon ordo ?", time: "Hier" },
];

const DEMO_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: "m1", sender: "Contact", text: "Bonjour, je voudrais un rendez-vous mardi prochain pour un détartrage s'il vous plaît.", time: "14:20" },
  ],
  "2": [
    { id: "m2", sender: "Contact", text: "Merci pour les soins d'hier, je n'ai plus mal !", time: "10:12" },
    { id: "m3", sender: "Moi", text: "C'est une excellente nouvelle Aïssatou. Bonne journée !", time: "10:15", channel: "whatsapp" },
  ],
  "3": [
    { id: "m4", sender: "Contact", text: "Est-ce que je peux avoir mon ordonnance par WhatsApp ?", time: "Hier" },
  ]
};

export function CommunicationCenter() {
  const [contacts] = useState<Contact[]>(DEMO_CONTACTS);
  const [search, setSearch] = useState("");
  const [activeContactId, setActiveContactId] = useState<string>("1");
  const [messages, setMessages] = useState<Record<string, Message[]>>(DEMO_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.find((c) => c.id === activeContactId);
  const activeMessages = messages[activeContactId] || [];

  const filteredContacts = contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeContact) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "Moi",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      channel,
    };

    setMessages((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMessage],
    }));
    setInputText("");
    setSending(true);

    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: activeContact.phone,
          message: newMessage.text,
          channel: channel,
        }),
      });
    } catch (e) {
      console.error("Erreur d'envoi", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex h-[700px]">
      
      {/* ── COLONNE GAUCHE : CONTACTS ── */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-100 border-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 pl-9 pr-4 text-sm outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setActiveContactId(contact.id)}
              className={cn(
                "p-4 border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-100",
                activeContactId === contact.id ? "bg-blue-50/50 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-900">{contact.name}</span>
                <span className="text-xs text-slate-500">{contact.time}</span>
              </div>
              <p className="text-sm text-slate-500 truncate">{contact.lastMessage}</p>
            </div>
          ))}
          {filteredContacts.length === 0 && (
            <p className="p-4 text-sm text-slate-500 text-center">Aucun contact trouvé.</p>
          )}
        </div>
      </div>

      {/* ── COLONNE DROITE : CONVERSATION ── */}
      <div className="w-2/3 flex flex-col bg-white">
        {activeContact ? (
          <>
            {/* Header de la conversation */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{activeContact.name}</h3>
                <p className="text-xs text-slate-500">{activeContact.phone}</p>
              </div>
            </div>

            {/* Zone de messages */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/30 space-y-4">
              {activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[75%]",
                    msg.sender === "Moi" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl shadow-sm",
                      msg.sender === "Moi" 
                        ? "bg-blue-600 text-white rounded-br-sm" 
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    )}
                  >
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                    <span>{msg.time}</span>
                    {msg.sender === "Moi" && msg.channel === "whatsapp" && <MessageCircle className="h-3 w-3" />}
                    {msg.sender === "Moi" && msg.channel === "sms" && <MessageSquare className="h-3 w-3" />}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-4 bg-slate-100 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 border border-transparent transition-all">
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Message via ${channel === "whatsapp" ? "WhatsApp" : "SMS"}...`}
                  className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-slate-800 placeholder:text-slate-400"
                />
                
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !inputText.trim()}
                  className="h-10 w-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-colors shadow-md shadow-blue-500/20"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
