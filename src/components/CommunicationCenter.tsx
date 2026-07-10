"use client";

import React, { useState } from "react";
import { Inbox, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppIntelligentHub } from "@/components/WhatsAppIntelligentHub";
import { CommunicationHub } from "@/components/CommunicationHub";

export function CommunicationCenter() {
  const [tab, setTab] = useState<"inbox" | "composer">("inbox");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-sm shadow-sm w-fit">
        <button
          onClick={() => setTab("inbox")}
          className={cn(
            "flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
            tab === "inbox" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <Inbox className="h-4 w-4" /> Boîte de réception
        </button>
        <button
          onClick={() => setTab("composer")}
          className={cn(
            "flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm",
            tab === "composer" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
          )}
        >
          <SendHorizontal className="h-4 w-4" /> Composer & Automatisation
        </button>
      </div>

      {tab === "inbox" ? <WhatsAppIntelligentHub /> : <CommunicationHub />}
    </div>
  );
}
