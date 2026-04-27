"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Patient {
  name: string;
  birthDate: string;
  phone: string;
  idNumber: string;
  address: string;
}

interface PatientContextType {
  currentPatient: Patient | null;
  setCurrentPatient: (patient: Patient | null) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("dentiste_lite_patient");
    if (saved) {
      setCurrentPatient(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (currentPatient) {
      localStorage.setItem("dentiste_lite_patient", JSON.stringify(currentPatient));
    } else {
      localStorage.removeItem("dentiste_lite_patient");
    }
  }, [currentPatient]);

  return (
    <PatientContext.Provider value={{ currentPatient, setCurrentPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error("usePatient must be used within a PatientProvider");
  }
  return context;
}
