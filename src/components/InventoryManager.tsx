"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Package, AlertTriangle, Plus, Search, Box, AlertCircle, CheckCircle2, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  ref: string | null;
  name: string;
  category: string;
  quantity: number;
  min_threshold: number;
  unit_price: number;
}

function formatFcfa(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} F`;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Toutes");
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const [formOuvert, setFormOuvert] = useState(false);
  const [creation, setCreation] = useState(false);
  const [nouvNom, setNouvNom] = useState("");
  const [nouvCategorie, setNouvCategorie] = useState("");
  const [nouvQte, setNouvQte] = useState("");
  const [nouvSeuil, setNouvSeuil] = useState("");
  const [nouvPrix, setNouvPrix] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/inventory")
      .then(async (res) => {
        const d = await res.json();
        // `res.ok` n'était pas vérifié : une erreur serveur renvoyait un objet
        // sans `items`, donc un stock vide indiscernable d'un stock réellement
        // épuisé. Le cabinet aurait pu recommander ce qu'il a déjà.
        if (!res.ok) throw new Error(d?.error || "Stock non chargé.");
        return d;
      })
      .then((data) => {
        setItems(data.items || []);
        setError(null);
      })
      .catch(() => setError("Stock non chargé : ne commandez rien avant d'avoir rechargé cet écran."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const adjustQuantity = async (id: string, delta: number) => {
    setAdjusting(id);
    setError(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantityDelta: delta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'ajustement.");
      setItems((prev) => prev.map((i) => (i.id === id ? data.item : i)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setAdjusting(null);
    }
  };

  // Création d'un article. La route POST existait et était validée, mais
  // aucun écran ne l'appelait : le cabinet ne pouvait pas référencer un
  // nouveau consommable, alors qu'il en achète en permanence. Le stock était
  // donc figé sur les articles d'origine.
  const ajouterArticle = async () => {
    setError(null);
    setCreation(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nouvNom.trim(),
          category: nouvCategorie.trim() || "Divers",
          quantity: Number(nouvQte) || 0,
          minThreshold: Number(nouvSeuil) || 0,
          unitPrice: Number(nouvPrix) || 0,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Création impossible.");
      setNouvNom(""); setNouvCategorie(""); setNouvQte(""); setNouvSeuil(""); setNouvPrix("");
      setFormOuvert(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setCreation(false);
    }
  };

  const categories = ["Toutes", ...Array.from(new Set(items.map((i) => i.category)))];
  const filtered = items.filter((i) => {
    const matchCategory = category === "Toutes" || i.category === category;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.ref || "").toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const valeurStock = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const articlesReferences = items.length;
  const alertesRupture = items.filter((i) => i.quantity <= i.min_threshold).length;
  const quantiteTotale = items.reduce((s, i) => s + i.quantity, 0);

  function statusOf(i: InventoryItem): "out" | "low" | "ok" {
    if (i.quantity === 0) return "out";
    if (i.quantity <= i.min_threshold) return "low";
    return "ok";
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <Package className="h-6 w-6 text-fuchsia-400" />
          </div>
          <div>
            {/* Redisait « Stock du cabinet », déjà en titre de page. */}
            <h2 className="text-sm font-bold text-slate-900">Inventaire</h2>
            <div className="flex items-center gap-2">
              <Box className="h-3 w-3 text-fuchsia-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{articlesReferences} article(s) référencé(s)</p>
            </div>
          </div>
          <button
            onClick={() => setFormOuvert((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <Plus className="h-4 w-4" />
            {formOuvert ? "Annuler" : "Nouvel article"}
          </button>
        </div>

        {/* Référencer un consommable. Cette possibilité manquait : le stock
            restait figé sur les articles d'origine alors qu'un cabinet en
            achète de nouveaux en permanence. */}
        {formOuvert && (
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Nom de l&apos;article</label>
                <input
                  value={nouvNom}
                  onChange={(e) => setNouvNom(e.target.value)}
                  placeholder="Ex : Gants nitrile taille M"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Catégorie</label>
                <input
                  value={nouvCategorie}
                  onChange={(e) => setNouvCategorie(e.target.value)}
                  placeholder="Consommables"
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Quantité</label>
                <input
                  type="number" min={0}
                  value={nouvQte}
                  onChange={(e) => setNouvQte(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Seuil d&apos;alerte</label>
                <input
                  type="number" min={0}
                  value={nouvSeuil}
                  onChange={(e) => setNouvSeuil(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-40">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">Prix unitaire (F)</label>
                <input
                  type="number" min={0}
                  value={nouvPrix}
                  onChange={(e) => setNouvPrix(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-sm text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={ajouterArticle}
                disabled={creation || !nouvNom.trim()}
                className="h-10 px-5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-colors"
              >
                {creation ? "Enregistrement…" : "Référencer l'article"}
              </button>
              <p className="text-[10px] text-slate-400">
                Le seuil d&apos;alerte déclenche l&apos;avertissement « stock bas ».
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3">{error}</div>}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Valeur du Stock", value: formatFcfa(valeurStock), icon: Package, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Articles Référencés", value: String(articlesReferences), icon: Box, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Alertes Stock Bas", value: String(alertesRupture), icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", alert: alertesRupture > 0 },
          { label: "Quantité Totale", value: String(quantiteTotale), icon: Box, color: "text-indigo-500", bg: "bg-indigo-50" },
        ].map((kpi, i) => (
          <div key={i} className={cn("bg-white border p-5 rounded-sm shadow-sm flex flex-col justify-center relative overflow-hidden", kpi.alert ? "border-amber-200" : "border-slate-200")}>
            {kpi.alert && <div className="absolute top-0 right-0 h-full w-1 bg-amber-400" />}
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded", kpi.bg)}>
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
            </div>
            <span className="text-2xl font-black text-slate-900">{kpi.value}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{kpi.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm">
        <div className="flex justify-between items-center p-3 border-b border-slate-200 flex-wrap gap-4">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all whitespace-nowrap",
                  category === c ? "bg-fuchsia-50 text-fuchsia-700" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-sm w-full md:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par ref ou nom..."
              className="bg-transparent border-none text-[10px] font-bold outline-none w-full uppercase"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                <th className="p-4">Réf.</th>
                <th className="p-4">Désignation</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4 text-right">Stock Actuel</th>
                <th className="p-4 text-center">Statut</th>
                <th className="p-4 text-right">Ajuster</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="p-6 text-center text-xs text-slate-400">Chargement...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-xs text-slate-400">Aucun article.</td></tr>
              )}
              {filtered.map((item) => {
                const s = statusOf(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-xs font-bold text-slate-500">{item.ref || "—"}</td>
                    <td className="p-4">
                      <p className="text-sm font-black text-slate-900">{item.name}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "text-sm font-black",
                          s === 'out' ? "text-rose-600" : s === 'low' ? "text-amber-500" : "text-slate-900"
                        )}>
                          {item.quantity}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min: {item.min_threshold}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {s === 'ok' && <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest"><CheckCircle2 className="h-3 w-3" /> En Stock</span>}
                      {s === 'low' && <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest"><AlertTriangle className="h-3 w-3" /> Bas</span>}
                      {s === 'out' && <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest"><AlertCircle className="h-3 w-3" /> Rupture</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          disabled={adjusting === item.id || item.quantity === 0}
                          onClick={() => adjustQuantity(item.id, -1)}
                          className="h-7 w-7 flex items-center justify-center rounded bg-slate-50 border border-slate-200 hover:bg-slate-200 text-slate-500 disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={adjusting === item.id}
                          onClick={() => adjustQuantity(item.id, 10)}
                          title="Réassort +10"
                          className="h-7 px-2 flex items-center justify-center gap-1 rounded bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" /> 10
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {alertesRupture > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-5">
          <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Action Requise
          </h4>
          <p className="text-xs text-amber-900 font-medium leading-relaxed mt-2">
            {alertesRupture} article(s) sont à ou sous leur seuil d'alerte. Utilisez le bouton "+10" pour réassortir.
          </p>
        </div>
      )}
    </div>
  );
}
