"use client";

import React, { useState } from "react";
import { Video, PhoneCall, Star, Clock, Users, Activity, FileText, Pill, Save, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Teleconsultation() {
  const [activeTab, setActiveTab] = useState<'avenir' | 'historique'>('avenir');

  const upcomingAppointments = [
    { initials: "AD", name: "Amadou Diallo", type: "Consultation", duration: "30 min", time: "14:00", color: "bg-blue-100 text-blue-700" },
    { initials: "FM", name: "Fatou Mbaye", type: "Suivi Post-Op", duration: "20 min", time: "14:45", color: "bg-purple-100 text-purple-700" },
    { initials: "IS", name: "Ibrahima Sow", type: "Urgence", duration: "45 min", time: "15:30", color: "bg-rose-100 text-rose-700" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sessions ce mois</p>
            <p className="text-xl font-black text-slate-900">47</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patients consultés</p>
            <p className="text-xl font-black text-slate-900">38</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Durée moyenne</p>
            <p className="text-xl font-black text-slate-900">28 min</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded flex items-center justify-center">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Satisfaction</p>
            <p className="text-xl font-black text-slate-900">4.9/5</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Teleconsult Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Screen */}
          <div className="bg-slate-900 aspect-video rounded-sm flex items-center justify-center relative overflow-hidden border border-slate-800 shadow-lg">
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Live Connect</span>
            </div>
            
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <Video className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">Aucune session active</h3>
                <p className="text-xs text-slate-400 mt-1">Démarrez une session ou rejoignez un patient en attente</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-sm text-xs font-bold tracking-widest uppercase transition-all shadow-md shadow-blue-900/50">
                Démarrer maintenant
              </button>
            </div>
          </div>

          {/* Notes & Actions */}
          <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">Notes de Session</h4>
            </div>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors min-h-[120px] resize-none"
              placeholder="Notez vos observations cliniques, prescriptions, recommandations..."
            ></textarea>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors">
                <Save className="h-3 w-3" /> Sauvegarder
              </button>
              <button className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors">
                <Pill className="h-3 w-3" /> Générer Ordonnance
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Appointments */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col h-full">
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('avenir')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2",
                activeTab === 'avenir' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"
              )}
            >
              À venir
            </button>
            <button 
              onClick={() => setActiveTab('historique')}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border-b-2",
                activeTab === 'historique' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:bg-slate-50"
              )}
            >
              Historique
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {activeTab === 'avenir' && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">En attente</p>
                {upcomingAppointments.map((apt, idx) => (
                  <div key={idx} className="border border-slate-100 rounded p-3 hover:border-slate-300 transition-all bg-white group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-8 w-8 rounded flex items-center justify-center text-xs font-black", apt.color)}>
                          {apt.initials}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{apt.name}</p>
                          <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                            {apt.type} • {apt.duration}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-blue-900 tracking-tighter">{apt.time}</p>
                      </div>
                    </div>
                    <button className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all">
                      <PhoneCall className="h-3 w-3" /> Rejoindre
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'historique' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-400 py-10">
                <Clock className="h-8 w-8 opacity-50" />
                <p className="text-xs font-medium">L'historique des consultations apparaîtra ici.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
