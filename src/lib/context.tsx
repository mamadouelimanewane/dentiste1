"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Patient {
  id: string;
  name: string;
  birthDate: string;
  phone: string;
  idNumber: string;
  address: string;
  allergies?: string;
  mutuelle?: string;
}

interface PatientContextType {
  currentPatient: Patient | null;
  setCurrentPatient: (patient: Patient | null) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function mapDbPatientToContext(row: {
  id: string;
  full_name: string;
  birth_date: string | null;
  phone: string | null;
  dossier_number: string;
  address: string | null;
  allergies?: string | null;
  mutuelle?: string | null;
}): Patient {
  return {
    id: row.id,
    name: row.full_name,
    birthDate: row.birth_date || "",
    phone: row.phone || "",
    idNumber: row.dossier_number,
    address: row.address || "",
    allergies: row.allergies || "",
    mutuelle: row.mutuelle || "",
  };
}

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [currentPatient, setCurrentPatientState] = useState<Patient | null>(null);

  useEffect(() => {
    const savedId = localStorage.getItem("dentiste_lite_patient_id");
    if (!savedId) return;
    fetch(`/api/patients/${savedId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.patient) setCurrentPatientState(mapDbPatientToContext(data.patient));
      })
      .catch(() => {});
  }, []);

  const setCurrentPatient = (patient: Patient | null) => {
    setCurrentPatientState(patient);
    if (patient) {
      localStorage.setItem("dentiste_lite_patient_id", patient.id);
    } else {
      localStorage.removeItem("dentiste_lite_patient_id");
    }
  };

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
