"use client";

import React, { useState, useMemo } from "react";
import { Search, User, Phone, Calendar, ChevronRight, Filter, FolderOpen, ArrowUpRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";

// Mock Database of Patients
const MOCK_PATIENTS = [
  { id: "SN-45892-X", name: "Mamadou Diallo", phone: "+221 77 123 45 67", lastVisit: "12/04/2026", nextVisit: "15/05/2026", status: "Traitement en cours" },
  { id: "SN-98214-A", name: "Aïssatou Sow", phone: "+221 76 987 65 43", lastVisit: "Aujourd'hui", nextVisit: "Non planifié", status: "Terminé" },
  { id: "SN-11234-B", name: "Ousmane Gueye", phone: "+221 70 456 12 89", lastVisit: "24/03/2026", nextVisit: "28/04/2026", status: "En attente" },
  { id: "SN-55678-C", name: "Mariama Ba", phone: "+221 78 333 22 11", lastVisit: "10/01/2026", nextVisit: "Non planifié", status: "Rappel requis" },
  { id: "SN-33445-D", name: "Jean-Pierre Badji", phone: "+221 77 555 44 33", lastVisit: "05/04/2026", nextVisit: "02/05/2026", status: "Traitement en cours" },
  { id: "SN-77889-E", name: "Fatou Diop", phone: "+221 76 111 22 33", lastVisit: "22/02/2026", nextVisit: "Non planifié", status: "Terminé" },
];

export function PatientDirectory() {
  const { setCurrentPatient } = usePatient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tous");

  // Indexing and Search Engine
  const filteredPatients = useMemo(() => {
    return MOCK_PATIENTS.filter(patient => {
      const matchesSearch = 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery);
      
      const matchesFilter = filterStatus === "Tous" || patient.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterStatus]);

  const openPatientFile = (patient: any) => {
    // Populate the global context so other modules can use this patient
    setCurrentPatient({
      name: patient.name,
      idNumber: patient.id,
      phone: patient.phone,
      birthDate: "",
      address: ""
    });
    alert(`Dossier de ${patient.name} chargé en mémoire. Vous pouvez basculer vers les autres modules.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <FolderOpen className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Dossiers Patients</h2>
            <div className="flex items-center gap-2">
              <Search className="h-3 w-3 text-amber-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recherche & Indexation</p>
            </div>
          </div>
        </div>
        
        {/* BIG SEARCH BAR */}
        <div className="flex items-center gap-2 w-full md:w-96 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-sm shadow-inner transition-all focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, ID (Ex: SN-...) ou téléphone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs font-bold outline-none w-full placeholder:text-slate-400 text-slate-900" 
          />
        </div>
      </div>

      <div className="bg-[#0F172A] text-white p-6 rounded-sm flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-8 w-full">
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-widest text-amber-400">Base de Données Centralisée</h3>
            <p className="text-slate-300 text-xs font-medium">Indexation ultra-rapide de tous les dossiers médicaux du cabinet.</p>
          </div>
          <div className="hidden md:flex gap-6 border-l border-slate-700 pl-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Patients</p>
              <p className="text-2xl font-black text-white">{MOCK_PATIENTS.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">En cours</p>
              <p className="text-2xl font-black text-amber-400">2</p>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/20 to-transparent" />
        <User className="absolute -right-4 -top-4 h-32 w-32 text-amber-500 opacity-20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* FILTERS */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700 mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-500" /> Filtrer les dossiers
            </h4>
            <div className="space-y-2">
              {["Tous", "Traitement en cours", "En attente", "Rappel requis", "Terminé"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                    filterStatus === status ? "bg-blue-50 text-blue-700 border border-blue-200" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-sm shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="text-slate-900 font-black">{filteredPatients.length}</span> patient(s) trouvé(s)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 hover:border-amber-300 transition-colors group flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{patient.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{patient.id}</p>
                    </div>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                      patient.status === "Traitement en cours" ? "bg-amber-100 text-amber-700" :
                      patient.status === "En attente" ? "bg-blue-100 text-blue-700" :
                      patient.status === "Rappel requis" ? "bg-rose-100 text-rose-700" :
                      "bg-emerald-100 text-emerald-700"
                    )}>
                      {patient.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Phone className="h-3.5 w-3.5 text-slate-400" /> {patient.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" /> Dernier RV : {patient.lastVisit}
                    </div>
                  </div>

                  <button 
                    onClick={() => openPatientFile(patient)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-[#1E3A8A] text-slate-700 hover:text-white border border-slate-200 hover:border-[#1E3A8A] px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all group-hover:shadow-md"
                  >
                    Ouvrir le Dossier <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-slate-50 border border-slate-200 border-dashed rounded-sm p-12 text-center flex flex-col items-center">
                <Search className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Aucun patient trouvé</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Modifiez vos critères de recherche ou de filtre.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
