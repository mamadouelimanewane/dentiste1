"use client";

import React, { useEffect, useState } from "react";
import { X, LogIn, ShieldAlert, Activity, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface Connexion {
  id: string;
  ip: string | null;
  success: boolean;
  user_agent: string | null;
  created_at: string;
}

interface ActionLog {
  id: string;
  action: string;
  entity_table: string | null;
  entity_id: string | null;
  meta: unknown;
  created_at: string;
}

interface Activite {
  utilisateur: { full_name: string; email: string; role_label: string | null; created_at: string };
  retentionJours: number;
  stats: {
    reussies: number;
    echouees: number;
    derniere_reussie: string | null;
    derniere_echouee: string | null;
    adresses_distinctes: number;
  };
  connexions: Connexion[];
  actions: ActionLog[];
}

// Résume le navigateur et le système à partir du user-agent, sans prétendre
// identifier la machine : c'est une indication, pas une preuve.
function posteLisible(ua: string | null) {
  if (!ua) return "Poste inconnu";
  const nav =
    /Edg\//.test(ua) ? "Edge" :
    /Chrome\//.test(ua) && !/Edg\//.test(ua) ? "Chrome" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Safari\//.test(ua) && !/Chrome\//.test(ua) ? "Safari" : "Navigateur";
  const os =
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad/.test(ua) ? "iOS" :
    /Windows/.test(ua) ? "Windows" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" : "";
  return os ? `${nav} · ${os}` : nav;
}

const dateHeure = (v: string | null) =>
  v ? new Date(v).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

export function UserActivityPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<Activite | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<"connexions" | "actions">("connexions");

  useEffect(() => {
    let annule = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}/activity`);
        const d = await res.json();
        if (annule) return;
        if (!res.ok) setErreur(d.error || "Historique indisponible.");
        else setData(d);
      } catch {
        if (!annule) setErreur("Historique indisponible.");
      } finally {
        if (!annule) setLoading(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Historique &amp; audit
            </h3>
            {data && (
              <p className="text-xs text-slate-500 mt-1">
                {data.utilisateur.full_name} — {data.utilisateur.email}
                {data.utilisateur.role_label ? ` · ${data.utilisateur.role_label}` : ""}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading && <p className="p-8 text-center text-sm text-slate-400">Chargement...</p>}
        {erreur && <p className="p-8 text-center text-sm text-rose-600">{erreur}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-slate-50 border-b border-slate-100">
              {[
                { label: "Connexions réussies", valeur: String(data.stats.reussies), icone: LogIn, couleur: "text-emerald-600" },
                { label: "Échecs", valeur: String(data.stats.echouees), icone: ShieldAlert, couleur: data.stats.echouees > 0 ? "text-amber-600" : "text-slate-400" },
                { label: "Dernière connexion", valeur: dateHeure(data.stats.derniere_reussie), icone: Activity, couleur: "text-slate-700" },
                { label: "Adresses IP distinctes", valeur: String(data.stats.adresses_distinctes), icone: Monitor, couleur: "text-slate-700" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-sm p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icone className={cn("h-3.5 w-3.5", s.couleur)} />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
                  </div>
                  <p className={cn("text-xs font-black", s.couleur)}>{s.valeur}</p>
                </div>
              ))}
            </div>

            <div className="flex border-b border-slate-200 bg-white">
              {([
                ["connexions", `Connexions (${data.connexions.length})`],
                ["actions", `Actions enregistrées (${data.actions.length})`],
              ] as const).map(([id, libelle]) => (
                <button
                  key={id}
                  onClick={() => setOnglet(id)}
                  className={cn(
                    "px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all",
                    onglet === id ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
                  )}
                >
                  {libelle}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {onglet === "connexions" ? (
                data.connexions.length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400">
                    Aucune connexion enregistrée pour ce compte.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Résultat</th>
                        <th className="px-4 py-2.5">Adresse IP</th>
                        <th className="px-4 py-2.5">Poste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.connexions.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-slate-700">{dateHeure(c.created_at)}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                c.success ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                              )}
                            >
                              {c.success ? "Réussie" : "Échec"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{c.ip || "—"}</td>
                          <td className="px-4 py-2.5 text-slate-600">{posteLisible(c.user_agent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : data.actions.length === 0 ? (
                <p className="p-8 text-center text-xs text-slate-400">
                  Aucune action d&apos;administration enregistrée pour ce compte.
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Action</th>
                      <th className="px-4 py-2.5">Élément</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.actions.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{dateHeure(a.created_at)}</td>
                        <td className="px-4 py-2.5 font-bold text-slate-900">{a.action}</td>
                        <td className="px-4 py-2.5 text-slate-500">{a.entity_table || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Les connexions réussies sont conservées {data.retentionJours} jours, les échecs 30 jours.
                Le poste est déduit du navigateur : c&apos;est une indication, pas une identification certaine.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
