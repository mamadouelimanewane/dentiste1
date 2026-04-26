"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  UserPlus, 
  LogIn, 
  Stethoscope, 
  Activity, 
  FileText, 
  History,
  CheckCircle2
} from "lucide-react";

const phases = [
  { id: 1, name: "Accueil", icon: UserPlus, color: "bg-blue-500" },
  { id: 2, name: "Arrivée", icon: LogIn, color: "bg-cyan-500" },
  { id: 3, name: "Consultation", icon: Stethoscope, color: "bg-indigo-500" },
  { id: 4, name: "Réalisation", icon: Activity, color: "bg-purple-500" },
  { id: 5, name: "Administration", icon: FileText, color: "bg-pink-500" },
  { id: 6, name: "Suivi", icon: History, color: "bg-emerald-500" },
];

interface PatientJourneyStepperProps {
  currentPhase: number;
  className?: string;
}

export function PatientJourneyStepper({ currentPhase, className }: PatientJourneyStepperProps) {
  return (
    <div className={cn("w-full py-4 px-6", className)}>
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-200" />
        <div 
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-500" 
          style={{ width: `${((currentPhase - 1) / (phases.length - 1)) * 100}%` }}
        />

        {phases.map((phase) => {
          const Icon = phase.icon;
          const isActive = phase.id === currentPhase;
          const isCompleted = phase.id < currentPhase;

          return (
            <div key={phase.id} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl border-4 transition-all duration-300",
                  isActive 
                    ? "border-blue-600 bg-white text-blue-600 scale-110 shadow-lg" 
                    : isCompleted
                    ? "border-transparent bg-blue-600 text-white"
                    : "border-slate-100 bg-white text-slate-300"
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
              </div>
              <span className={cn("mt-2 text-[10px] font-bold uppercase", isActive ? "text-blue-600" : "text-slate-400")}>
                {phase.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
