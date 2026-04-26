"use client";

import React, { useState, useRef } from "react";
import { DENTAL_NOMENCLATURE, DentalProcedure } from "@/lib/pricing";
import { Plus, Trash2, FileText, Download, CheckCircle2, Eraser } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotePDF } from "./QuotePDF";
import SignatureCanvas from "react-signature-canvas";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Catalog */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Catalogue Actes</h3>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-wider">Tarif D-1200</span>
          </div>
          <div className="space-y-3">
            {DENTAL_NOMENCLATURE.map(p => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={p.id} 
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all group border border-transparent hover:border-blue-100"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{p.label}</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{p.price?.toLocaleString()} FCFA</p>
                </div>
                <button onClick={() => add(p)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm hover:bg-blue-600 hover:text-white transition-all text-slate-400">
                  <Plus className="h-5 w-5" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recap & Signature */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 bg-blue-600/20 blur-[80px] rounded-full" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-400">Récapitulatif Devis</h3>
              </div>
              <AnimatePresence>
                {selected.length > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4 relative z-10 min-h-[100px]">
              {selected.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-8 text-slate-500 space-y-2">
                  <Plus className="h-8 w-8 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Aucun acte sélectionné</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selected.map(i => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i.id} 
                      className="flex justify-between items-center"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold">{i.label}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Qté: {i.qty}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-sm">{(i.price! * i.qty).toLocaleString()}</span>
                        <button onClick={() => remove(i.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-between items-end relative z-10">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Devis</p>
                <p className="text-3xl font-black text-white tracking-tighter">{total.toLocaleString()} <span className="text-[10px] text-blue-500 ml-1">FCFA</span></p>
              </div>
              
              {selected.length > 0 && (
                <PDFDownloadLink
                  document={<QuotePDF items={selected.map(i => ({ label: i.label, qty: i.qty, price: i.price || 0 }))} total={total} patientName="Mamadou Diallo" />}
                  fileName={`devis_diallo_${new Date().getTime()}.pdf`}
                >
                  {/* @ts-ignore */}
                  {({ loading }) => (
                    <button 
                      disabled={loading}
                      className="h-14 px-8 bg-blue-600 rounded-2xl flex items-center gap-3 font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                    >
                      <Download className="h-5 w-5" />
                      {loading ? "Génération..." : "Télécharger PDF"}
                    </button>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </div>

          {/* Signature Block */}
          {selected.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Accord Patient (Signature)</h4>
                <button onClick={clearSignature} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                  <Eraser className="h-4 w-4" />
                </button>
              </div>
              <div className="border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 overflow-hidden h-32 relative">
                <SignatureCanvas 
                  ref={sigCanvas}
                  onBegin={() => setIsSigned(true)}
                  canvasProps={{ className: "w-full h-full cursor-crosshair" }} 
                />
              </div>
              <p className="text-[9px] text-slate-400 font-medium italic text-center">La signature électronique a la même valeur légale qu'une signature manuscrite.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

