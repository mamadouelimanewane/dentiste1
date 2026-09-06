"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Layers,
  Search,
  Plus,
  Truck,
  Send,
  CheckCircle2,
  Clock,
  FlaskConical,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { usePatient } from "@/lib/context";

interface LabOrder {
  id: string;
  patient_id: string;
  patient_name: string;
  act_label: string;
  teinte: string | null;
  lab_name: string;
  status: "a_envoyer" | "production" | "shipped" | "completed";
  expected_delivery: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<LabOrder["status"], string> = {
  a_envoyer: "À envoyer au labo",
  production: "En Production",
  shipped: "Expédié",
  completed: "Terminé",
};

const STATUS_PROGRESS: Record<LabOrder["status"], number> = {
  a_envoyer: 0,
  production: 33,
  shipped: 66,
  completed: 100,
};

const NEXT_STATUS: Record<LabOrder["status"], LabOrder["status"] | null> = {
  // Un ordre naît « à envoyer » : rien n'a encore été transmis au laboratoire.
  a_envoyer: "production",
  production: "shipped",
  shipped: "completed",
  completed: null,
};

const teintes = ["A1", "A2", "A3", "A3.5", "B1", "B2", "C1", "D2"];

export function ProstheticsLab() {
  const { currentPatient } = usePatient();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [tronque, setTronque] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [actLabel, setActLabel] = useState("");
  const [labName, setLabName] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [teinte, setTeinte] = useState("A2");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/lab-orders")
      .then(async (res) => {
        const data = await res.json();
        // `res.ok` n'était pas vérifié : un refus du serveur renvoyait un objet
        // sans `orders`, et l'écran affichait une liste vide — indiscernable
        // d'un laboratoire sans aucun travail en cours.
        if (!res.ok) throw new Error(data?.error || "Travaux labo non chargés.");
        return data;
      })
      .then((data) => {
        setOrders(data.orders || []);
        setTotal(typeof data.total === "number" ? data.total : (data.orders || []).length);
        setTronque(!!data.tronque);
        setError(null);
      })
      .catch((e) =>
        setError(
          e instanceof Error && e.message
            ? `${e.message} Ne concluez pas qu'aucun travail n'est en cours.`
            : "Impossible de charger les travaux labo."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  // Travaux en retard.
  //
  // La date de livraison prévue était affichée, mais rien ne signalait qu'elle
  // était dépassée : un travail promis pour le 20 et toujours « en
  // production » le 30 se lisait comme les autres. Le patient revenait pour
  // la pose, et la prothèse n'était pas là.
  const joursDeRetard = (o: LabOrder) => {
    if (!o.expected_delivery || o.status === "completed") return 0;
    const prevue = new Date(o.expected_delivery);
    prevue.setHours(23, 59, 59, 999);
    const jours = Math.floor((Date.now() - prevue.getTime()) / 86_400_000);
    return jours > 0 ? jours : 0;
  };
  const enRetard = orders.filter((o) => joursDeRetard(o) > 0);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!currentPatient || !actLabel.trim() || !labName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/lab-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentPatient.id,
          actLabel: actLabel.trim(),
          teinte,
          labName: labName.trim(),
          expectedDelivery: expectedDelivery || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la création de l'ordre labo.");
      setActLabel("");
      setLabName("");
      setExpectedDelivery("");
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  const advanceStatus = async (order: LabOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      const res = await fetch("/api/lab-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la mise à jour.");
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    }
  };

  const filtered = orders.filter(
    (o) => !search || o.patient_name.toLowerCase().includes(search.toLowerCase()) || o.act_label.toLowerCase().includes(search.toLowerCase())
  );

  const aEnvoyer = orders.filter((o) => o.status === "a_envoyer").length;
  const enCours = orders.filter((o) => o.status === "production").length;
  const expedies = orders.filter((o) => o.status === "shipped").length;
  const termines = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-200 rounded-sm p-5 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-5">
          <div className="h-12 w-12 bg-[#0F172A] text-sky-400 rounded flex items-center justify-center shadow-xl shadow-blue-900/10 border border-blue-800/20">
            <Layers className="h-7 w-7" />
          </div>
          <div>
            {/* Redisait « Laboratoire & prothèses », déjà en titre de page. */}
            <h2 className="text-base font-bold text-slate-900">Travaux en cours</h2>
            {/* Affichait le nombre de lignes reçues comme s'il s'agissait du
                total : un laboratoire à 250 travaux en lisait 100. */}
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
              {total || orders.length} travau(x) suivi(s)
              {tronque && ` — ${orders.length} affichés, en attente d'abord`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <Plus className="h-4 w-4" /> Nouvel Ordre Labo
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3 leading-relaxed">{error}</div>}

      {enRetard.length > 0 && (
        <div className="flex items-start gap-2 rounded-sm border border-rose-300 bg-rose-50 p-3 text-xs font-bold text-rose-800 leading-relaxed">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            {enRetard.length} travail{enRetard.length > 1 ? "x" : ""} au-delà de la date de livraison
            annoncée : {enRetard
              .slice(0, 4)
              .map((o) => `${o.patient_name} (${joursDeRetard(o)} j)`)
              .join(", ")}
            {enRetard.length > 4 ? "…" : ""}. Relancez le laboratoire avant de convoquer ces patients
            pour la pose.
          </span>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 space-y-4">
          {!currentPatient ? (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-800 uppercase">Sélectionnez un patient actif pour créer un ordre labo.</p>
            </div>
          ) : (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pour : {currentPatient.name}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={actLabel}
              onChange={(e) => setActLabel(e.target.value)}
              placeholder="Prestation (ex: Couronne Zircone)"
              className="border border-slate-200 rounded-sm p-2.5 text-sm outline-none focus:border-blue-400"
            />
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="Nom du laboratoire"
              className="border border-slate-200 rounded-sm p-2.5 text-sm outline-none focus:border-blue-400"
            />
            <input
              type="date"
              value={expectedDelivery}
              onChange={(e) => setExpectedDelivery(e.target.value)}
              className="border border-slate-200 rounded-sm p-2.5 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Teinte (Vita)</p>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {teintes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTeinte(t)}
                  className={cn(
                    "h-9 rounded border text-[10px] font-black transition-all",
                    teinte === t ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !currentPatient || !actLabel.trim() || !labName.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            {saving ? "Création..." : "Créer l'Ordre Labo"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "À envoyer", value: String(aEnvoyer), icon: Send, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "En Production", value: String(enCours), icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Expédiés", value: String(expedies), icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Terminés", value: String(termines), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
            <div className={cn("h-10 w-10 rounded flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("h-5 w-5", stat.color)} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par patient ou prestation..."
          className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-sm text-[10px] font-bold uppercase outline-none w-full md:w-80 focus:border-blue-400 transition-colors"
        />
      </div>

      <div className="space-y-4">
        {loading && <p className="text-xs text-slate-400 text-center py-8">Chargement...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-8">Aucun travail labo enregistré.</p>
        )}
        {filtered.map((order) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={order.id}
            className="bg-white border border-slate-200 rounded-sm shadow-sm hover:border-blue-300 transition-all overflow-hidden"
          >
            <div className="p-5 flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between md:justify-start gap-3">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{order.patient_name}</h4>
                  <span className={cn(
                    "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                    order.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    order.status === "shipped" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Prestation</p>
                    <p className="text-xs font-black text-slate-700">{order.act_label} {order.teinte && <span className="text-amber-600">• {order.teinte}</span>}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Partenaire Labo</p>
                    <div className="flex items-center gap-1.5">
                      <FlaskConical className="h-3 w-3 text-blue-500" />
                      <p className="text-xs font-black text-slate-700">{order.lab_name}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between mb-2">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Progression</p>
                    <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest">{STATUS_PROGRESS[order.status]}%</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${STATUS_PROGRESS[order.status]}%` }}
                      transition={{ duration: 0.6 }}
                      className={cn("h-full rounded-full", order.status === "completed" ? "bg-emerald-500" : "bg-blue-600")}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[160px]">
                <div className="text-center md:text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Livraison prévue</p>
                  <p
                    className={cn(
                      "text-sm font-black",
                      joursDeRetard(order) > 0 ? "text-rose-700" : "text-slate-900"
                    )}
                  >
                    {order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString("fr-FR") : "—"}
                  </p>
                  {joursDeRetard(order) > 0 && (
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-700 mt-0.5">
                      En retard de {joursDeRetard(order)} jour{joursDeRetard(order) > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                {NEXT_STATUS[order.status] && (
                  <button
                    onClick={() => advanceStatus(order)}
                    className="w-full mt-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white rounded-sm text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    Passer à "{STATUS_LABEL[NEXT_STATUS[order.status]!]}" <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
