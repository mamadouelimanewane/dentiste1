"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CreditCard, Banknote, Shield, Smartphone, Download, CheckCircle2, Receipt, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import dynamic from "next/dynamic";
import { DemoModeBadge } from "@/components/DemoModeBadge";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);
import { InvoicePDF } from "./InvoicePDF";

interface ExecutedAct {
  id: string;
  label: string;
  tooth: number | null;
  price: number;
  performed_at: string;
}

type PaymentMethod = "cash" | "card" | "insurance" | "mobile_money";

export function BillingManager() {
  const { currentPatient } = usePatient();
  const [executedActs, setExecutedActs] = useState<ExecutedAct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [invoice, setInvoice] = useState<{ id: string; invoice_number: string; status: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActs = useCallback(async () => {
    if (!currentPatient) return;
    const res = await fetch(`/api/executed-acts?patientId=${currentPatient.id}&unbilled=true`);
    const data = await res.json();
    if (res.ok) setExecutedActs(data.acts);
  }, [currentPatient]);

  useEffect(() => {
    loadActs();
  }, [loadActs]);

  const total = executedActs.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const isPaid = invoice?.status === "paid";

  const handlePayment = async () => {
    if (total === 0 || !currentPatient) return;
    setProcessing(true);
    setError(null);
    try {
      let currentInvoice = invoice;
      if (!currentInvoice) {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: currentPatient.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec de création de la facture.");
        currentInvoice = data.invoice;
        setInvoice(currentInvoice);
      }

      if (paymentMethod === "mobile_money") {
        const res = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId: currentInvoice!.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec du paiement.");
        if (data.redirectUrl) {
          window.open(data.redirectUrl, "_blank");
        } else {
          // Mode démo : paiement marqué payé immédiatement côté serveur.
          setInvoice((prev) => (prev ? { ...prev, status: "paid" } : prev));
        }
      } else {
        const res = await fetch(`/api/invoices/${currentInvoice!.id}/settle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: paymentMethod }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec du règlement.");
        setInvoice(data.invoice);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setProcessing(false);
    }
  };

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-lg p-12 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
        <FileText className="h-10 w-10 text-slate-200" />
        <p className="text-sm text-slate-500">Sélectionnez un patient (étape Accueil) pour facturer.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Invoice Summary */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#1E3A8A] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-400" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Note d'Honoraires</h3>
          </div>
          <span className="text-[9px] font-bold text-blue-200 uppercase">{invoice?.invoice_number || "Brouillon"}</span>
        </div>

        <div className="p-6 flex-1 space-y-4">
          <div className="space-y-3">
            {executedActs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-20 text-center space-y-2">
                <FileText className="h-10 w-10" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Aucun acte à facturer</p>
              </div>
            ) : (
              executedActs.map(item => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    {item.tooth && (
                      <div className="h-6 w-6 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                        {item.tooth}
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-slate-900 uppercase">{item.label}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase">
                        {new Date(item.performed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{Number(item.price).toLocaleString()} FCFA</p>
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

          {total > 0 && (
            <PDFDownloadLink
              document={
                <InvoicePDF
                  items={executedActs.map((a) => ({ ...a, timestamp: a.performed_at }))}
                  total={total}
                  patientName={currentPatient?.name || "Patient Anonyme"}
                  patientId={currentPatient?.idNumber}
                  invoiceNumber={invoice?.invoice_number || "BROUILLON"}
                />
              }
              fileName={`Facture_${currentPatient?.name || "Patient"}_${invoice?.invoice_number || "brouillon"}.pdf`}
            >
              {/* @ts-ignore */}
              {({ loading }) => (
                <button
                  disabled={loading || isPaid}
                  className={cn(
                    "w-full h-10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                    isPaid ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-black disabled:opacity-50"
                  )}
                >
                  {isPaid ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  {loading ? "Génération..." : isPaid ? "Facture Payée & Téléchargée" : "Générer la Facture PDF"}
                </button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Right: Payment Method */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Mode de Règlement</h3>
            {paymentMethod === "mobile_money" && <DemoModeBadge feature="payments" />}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {[
              { id: "cash", label: "Espèces", icon: Banknote },
              { id: "card", label: "Carte Bancaire", icon: CreditCard },
              { id: "insurance", label: "Prise en charge", icon: Shield },
              { id: "mobile_money", label: "Mobile Money (Wave/OM)", icon: Smartphone },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                disabled={isPaid}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-sm border transition-all disabled:opacity-50",
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
              disabled={total === 0 || isPaid || processing}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {isPaid ? "Paiement Enregistré" : processing ? "Traitement…" : `Régler ${total.toLocaleString()} FCFA`}
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
