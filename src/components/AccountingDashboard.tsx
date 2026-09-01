"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, BookOpen, Download, FileSpreadsheet, AlertCircle, ListTree } from 'lucide-react';
import { cn } from "@/lib/utils";

interface JournalLine {
  journal: string;
  date: string;
  piece: string;
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
}

interface Summary {
  kpis: {
    encaissements: number;
    caisse: number;
    banque: number;
    creancesPatients: number;
    creancesMutuelles: number;
    chiffreAffaires: number;
    facturesImpayees: number;
  };
  journal: JournalLine[];
  nbFactures: number;
}

const JOURNAUX = [
  { id: 'Tous', label: 'Tous' },
  { id: 'VT', label: 'VT — Ventes' },
  { id: 'CA', label: 'CA — Caisse' },
  { id: 'BQ', label: 'BQ — Banque' },
  { id: 'OD', label: 'OD — Opérations diverses' },
];

function fcfa(n: number) {
  return `${Math.round(n).toLocaleString('fr-FR')} F`;
}

export function AccountingDashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journalFilter, setJournalFilter] = useState('Tous');
  const [from, setFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/accounting/summary?from=${from}&to=${to}`)
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les données comptables.");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur inconnue.'))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const lignes = (data?.journal || []).filter(
    (l) => journalFilter === 'Tous' || l.journal === journalFilter
  );
  const totalDebit = lignes.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lignes.reduce((s, l) => s + l.credit, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="h-10 w-10 bg-[#1E3A8A] text-white rounded flex items-center justify-center shadow-lg shadow-blue-200">
            <Calculator className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Journal des Ventes & Encaissements</h2>
            <div className="flex items-center gap-2">
              <BookOpen className="h-3 w-3 text-emerald-500" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Écritures SYSCOA générées depuis {data?.nbFactures ?? 0} facture(s)
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-2 text-xs font-bold text-slate-700" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded px-2 py-2 text-xs font-bold text-slate-700" />
          <a
            href={`/api/accounting/export?from=${from}&to=${to}`}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-sm transition-colors shadow-md shadow-emerald-900/20"
          >
            <FileSpreadsheet className="h-4 w-4" /> Exporter (.CSV)
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3">{error}</div>
      )}

      {/* KPIs REELS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Encaissements (571 + 521)', value: data ? fcfa(data.kpis.encaissements) : '—', accent: 'border-t-emerald-500' },
          { label: 'Créances patients (411)', value: data ? fcfa(data.kpis.creancesPatients) : '—', accent: 'border-t-blue-600' },
          { label: 'Créances mutuelles (4116)', value: data ? fcfa(data.kpis.creancesMutuelles) : '—', accent: 'border-t-amber-500' },
          { label: "Chiffre d'affaires (706)", value: data ? fcfa(data.kpis.chiffreAffaires) : '—', accent: 'border-t-slate-900' },
        ].map((k, i) => (
          <div key={i} className={cn('bg-white p-5 rounded-sm border border-slate-200 shadow-sm border-t-4', k.accent)}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{k.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-2">{k.value}</p>
          </div>
        ))}
      </div>

      {data && data.kpis.facturesImpayees > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-800">
            {data.kpis.facturesImpayees} facture(s) non soldée(s) sur la période — dont{' '}
            {fcfa(data.kpis.creancesMutuelles)} en attente de règlement par les mutuelles.
          </p>
        </div>
      )}

      {/* JOURNAL REEL */}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="bg-slate-50 border-b border-slate-200 flex flex-wrap overflow-x-auto">
          {JOURNAUX.map((j) => (
            <button
              key={j.id}
              onClick={() => setJournalFilter(j.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap',
                journalFilter === j.id
                  ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              <ListTree className="h-4 w-4" /> {j.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto flex-1">
          {loading && <p className="p-8 text-center text-xs text-slate-400">Chargement...</p>}
          {!loading && lignes.length === 0 && (
            <p className="p-8 text-center text-xs text-slate-400">
              Aucune écriture sur la période. Les écritures sont générées automatiquement à partir des factures.
            </p>
          )}
          {!loading && lignes.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="p-4">Journal</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Pièce</th>
                  <th className="p-4 w-24">N° SYSCOA</th>
                  <th className="p-4">Libellé</th>
                  <th className="p-4 text-right text-emerald-600">Débit</th>
                  <th className="p-4 text-right text-blue-600">Crédit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lignes.map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-400 text-xs">{l.journal}</td>
                    <td className="p-4 text-xs font-semibold">{new Date(l.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4 text-xs font-semibold">{l.piece}</td>
                    <td className="p-4 font-black text-slate-700 text-xs">{l.compte}</td>
                    <td className="p-4 text-xs font-semibold text-slate-500">{l.libelle}</td>
                    <td className="p-4 text-right font-black text-emerald-600 text-xs">
                      {l.debit ? fcfa(l.debit) : <span className="text-slate-300 font-medium">—</span>}
                    </td>
                    <td className="p-4 text-right font-black text-blue-600 text-xs">
                      {l.credit ? fcfa(l.credit) : <span className="text-slate-300 font-medium">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-black text-xs">
                <tr>
                  <td colSpan={5} className="p-4 text-right text-slate-500 uppercase tracking-widest">
                    Total ({lignes.length} ligne{lignes.length > 1 ? 's' : ''})
                  </td>
                  <td className="p-4 text-right text-emerald-600">{fcfa(totalDebit)}</td>
                  <td className="p-4 text-right text-blue-600">{fcfa(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* PERIMETRE HONNETE */}
      <div className="bg-slate-50 border border-slate-200 rounded-sm p-5 space-y-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Périmètre de ce module</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Les écritures ci-dessus sont générées automatiquement à partir des factures réelles du cabinet
          (vente au débit du compte client, règlement au débit de la caisse ou de la banque). Elles couvrent
          le cycle <strong>ventes et encaissements</strong> et peuvent être exportées pour votre comptable.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          En revanche, ce module ne tient pas la comptabilité fournisseurs (achats, dettes 401), la paie,
          ni les états financiers de synthèse (bilan, compte de résultat) : ces éléments nécessitent une
          saisie comptable complète qui n&apos;est pas gérée ici. Transmettez l&apos;export à votre cabinet
          comptable pour l&apos;établissement des états OHADA.
        </p>
      </div>
    </div>
  );
}
