"use client";

import React, { createContext, useContext } from "react";
import { signOut as signOutAction } from "@/app/login/actions";
import type { ModulePermissions } from "@/lib/modules";

export type Role = string;

interface AuthUser {
  id: string;
  fullName: string;
  role: Role;
  roleLabel: string;
  permissions: ModulePermissions;
  manageRoles: boolean;
  // Le rôle est-il un rôle de soin ? Un administrateur ou un comptable a
  // accès à l'écran d'ordonnance, mais ne prescrit pas.
  isPractitioner: boolean;
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
