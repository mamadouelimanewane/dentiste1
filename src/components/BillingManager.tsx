"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CreditCard, Banknote, Shield, Smartphone, Download, CheckCircle2, Receipt, FileText , ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatient } from "@/lib/context";
import { useAuth } from "@/lib/auth-context";
import dynamic from "next/dynamic";
import { DemoModeBadge } from "@/components/DemoModeBadge";
import { QRCodeSVG } from "qrcode.react";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);
import { InvoicePDF, type ReglagesCabinetPDF } from "./InvoicePDF";

interface ExecutedAct {
  id: string;
  label: string;
  tooth: number | null;
  price: number;
  performed_at: string;
}

type PaymentMethod = "cash" | "card" | "insurance" | "mobile_money";

interface PendingInvoice {
  id: string;
  invoice_number: string;
  total: string | number;
  status: string;
  payment_method: string | null;
  created_at: string;
  paid_at?: string | null;
}

export function BillingManager() {
  const { currentPatient } = usePatient();
  const { user } = useAuth();
  const [executedActs, setExecutedActs] = useState<ExecutedAct[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [invoice, setInvoice] = useState<{
    id: string;
    invoice_number: string;
    status: string;
    created_at?: string | null;
    paid_at?: string | null;
    payment_method?: string | null;
  } | null>(null);
  const [fournisseur, setFournisseur] = useState<"wave" | "orange_money">("wave");
  const [fournisseursDisponibles, setFournisseursDisponibles] = useState<("wave" | "orange_money")[]>([]);
  const [lienPaiement, setLienPaiement] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [allActs, setAllActs] = useState<(ExecutedAct & { invoice_id: string | null })[]>([]);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  // Distingue « rien à facturer » de « je n'ai pas pu charger ».
  const [chargeErreur, setChargeErreur] = useState<string | null>(null);

  const loadActs = useCallback(async () => {
    if (!currentPatient) return;
    try {
      const res = await fetch(`/api/executed-acts?patientId=${currentPatient.id}&unbilled=true`);
      const data = await res.json();
      if (res.ok) {
        setExecutedActs(data.acts);
        setChargeErreur(null);
      } else {
        // Sans ce message, un échec affichait « Régler 0 FCFA » : la séance
        // paraissait déjà facturée et le cabinet ne l'encaissait jamais.
        setChargeErreur(data.error || "Impossible de charger les actes à facturer. N'encaissez pas sur cet écran tant qu'il n'est pas rechargé.");
      }
    } catch {
      setChargeErreur("Réseau indisponible : les actes à facturer n'ont pas pu être chargés.");
    }
  }, [currentPatient]);

  // Historique complet des factures du patient. Sans cela : (1) un patient
  // qui repasse payer plus tard était impossible à encaisser (ses actes
  // étant déjà rattachés à une facture, l'écran affichait "Régler 0 FCFA"),
  // (2) rééditer le PDF d'une facture déjà émise était impossible, alors
  // qu'un duplicata est une demande courante au comptoir.
  // N'afficher que les moyens réellement configurés, plutôt qu'un bouton
  // qui échouerait au clic.
  useEffect(() => {
    fetch("/api/payments/checkout")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const dispo = d?.providers || [];
        setFournisseursDisponibles(dispo);
        if (dispo.length > 0) setFournisseur(dispo[0]);
      })
      .catch(() => {});
  }, []);

  const loadPendingInvoices = useCallback(async () => {
    if (!currentPatient) return;
    const [invRes, actsRes] = await Promise.all([
      fetch(`/api/invoices?patientId=${currentPatient.id}`),
      fetch(`/api/executed-acts?patientId=${currentPatient.id}`),
    ]);
    const invData = await invRes.json();
    const actsData = await actsRes.json();
    if (invRes.ok) setPendingInvoices(invData.invoices || []);
    if (actsRes.ok) setAllActs(actsData.acts || []);
  }, [currentPatient]);

  useEffect(() => {
    loadActs();
    loadPendingInvoices();
  }, [loadActs, loadPendingInvoices]);

  // Encaissement d'une facture déjà transmise à une mutuelle.
  //
  // Le serveur refuse (409) tant que le cabinet n'a pas tranché : soit le
  // patient règle la totalité et l'on renonce à la prise en charge, soit il
  // ne règle que son reste à charge. On lui pose donc la question au lieu de
  // laisser une demande courir sur une somme déjà encaissée.
  const settleExistingInvoice = async (inv: PendingInvoice, method: PaymentMethod, annuler = false) => {
    setSettlingId(inv.id);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${inv.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          ...(annuler ? { annulerPriseEnCharge: true } : {}),
          ...(method === "insurance"
            ? { insuranceProvider: insuranceProvider.trim() || "Mutuelle", insurancePolicyNumber: insurancePolicyNumber.trim() }
            : {}),
        }),
      });
      const data = await res.json();
      if (res.status === 409 && data.priseEnChargeEnCours) {
        setPriseEnCharge({
          montant: data.priseEnChargeEnCours.montant,
          assureur: data.priseEnChargeEnCours.assureur,
          rejouer: () => settleExistingInvoice(inv, method, true),
        });
        return;
      }
      if (!res.ok) throw new Error(data.error || "Échec du règlement.");
      setPriseEnCharge(null);
      await loadPendingInvoices();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setSettlingId(null);
    }
  };

  // Identité légale du cabinet, pour les documents remis au patient. Le PDF
  // de facture portait jusqu'ici un praticien, un NINEA et un nom de cabinet
  // inventés — voir InvoicePDF.
  const [cabinet, setCabinet] = useState<ReglagesCabinetPDF | null>(null);

  useEffect(() => {
    fetch("/api/clinic-settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCabinet(d?.settings || null))
      .catch(() => {});
  }, []);

  const [priseEnCharge, setPriseEnCharge] = useState<{
    montant: number;
    assureur: string;
    rejouer: () => Promise<void>;
  } | null>(null);

  const [confirmPayment, setConfirmPayment] = useState(false);
  const [coverageRate, setCoverageRate] = useState<number>(80);

  const total = executedActs.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const partMutuelle = Math.round(total * (coverageRate / 100));
  const partPatient = total - partMutuelle;

  const isPaid = invoice?.status === "paid";
  const isPendingInsurance = invoice?.status === "pending" && paymentMethod === "insurance";
  const isSettled = isPaid || isPendingInsurance;

  const handlePaymentClick = () => {
    if (total === 0 || !currentPatient) return;
    if (paymentMethod === "insurance" && !insuranceProvider.trim()) {
      setError("Indiquez le nom de l'assureur / mutuelle avant de transmettre la facture.");
      return;
    }
    setConfirmPayment(true);
  };

  const handlePayment = async () => {
    setConfirmPayment(false);
    setProcessing(true);
    setError(null);
    try {
      let currentInvoice = invoice;
      if (!currentInvoice) {
        if (!currentPatient) {
          throw new Error("Aucun patient sélectionné.");
        }
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
          body: JSON.stringify({ invoiceId: currentInvoice!.id, provider: fournisseur }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec du paiement.");
        // La facture n'est pas soldée ici : elle le sera quand le
        // fournisseur confirmera l'encaissement. On affiche le lien réel,
        // que le patient peut ouvrir ou scanner.
        setLienPaiement(data.redirectUrl);
        window.open(data.redirectUrl, "_blank");
      } else {
        // Même règle qu'au comptoir (voir settleExistingInvoice) : si une
        // prise en charge court encore sur cette facture, le serveur répond
        // 409 et l'on demande au cabinet de trancher avant d'encaisser.
        const reglerFacture = async (annuler: boolean) => {
          const res = await fetch(`/api/invoices/${currentInvoice!.id}/settle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              method: paymentMethod,
              ...(annuler ? { annulerPriseEnCharge: true } : {}),
              ...(paymentMethod === "insurance"
                ? { insuranceProvider: insuranceProvider.trim(), insurancePolicyNumber: insurancePolicyNumber.trim(), coverageRate }
                : {}),
            }),
          });
          const data = await res.json();
          if (res.status === 409 && data.priseEnChargeEnCours) {
            setPriseEnCharge({
              montant: data.priseEnChargeEnCours.montant,
              assureur: data.priseEnChargeEnCours.assureur,
              rejouer: () => reglerFacture(true),
            });
            return;
          }
          if (!res.ok) throw new Error(data.error || "Échec du règlement.");
          setPriseEnCharge(null);
          setInvoice(data.invoice);
        };
        await reglerFacture(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue.");
    } finally {
      setProcessing(false);
    }
  };

  if (!currentPatient) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[400px]">
        <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-2 border border-blue-100 shadow-sm">
          <Receipt className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-lg font-black text-slate-800 tracking-tight">Prêt pour la Facturation</h2>
        <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
          Sélectionnez un patient actif pour établir un devis, générer une note d'honoraires ou procéder à un encaissement.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
    {/* Mentions légales manquantes : la facture PDF sort sans elles. Elles ne
        sont plus inventées (voir InvoicePDF), mais leur absence doit se voir
        ici plutôt que d'être découverte par le patient ou la mutuelle. */}
    {cabinet && !cabinet.ninea && (
      <div className="flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900 leading-relaxed">
        <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          Le NINEA du cabinet n&apos;est pas renseigné : les factures éditées ici sortiront sans
          cette mention. Complétez l&apos;identité du cabinet dans Configuration.
        </span>
      </div>
    )}

    {chargeErreur && (
      <div className="flex items-start gap-2 rounded-sm border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
        <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
        {chargeErreur}
      </div>
    )}

    {/* Encaissement bloqué : une prise en charge court encore sur cette
        facture. Sans cet arrêt, le cabinet encaissait la totalité auprès du
        patient tout en laissant la demande partir chez l'assureur. */}
    {priseEnCharge && (
      <div className="rounded-sm border border-amber-300 bg-amber-50 p-4 space-y-3">
        <div className="flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-700" />
          <div className="text-xs font-bold text-amber-900 leading-relaxed">
            Une prise en charge de {priseEnCharge.montant.toLocaleString("fr-FR")} F est en cours auprès de{" "}
            {priseEnCharge.assureur}. Encaisser la totalité auprès du patient annulerait cette demande.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => priseEnCharge.rejouer()}
            className="px-4 py-2 bg-amber-700 text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-sm hover:bg-amber-800"
          >
            Le patient paie tout — annuler la prise en charge
          </button>
          <button
            type="button"
            onClick={() => setPriseEnCharge(null)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-[0.15em] rounded-sm hover:bg-slate-50"
          >
            Ne rien encaisser
          </button>
        </div>
        <p className="text-[10px] text-amber-800 leading-relaxed">
          Si le patient ne règle que son reste à charge, ne rien encaisser ici : la prise en charge sera soldée
          depuis le module Mutuelles au paiement de l&apos;assureur.
        </p>
      </div>
    )}

    {/* Factures émises non soldées : permet d'encaisser un patient qui
        revient payer après coup, cas impossible auparavant. */}
    {pendingInvoices.length > 0 && (
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-slate-600" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
            Factures du patient ({pendingInvoices.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100">
          {pendingInvoices.map((inv) => {
            const impayee = inv.status === "pending";
            const lignes = allActs
              .filter((a) => a.invoice_id === inv.id)
              .map((a) => ({ label: a.label, tooth: a.tooth, price: Number(a.price) }));
            return (
              <div key={inv.id} className={cn("p-4 flex flex-col md:flex-row md:items-center justify-between gap-3", impayee && "bg-amber-50/40")}>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900">{inv.invoice_number}</p>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                      impayee ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    )}>
                      {impayee ? (inv.payment_method === "insurance" ? "Chez la mutuelle" : "Impayée") : "Réglée"}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    {new Date(inv.created_at).toLocaleDateString("fr-FR")} · {lignes.length} acte(s)
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg font-black text-slate-900">
                    {Number(inv.total).toLocaleString("fr-FR")} <span className="text-xs text-slate-400">FCFA</span>
                  </span>
                  <PDFDownloadLink
                    document={
                      <InvoicePDF
                        items={lignes}
                        total={Number(inv.total)}
                        patientName={currentPatient?.name || "Patient"}
                        patientId={currentPatient?.idNumber}
                        invoiceNumber={inv.invoice_number}
                        clinic={cabinet}
                        practitionerName={user?.fullName}
                        status={inv.status}
                        issuedAt={inv.created_at}
                        paidAt={inv.paid_at}
                        paymentMethod={inv.payment_method}
                      />
                    }
                    fileName={`${inv.invoice_number}.pdf`}
                  >
                    {/* @ts-ignore */}
                    {({ loading }) => (
                      <button
                        disabled={loading}
                        className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" /> {loading ? "..." : "PDF"}
                      </button>
                    )}
                  </PDFDownloadLink>
                  {impayee && (
                    <>
                      <button
                        onClick={() => settleExistingInvoice(inv, "cash")}
                        disabled={settlingId === inv.id}
                        className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        {settlingId === inv.id ? "..." : "Encaisser espèces"}
                      </button>
                      <button
                        onClick={() => settleExistingInvoice(inv, "card")}
                        disabled={settlingId === inv.id}
                        className="h-9 px-4 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        Carte
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

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
                  clinic={cabinet}
                  practitionerName={user?.fullName}
                  status={invoice?.status}
                  issuedAt={invoice?.created_at}
                  paidAt={invoice?.paid_at}
                  paymentMethod={invoice?.payment_method}
                />
              }
              fileName={`Facture_${currentPatient?.name || "Patient"}_${invoice?.invoice_number || "brouillon"}.pdf`}
            >
              {/* @ts-ignore */}
              {({ loading }) => (
                <button
                  disabled={loading || isSettled}
                  className={cn(
                    "w-full h-10 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                    isSettled ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-black disabled:opacity-50"
                  )}
                >
                  {isSettled ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  {loading
                    ? "Génération..."
                    : isPaid
                    ? "Facture Payée & Téléchargée"
                    : isPendingInsurance
                    ? "Facture Transmise & Téléchargée"
                    : "Générer la Facture PDF"}
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

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "cash", label: "Espèces", icon: Banknote },
              { id: "card", label: "Carte Bancaire", icon: CreditCard },
              { id: "insurance", label: "Mutuelle", icon: Shield },
              { id: "mobile_money", label: "Wave / Orange", icon: Smartphone },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                disabled={isSettled}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all disabled:opacity-50",
                  paymentMethod === method.id
                    ? "bg-blue-50 border-blue-600 text-blue-900 shadow-sm shadow-blue-100"
                    : "bg-white border-slate-100 hover:border-slate-300 text-slate-500 hover:text-slate-700"
                )}
              >
                <method.icon className={cn("h-6 w-6", paymentMethod === method.id ? "text-blue-600" : "text-slate-400")} />
                <span className="text-[10px] font-black uppercase tracking-tight">{method.label}</span>
              </button>
            ))}
          </div>

          {paymentMethod === "mobile_money" && !isSettled && (
            <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
              <div className="flex gap-2">
                {([
                  ["wave", "Wave", "bg-blue-600"],
                  ["orange_money", "Orange Money", "bg-orange-500"],
                ] as const).map(([id, libelle, couleur]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFournisseur(id)}
                    disabled={fournisseursDisponibles.length > 0 && !fournisseursDisponibles.includes(id)}
                    className={cn(
                      "px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all border disabled:opacity-40 disabled:cursor-not-allowed",
                      fournisseur === id ? `${couleur} text-white border-transparent` : "bg-white text-slate-600 border-slate-200"
                    )}
                  >
                    {libelle}
                  </button>
                ))}
              </div>

              {/* Le QR code encodait auparavant une URL de démonstration
                  (pay.wave.com/m/demo) : un patient qui le scannait ne payait
                  rien, alors que l'écran annonçait « Scanner pour payer ». Il
                  n'apparaît donc que lorsqu'un vrai lien a été créé. */}
              {lienPaiement ? (
                <div className="flex items-center gap-6">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                    <QRCodeSVG value={lienPaiement} size={80} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Faire scanner au patient</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Montant : <span className="font-bold text-blue-600">{total.toLocaleString()} FCFA</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      La facture se soldera automatiquement dès que{" "}
                      {fournisseur === "wave" ? "Wave" : "Orange Money"} confirmera l&apos;encaissement.
                    </p>
                  </div>
                </div>
              ) : fournisseursDisponibles.length === 0 ? (
                <p className="text-[11px] text-amber-800 leading-relaxed bg-amber-50 border border-amber-200 rounded-sm p-2">
                  <strong>API Wave et Orange Money en cours de connexion.</strong> En attendant,
                  encaissez le règlement au cabinet et enregistrez-le avec le mode correspondant
                  (espèces, carte, mutuelle).
                </p>
              ) : (
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Validez pour créer le lien de paiement. Si le patient règle en espèces ou
                  directement sur le compte du cabinet, choisissez plutôt le mode correspondant.
                </p>
              )}
            </div>
          )}

          {paymentMethod === "insurance" && !isSettled && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assureur / Mutuelle *</label>
                <input
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  placeholder="AXA, IPM, Gras Savoye..."
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">N° Police / Adhérent</label>
                  <input
                    value={insurancePolicyNumber}
                    onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Couverture (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={coverageRate}
                    onChange={(e) => setCoverageRate(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between p-3 bg-blue-50 border border-blue-100 rounded text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Part Mutuelle</span>
                  <span className="font-bold text-blue-800">{partMutuelle.toLocaleString()} FCFA</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Reste à Charge Patient</span>
                  <span className="font-bold text-slate-900">{partPatient.toLocaleString()} FCFA</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Une déclaration de {partMutuelle.toLocaleString()} FCFA sera transmise à l'assureur. Le reste à charge de {partPatient.toLocaleString()} FCFA devra être réglé par le patient.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            {!confirmPayment ? (
              <button
                onClick={handlePaymentClick}
                disabled={total === 0 || isSettled || processing}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50"
              >
                {isPaid
                  ? "Paiement Enregistré"
                  : isPendingInsurance
                  ? "Transmis à la Mutuelle"
                  : processing
                  ? "Traitement…"
                  : paymentMethod === "insurance"
                  ? "Calculer et Préparer la Transmission"
                  : `Régler ${total.toLocaleString()} FCFA`}
              </button>
            ) : (
              <div className="space-y-4 p-4 border border-blue-200 bg-blue-50 rounded-sm">
                <p className="text-xs font-bold text-blue-900 text-center">
                  Veuillez confirmer l'encaissement de {paymentMethod === "insurance" ? partPatient.toLocaleString() : total.toLocaleString()} FCFA
                  {paymentMethod === "insurance" && ` et la transmission de ${partMutuelle.toLocaleString()} FCFA à la mutuelle`}.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmPayment(false)}
                    className="flex-1 h-10 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePayment}
                    className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold uppercase tracking-widest transition-colors shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FACTURE & COMPTABILITÉ
            Ce bloc affichait deux cases « Envoyer copie à la Comptabilité » et
            « Envoyer copie au Patient (Email) » — décoratives : `defaultChecked`
            sans état, jamais lues. Et une confirmation verte annonçait que
            « les exemplaires ont été transmis aux destinataires sélectionnés ».
            Aucun e-mail n'est envoyé : l'application n'a pas de service
            d'envoi de courriel. Le personnel croyait le patient et le
            comptable servis, et ne remettait donc pas la facture en main. */}
        <div className="bg-white border border-slate-200 rounded-sm p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Facture et comptabilité</h3>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            La facture alimente <strong>automatiquement</strong> la Comptabilité dès son
            émission : il n&apos;y a rien à transmettre. En revanche, l&apos;application{" "}
            <strong>n&apos;envoie aucun e-mail</strong> — pour remettre son exemplaire au
            patient, téléchargez le PDF ci-dessus et imprimez-le ou envoyez-le
            vous-même.
          </p>
          {isPaid && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-sm flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
              <p className="text-[10px] font-bold text-emerald-800 uppercase leading-relaxed">
                Facture réglée et enregistrée. Elle apparaît dans la Comptabilité.
              </p>
            </div>
          )}
          {isPendingInsurance && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-sm flex items-start gap-2">
              <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                Facture transmise à {insuranceProvider || "l'assureur"} — en attente de règlement. Suivez son statut dans le module Mutuelles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
