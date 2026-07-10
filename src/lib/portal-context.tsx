"use client";

import React, { createContext, useContext } from "react";

interface PortalPatient {
  id: string;
  full_name: string;
  phone: string | null;
  dossier_number: string;
}

const PortalPatientContext = createContext<PortalPatient | undefined>(undefined);

export function PortalPatientProvider({
  patient,
  children,
}: {
  patient: PortalPatient;
  children: React.ReactNode;
}) {
  return <PortalPatientContext.Provider value={patient}>{children}</PortalPatientContext.Provider>;
}

export function usePortalPatient() {
  const ctx = useContext(PortalPatientContext);
  if (!ctx) throw new Error("usePortalPatient must be used within a PortalPatientProvider");
  return ctx;
}
