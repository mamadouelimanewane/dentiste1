"use client";

import React, { useState, useRef } from "react";
import { DENTAL_NOMENCLATURE, DentalProcedure } from "@/lib/pricing";
import { Plus, Trash2, FileText, Download, CheckCircle2, Eraser, ShoppingCart } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotePDF } from "./QuotePDF";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function QuoteBuilder() {
  const [selected, setSelected] = useState<(DentalProcedure & { qty: number })[]>([]);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);

  const add = (p: DentalProcedure) => {
    setSelected(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const remove = (id: string) => setSelected(prev => prev.filter(i => i.id !== id));
  const clearSignature = () => {
    sigCanvas.current?.clear();
    setIsSigned(false);
  };

  const total = selected.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CATALOG PANEL */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Catalogue des Actes</h3>
            <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase">Tarif Conventionnel</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
            {DENTAL_NOMENCLATURE.map(p => (
              <div 
                key={p.id} 
                className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">{p.label}</p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase">{p.price?.toLocaleString()} FCFA</p>
                </div>
                <button 
                  onClick={() => add(p)} 
                  className="h-8 w-8 flex items-center justify-center rounded bg-slate-50 border border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-slate-500"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY & ACTION PANEL */}
        <div className="space-y-6">
          <div className="bg-[#1E293B] rounded-lg border border-slate-800 shadow-sm p-6 text-white space-y-6 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Récapitulatif</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">{selected.length} acte(s)</span>
            </div>

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
                        <span className="font-bold text-blue-400">{(i.price! * i.qty).toLocaleString()}</span>
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
                <PDFDownloadLink
                  document={<QuotePDF items={selected.map(i => ({ label: i.label, qty: i.qty, price: i.price || 0 }))} total={total} patientName="Mamadou Diallo" />}
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
              )}
            </div>
          </div>

          {/* SIGNATURE PANEL */}
          {selected.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Signature du Patient</h4>
                <button onClick={clearSignature} className="text-slate-400 hover:text-rose-500" title="Effacer">
                  <Eraser className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="border border-slate-100 rounded bg-slate-50 overflow-hidden h-28 relative border-dashed">
                <SignatureCanvas 
                  ref={sigCanvas}
                  onBegin={() => setIsSigned(true)}
                  canvasProps={{ className: "w-full h-full cursor-crosshair" }} 
                />
              </div>
              <p className="text-[9px] text-slate-400 font-medium italic text-center">Valeur d'accord contractuel électronique.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


