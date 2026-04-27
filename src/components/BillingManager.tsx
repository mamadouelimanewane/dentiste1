"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Banknote, Shield, Download, CheckCircle2, Receipt } from "lucide-react";
import { DENTAL_NOMENCLATURE } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function BillingManager() {
  const [executedIds, setExecutedIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'insurance'>('cash');
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dentiste_lite_executed");
    if (saved) setExecutedIds(JSON.parse(saved));
  }, []);

  const executedItems = DENTAL_NOMENCLATURE.filter(p => executedIds.includes(p.id));
  const total = executedItems.reduce((sum, item) => sum + (item.price || 0), 0);

  const handlePayment = () => {
    setIsPaid(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Invoice Summary */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#1E3A8A] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Note d'Honoraires</h3>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase">Facture #2024-001</span>
        </div>

        <div className="p-6 flex-1 space-y-4">
          <div className="space-y-3">
            {executedItems.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun acte réalisé à facturer.</p>
            ) : (
              executedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase">{item.label}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">{item.cotation}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{item.price?.toLocaleString()} FCFA</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Net à Payer</span>
            <span className="text-2xl font-bold text-slate-900">{total.toLocaleString()} <span className="text-xs text-slate-400 ml-1">FCFA</span></span>
          </div>
          
          <button 
            disabled={total === 0 || isPaid}
            className={cn(
              "w-full h-10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              isPaid ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-black disabled:opacity-50"
            )}
          >
            {isPaid ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {isPaid ? "Facture Payée & Téléchargée" : "Générer la Facture"}
          </button>
        </div>
      </div>

      {/* Right: Payment Method */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-6 shadow-sm">
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Mode de Règlement</h3>
          
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'cash', label: 'Espèces', icon: Banknote },
              { id: 'card', label: 'Carte Bancaire', icon: CreditCard },
              { id: 'insurance', label: 'Prise en charge', icon: Shield },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-sm border transition-all",
                  paymentMethod === method.id 
                    ? "bg-blue-50 border-blue-200 text-blue-900" 
                    : "bg-white border-slate-100 hover:border-slate-200 text-slate-600"
                )}
              >
                <method.icon className={cn("h-5 w-5", paymentMethod === method.id ? "text-blue-600" : "text-slate-400")} />
                <span className="text-xs font-black uppercase tracking-tight">{method.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handlePayment}
              disabled={total === 0 || isPaid}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {isPaid ? "Paiement Enregistré" : `Régler ${total.toLocaleString()} FCFA`}
            </button>
          </div>
        </div>

        {/* ACCOUNTING / DESTINATAIRES */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Transmission Facture & Comptabilité</h3>
          <div className="space-y-3">
            {[
              { id: 'compta', label: 'Envoyer copie à la Comptabilité du Cabinet', default: true },
              { id: 'patient', label: 'Envoyer copie au Patient (Email)', default: true },
              { id: 'assurance', label: 'Transmettre à l\'Assurance / Mutuelle', default: paymentMethod === 'insurance' }
            ].map((dest) => (
              <label key={dest.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-sm cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" defaultChecked={dest.default} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{dest.label}</span>
              </label>
            ))}
          </div>
          {isPaid && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              <p className="text-[10px] font-bold text-emerald-800 uppercase leading-relaxed">
                Les écritures comptables ont été générées et les exemplaires transmis aux destinataires sélectionnés.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
