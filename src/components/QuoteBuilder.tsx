"use client";

import React, { useState, useRef, useEffect } from "react";
import { D_VALUE, DENTAL_NOMENCLATURE, DentalProcedure, prixSelonD } from "@/lib/pricing";
import { Plus, Trash2, FileText, Download, CheckCircle2, Eraser, ShoppingCart, Save, AlertTriangle, PenTool } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotePDF } from "./QuotePDF";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { SignaturePadModal } from "./SignaturePadModal";
import { ActCatalogPicker } from "@/components/ActCatalogPicker";
import { ExplicationPatient } from "@/components/ExplicationPatient";

export function QuoteBuilder() {
  const { currentPatient } = usePatient();
  const [selected, setSelected] = useState<(DentalProcedure & { qty: number })[]>([]);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Base tarifaire du devis. Les prix du catalogue sont une cotation
  // multipliée par la valeur de la lettre-clé D, qui dépend de la convention
  // appliquée. Le praticien doit pouvoir la choisir AVANT de chiffrer : la
  // changer après coup recalculerait un devis déjà présenté au patient.
  const [conventions, setConventions] = useState<{ id: string; nom: string; valeur_d: number }[]>([]);
  const [valeurCabinet, setValeurCabinet] = useState<number>(D_VALUE);
  const [baseChoisie, setBaseChoisie] = useState<string>("cabinet");

  useEffect(() => {
    fetch("/api/conventions")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || "Bases tarifaires non chargées.");
        return d;
      })
      .then((d) => {
        setConventions(d.conventions || []);
        if (typeof d.valeurCabinet === "number") setValeurCabinet(d.valeurCabinet);
      })
      // Sans base chargée, on reste sur celle du cabinet et on le dit plutôt
      // que de chiffrer en silence sur une valeur peut-être périmée.
      .catch(() => setError("Bases tarifaires non chargées : le devis utilise la valeur par défaut."));
  }, []);

  const convention = conventions.find((c) => c.id === baseChoisie);
  const valeurD = convention ? Number(convention.valeur_d) : valeurCabinet;
  const nomBase = convention ? convention.nom : "Tarif du cabinet";

  const add = (p: DentalProcedure) => {
    setSelected(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
    setSaved(false);
  };

  const remove = (id: string) => {
    setSelected(prev => prev.filter(i => i.id !== id));
    setSaved(false);
  };
  const clearSignature = () => {
    sigCanvas.current?.clear();
    setIsSigned(false);
  };

  const prixLigne = (acte: DentalProcedure) => prixSelonD(acte, valeurD);
  const total = selected.reduce((s, i) => s + prixLigne(i) * i.qty, 0);

  const handleSave = async () => {
    if (!currentPatient || selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentPatient.id,
          items: selected.map(i => ({ id: i.id, label: i.label, qty: i.qty, price: prixLigne(i) })),
          total,
          signed: isSigned,
          // Figée avec le devis : rééditer plus tard, après un changement de
          // convention, doit redonner le montant signé par le patient.
          convention: nomBase,
          valeurD,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'enregistrement du devis.");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CATALOG PANEL */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Catalogue des Actes</h3>
            {/* Le badge annonçait « Tarif Conventionnel » sans dire sur quelle
                base, alors que chaque prix est une cotation multipliée par la
                valeur de D — laquelle dépend de la convention. Le praticien
                choisit désormais cette base, et voit le montant qu'elle donne. */}
            <select
              value={baseChoisie}
              onChange={(e) => { setBaseChoisie(e.target.value); setSaved(false); }}
              title="Base tarifaire appliquée à ce devis"
              className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="cabinet">
                Tarif du cabinet — D = {valeurCabinet.toLocaleString("fr-FR")} F
              </option>
              {conventions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} — D = {Number(c.valeur_d).toLocaleString("fr-FR")} F
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-h-0">
            <ActCatalogPicker onPick={add} ctaLabel="Ajouter au devis" />
          </div>
        </div>

        {/* SUMMARY & ACTION PANEL */}
        <div className="space-y-6">
          <div className="bg-[#1E3A8A] rounded-lg border border-blue-800 shadow-sm p-6 text-white space-y-6 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Récapitulatif</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">{selected.length} acte(s)</span>
            </div>

            {!currentPatient && (
              <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <p className="text-[10px] font-bold text-amber-300 uppercase leading-tight">Aucun patient actif — sélectionnez un dossier pour enregistrer ce devis</p>
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-300">{error}</div>
            )}

            <div className="flex-1 space-y-3">
              {selected.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-2 py-8">
                  <FileText className="h-8 w-8 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Devis vide</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selected.map(i => (
                    <div key={i.id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-3 last:border-0">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-xs">{i.label}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Quantité: {i.qty}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-blue-400">{(prixLigne(i) * i.qty).toLocaleString()}</span>
                        <button onClick={() => remove(i.id)} className="text-slate-600 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total à régler</p>
                <p className="text-2xl font-bold text-white tracking-tight">{total.toLocaleString()} <span className="text-xs text-blue-400 ml-1">FCFA</span></p>
              </div>
                     {selected.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="h-10 px-4 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    <PenTool className="h-4 w-4" />
                    Faire Signer
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !currentPatient}
                    className={cn(
                      "h-10 px-4 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm disabled:opacity-50",
                      saved ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-700 hover:bg-slate-600"
                    )}
                  >
                    {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saving ? "Enregistrement..." : saved ? "Devis Enregistré" : "Enregistrer"}
                  </button>
                  <PDFDownloadLink
                    document={<QuotePDF items={selected.map(i => ({ label: i.label, qty: i.qty, price: prixLigne(i) }))} total={total} patientName={currentPatient?.name || "Patient non sélectionné"} signatureBase64={signatureData} />}
                    fileName={`devis_${new Date().getTime()}.pdf`}
                  >
                    {/* @ts-ignore */}
                    {({ loading }) => (
                      <button
                        disabled={loading}
                        className="h-10 px-6 bg-blue-600 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-sm shadow-blue-900/20 disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        {loading ? "Chargement..." : "Générer PDF"}
                      </button>
                    )}
                  </PDFDownloadLink>
                </div>
              )}
            </div>
          </div>

          {/* SIGNATURE FEEDBACK PANEL */}
          {signatureData && (
            <div className="bg-emerald-50 rounded-lg border border-emerald-200 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Devis signé électroniquement</h4>
                  <p className="text-xs text-emerald-700">La signature sera intégrée au PDF final.</p>
                </div>
              </div>
              <button onClick={() => setSignatureData(null)} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase underline">
                Effacer
              </button>
            </div>
          )}

        </div>
      </div>
      
      {/* Reformulation du plan en mots que le patient comprend : c'est au
          moment du devis que se joue son acceptation. */}
      <ExplicationPatient />

      <SignaturePadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(dataUrl) => { setSignatureData(dataUrl); setIsSigned(true); }}
        title="Signature du Devis"
        subtitle="Veuillez signer dans le cadre ci-dessous pour validation."
      />
    </div>
  );
}
