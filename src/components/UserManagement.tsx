"use client";

import React, { useEffect, useState } from "react";
import { Users, UserPlus, Shield, CheckCircle2, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "admin" | "praticien" | "accueil" | "comptable";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrateur",
  praticien: "Praticien",
  accueil: "Accueil",
  comptable: "Comptable",
};

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-amber-50 text-amber-700 border-amber-200",
  praticien: "bg-blue-50 text-blue-700 border-blue-200",
  accueil: "bg-purple-50 text-purple-700 border-purple-200",
  comptable: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", fullName: "", role: "accueil" as Role });
  const [inviting, setInviting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement.");
      setUsers(data.users);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'invitation.");
      setShowInvite(false);
      setInviteForm({ email: "", fullName: "", role: "accueil" });
      loadUsers();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setInviting(false);
    }
  };

  const updateUser = async (userId: string, updates: { role?: Role; isActive?: boolean }) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...updates }),
    });
    if (res.ok) loadUsers();
  };

  const activeCount = users.filter((u) => u.is_active).length;
  const roleCount = new Set(users.map((u) => u.role)).size;

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm p-3">{errorMsg}</div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Utilisateurs Actifs</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{loading ? "…" : activeCount}</p>
            </div>
            <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rôles Configurés</p>
              <p className="text-2xl font-black text-slate-900 mt-2">{loading ? "…" : roleCount}</p>
            </div>
            <div className="h-8 w-8 rounded bg-emerald-50 flex items-center justify-center">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-[#1E3A8A] hover:bg-blue-900 p-5 rounded-sm border border-blue-800 shadow-sm transition-all flex flex-col justify-center items-center gap-2 group text-white"
        >
          <UserPlus className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Nouveau Collaborateur</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#0F172A] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Annuaire des Accès & Privilèges</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4">Utilisateur</th>
                <th className="p-4">Rôle / Profil</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                    Aucun utilisateur. Invitez votre premier collaborateur.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className={cn("hover:bg-slate-50 transition-colors", !user.is_active && "opacity-60 bg-slate-50/50")}>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 text-xs">{user.full_name}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-0.5">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value as Role })}
                      className={cn(
                        "px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border cursor-pointer",
                        ROLE_BADGE[user.role]
                      )}
                    >
                      {Object.entries(ROLE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-center">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300" /> Inactif
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => updateUser(user.id, { isActive: !user.is_active })}
                      className="px-2 py-1 text-[9px] font-bold uppercase text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors border border-slate-200"
                    >
                      {user.is_active ? "Désactiver" : "Réactiver"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Nouveau Collaborateur</h3>
              <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom complet</label>
                <input
                  required
                  value={inviteForm.fullName}
                  onChange={(e) => setInviteForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input
                  required
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rôle</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold py-2 rounded transition-colors"
              >
                {inviting ? "Envoi de l'invitation…" : "Inviter"}
              </button>
              <p className="text-[10px] text-slate-400 text-center">
                Un email d'invitation Supabase sera envoyé pour définir le mot de passe.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
