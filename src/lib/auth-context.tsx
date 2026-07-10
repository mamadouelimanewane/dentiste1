"use client";

import React, { createContext, useContext } from "react";
import { signOut as signOutAction } from "@/app/login/actions";

export type Role = "admin" | "praticien" | "accueil" | "comptable";

interface AuthUser {
  id: string;
  fullName: string;
  role: Role;
}

interface AuthContextType {
  user: AuthUser;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ user, signOut: () => signOutAction() }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
