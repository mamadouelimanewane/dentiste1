"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Search, ChevronLeft, ChevronRight, CheckCircle2, UserPlus, ListTodo, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";

export function AgendaModule() {
  const [activeTab, setActiveTab] = useState<"Agenda" | "Attente" | "Staff">("Agenda");

  const quickPatients = [
    "Jean-Pierre Badji",
    "Mamadou Dia",
    "Awa Fall",
    "Ousmane Gueye",
    "Mariama Sow"
  ];

  const days = [
    { name: "lun", date: "27", isToday: true },
    { name: "mar", date: "28", isToday: false },
    { name: "mer", date: "29", isToday: false },
    { name: "jeu", date: "30", isToday: false },
    { name: "ven", date: "1", isToday: false },
    { name: "sam", date: "2", isToday: false },
    { name: "dim", date: "3", isToday: false },
  ];

  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER BAR - DASHBOARD STYLE */}
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
            <input type="text" placeholder="Rechercher un module, patient..." className="bg-transparent border-none text-[10px] font-bold uppercase outline-none w-48" />
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-900">22:12</p>
              <p className="text-[9px] font-bold text-blue-600 uppercase">Secrétariat</p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xs">
              SEC
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">

          {/* Quick Access List */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-[#0F172A] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Accès Rapide</h4>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {quickPatients.map((patient, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 group transition-colors">
                  <span className="text-xs font-bold text-slate-700">{patient}</span>
                  <span
                    title="Recherchez ce patient depuis le module Recherche pour ouvrir son vrai dossier"
                    className="h-6 w-6 rounded bg-slate-100 text-slate-300 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </div>
              ))}
              <div className="p-4 text-center">
                <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Voir toute la liste</button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 flex flex-col items-center text-center justify-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Volume Hebdo</p>
              <div className="flex items-end gap-1 text-blue-900">
                <span className="text-2xl font-black">0</span>
                <span className="text-[10px] font-bold mb-1">RDV</span>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 flex flex-col items-center text-center justify-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Base</p>
              <div className="flex items-end gap-1 text-emerald-600">
                <span className="text-2xl font-black">8</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CALENDAR */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col h-[700px]">
          {/* Calendar Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-sm shadow-sm px-2 py-1">
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-sm font-black text-slate-900 uppercase min-w-[100px] text-center">avr. 2026</span>
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex gap-2 bg-white border border-slate-200 rounded-sm p-1 shadow-sm">
              {["Agenda", "Attente", "Staff"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all",
                    activeTab === tab ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-sm text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-blue-900/20">
              <Plus className="h-4 w-4" /> Réserver
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
            {/* Days Header */}
            <div className="flex border-b border-slate-200 bg-white">
              <div className="w-16 flex-shrink-0 border-r border-slate-200" /> {/* Time column header */}
              {days.map((day, idx) => (
                <div key={idx} className={cn("flex-1 py-3 text-center border-r border-slate-200 last:border-r-0 flex flex-col items-center gap-1", day.isToday ? "bg-blue-50/50" : "")}>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", day.isToday ? "text-blue-600" : "text-slate-400")}>{day.name}</span>
                  <span className={cn("text-lg font-black", day.isToday ? "text-blue-700" : "text-slate-800")}>{day.date}</span>
                  {day.isToday && <div className="h-1 w-1 rounded-full bg-blue-600 mt-1" />}
                </div>
              ))}
            </div>

            {/* Time Grid (Scrollable) */}
            <div className="flex-1 overflow-y-auto relative">
              {/* Background grid lines */}
              <div className="absolute inset-0 flex flex-col">
                {hours.map(h => (
                  <div key={h} className="h-20 border-b border-slate-100 w-full" />
                ))}
              </div>
              
              <div className="absolute inset-0 flex">
                <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-white relative z-10">
                  {hours.map(h => (
                    <div key={h} className="h-20 border-b border-slate-100 flex items-start justify-center pt-2">
                      <span className="text-[10px] font-bold text-slate-400">{h}:00</span>
                    </div>
                  ))}
                </div>
                
                {days.map((day, idx) => (
                  <div key={idx} className={cn("flex-1 border-r border-slate-100 last:border-r-0 relative group", day.isToday ? "bg-blue-50/20" : "")}>
                    {/* Hover state for easy booking */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none flex flex-col">
                       {hours.map(h => (
                          <div key={`h-${h}`} className="h-20 border-b border-transparent flex items-center justify-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100/50 flex items-center justify-center">
                              <Plus className="h-4 w-4 text-blue-400" />
                            </div>
                          </div>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Current Time Indicator line (Mock for Today) */}
              <div className="absolute left-16 right-0 top-[260px] h-[2px] bg-red-400 z-20 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
              <div className="absolute left-14 top-[256px] h-2 w-2 rounded-full bg-red-500 z-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
