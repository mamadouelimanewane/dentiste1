"use client";

import React, { useEffect, useState } from "react";
import { Shield, Plus, X, Trash2, Save, Stethoscope, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULES, type ModulePermissions } from "@/lib/modules";

interface RoleRow {
  id: string;
  slug: string;
  label: string;
  is_system: boolean;
  is_practitioner: boolean;
  manage_roles: boolean;
  permissions: ModulePermissions;
}

function emptyPermissions(): ModulePermissions {
  return {};
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function RoleManager() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement.");
      setRoles(data.roles);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({
      id: "",
      slug: "",
      label: "",
      is_system: false,
      is_practitioner: false,
      manage_roles: false,
      permissions: emptyPermissions(),
    });
    setShowEditor(true);
  };

  const openEdit = (role: RoleRow) => {
    setEditing({ ...role, permissions: { ...role.permissions } });
    setShowEditor(true);
  };

  const togglePermission = (moduleId: number, action: "view" | "manage") => {
    if (!editing) return;
    const key = String(moduleId);
    const current = editing.permissions[key] || {};
    const nextValue = !current[action];
    const next = { ...current, [action]: nextValue };
    // Activer "gérer" implique au moins "voir" ; désactiver "voir" retire aussi "gérer".
    if (action === "manage" && nextValue) next.view = true;
    if (action === "view" && !nextValue) next.manage = false;
    setEditing({ ...editing, permissions: { ...editing.permissions, [key]: next } });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      if (editing.id) {
        const res = await fetch(`/api/admin/roles/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: editing.label,
            isPractitioner: editing.is_practitioner,
            manageRoles: editing.manage_roles,
            permissions: editing.permissions,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur de mise à jour.");
      } else {
        const res = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slugify(editing.label),
            label: editing.label,
            isPractitioner: editing.is_practitioner,
            manageRoles: editing.manage_roles,
            permissions: editing.permissions,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur de création.");
      }
      setShowEditor(false);
      setEditing(null);
      load();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role: RoleRow) => {
    if (!confirm(`Supprimer le rôle "${role.label}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/roles/${role.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de suppression.");
      load();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm p-3">{errorMsg}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-[#0F172A] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Rôles & Privilèges</h3>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Nouveau rôle
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {!loading && roles.length === 0 && (
            <p className="p-8 text-center text-slate-400 text-xs">Aucun rôle configuré.</p>
          )}
          {roles.map((role) => {
            const moduleCount = Object.values(role.permissions).filter((p) => p.view || p.manage).length;
            return (
              <div key={role.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {role.label}
                      {role.is_system && (
                        <span className="text-[8px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Système</span>
                      )}
                      {role.manage_roles && (
                        <span title="Peut gérer les rôles" className="text-amber-500">
                          <KeyRound className="h-3.5 w-3.5" />
                        </span>
                      )}
                      {role.is_practitioner && (
                        <span title="Apparaît comme praticien dans l'agenda" className="text-blue-500">
                          <Stethoscope className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{moduleCount} module{moduleCount > 1 ? "s" : ""} accessible{moduleCount > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(role)}
                    className="px-3 py-1.5 text-[9px] font-bold uppercase text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors border border-slate-200"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => remove(role)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors border border-slate-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showEditor && editing && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                {editing.id ? "Modifier le rôle" : "Nouveau rôle"}
              </h3>
              <button onClick={() => { setShowEditor(false); setEditing(null); }} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom du rôle</label>
                <input
                  required
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  placeholder="Ex : Assistante Junior"
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.is_practitioner}
                    onChange={(e) => setEditing({ ...editing, is_practitioner: e.target.checked })}
                  />
                  Apparaît comme praticien dans l'agenda
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.manage_roles}
                    onChange={(e) => setEditing({ ...editing, manage_roles: e.target.checked })}
                  />
                  Peut gérer les rôles & privilèges
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Privilèges par module</label>
                <div className="border border-slate-200 rounded-sm overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Module</th>
                        <th className="p-2.5 text-center w-20">Voir</th>
                        <th className="p-2.5 text-center w-20">Gérer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MODULES.map((m) => {
                        const entry = editing.permissions[String(m.id)] || {};
                        return (
                          <tr key={m.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-700">{m.label}</td>
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={!!(entry.view || entry.manage)}
                                disabled={!!entry.manage}
                                onChange={() => togglePermission(m.id, "view")}
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={!!entry.manage}
                                onChange={() => togglePermission(m.id, "manage")}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={save}
                disabled={saving || !editing.label}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold py-2 rounded transition-colors"
              >
                <Save className="h-4 w-4" /> {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
