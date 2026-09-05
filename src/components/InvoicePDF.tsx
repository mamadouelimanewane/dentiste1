"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: 1,
  },
  subtitleText: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  invoiceTag: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#64748B',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#F1F5F9',
  },
  infoBlock: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  infoSub: {
    fontSize: 9,
    color: '#64748B',
    marginBottom: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  colTooth: { width: '15%', fontSize: 9, fontWeight: 'bold', color: '#1E3A8A' },
  colLabel: { width: '55%', fontSize: 9, color: '#334155' },
  colPrice: { width: '30%', fontSize: 9, textAlign: 'right', fontWeight: 'bold', color: '#0F172A' },
  headerText: { fontSize: 8, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 },
  summarySection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: '50%',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
  },
  certificationBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 20,
  },
  certifText1: { fontSize: 8, color: '#94A3B8', marginBottom: 2 },
  certifText2: { fontSize: 7, color: '#CBD5E1' },
  stampBox: {
    width: 100,
    height: 40,
    borderWidth: 2,
    borderColor: '#1E3A8A',
    borderRadius: 4,
    opacity: 0.5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-5deg)',
  },
  stampText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textTransform: 'uppercase',
  }
});

// Identité du cabinet et état réel de la facture.
//
// Ce document est remis au patient et présenté aux mutuelles. Il portait
// pourtant, écrits en dur : un praticien qui n'existe pas (« Dr. Mamadou
// Diallo »), un NINEA fabriqué (« 1234567 »), un nom de cabinet qui n'est pas
// celui-ci (« Cabinet Dentaire Premium »), la date DU JOUR au lieu de la date
// d'émission — et surtout un tampon « PAYÉ / ACQUITTÉ » apposé sur TOUTE
// facture, réglée ou non. Une facture impayée sortait donc acquittée : le
// patient pouvait la présenter comme preuve de paiement.
//
// Un faux « hash de certification » tiré au sort à chaque impression
// accompagnait le tout sous la mention « Facture certifiée électroniquement ».
// Rien n'était certifié, et deux impressions de la même facture donnaient deux
// empreintes différentes.
//
// Ce qui n'est pas renseigné dans Configuration reste vide : un cabinet sans
// NINEA saisi vaut mieux qu'un NINEA inventé.
export interface ReglagesCabinetPDF {
  clinic_name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  ninea?: string | null;
  rccm?: string | null;
}

interface InvoicePDFProps {
  items: any[];
  total: number;
  patientName: string;
  patientId?: string;
  invoiceNumber: string;
  clinic?: ReglagesCabinetPDF | null;
  practitionerName?: string | null;
  status?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
}

const MOYENS: Record<string, string> = {
  cash: 'espèces',
  card: 'carte',
  insurance: 'prise en charge',
  mobile_money: 'mobile money',
};

export const InvoicePDF = ({
  items,
  total,
  patientName,
  patientId,
  invoiceNumber,
  clinic,
  practitionerName,
  status,
  issuedAt,
  paidAt,
  paymentMethod,
}: InvoicePDFProps) => {
  const nomCabinet = clinic?.clinic_name?.trim() || 'Cabinet dentaire';
  const mentions = [clinic?.address, clinic?.phone, clinic?.ninea ? `NINEA : ${clinic.ninea}` : null, clinic?.rccm ? `RCCM : ${clinic.rccm}` : null]
    .map((v) => (v || '').trim())
    .filter(Boolean);
  const dateEmission = issuedAt ? new Date(issuedAt) : new Date();
  const acquittee = status === 'paid';

  return (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Premium */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>E</Text>
          </View>
          <View>
            <Text style={styles.titleText}>{nomCabinet}</Text>
            {!!clinic?.address && <Text style={styles.subtitleText}>{clinic.address}</Text>}
          </View>
        </View>
        <View style={styles.invoiceTag}>
          <Text style={styles.invoiceTitle}>FACTURE</Text>
          <Text style={styles.invoiceNumber}>N° {invoiceNumber}</Text>
          <Text style={{ fontSize: 8, color: '#94A3B8', marginTop: 4 }}>
            Émise le {dateEmission.toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Émetteur</Text>
          <Text style={styles.infoValue}>{nomCabinet}</Text>
          {!!practitionerName && <Text style={styles.infoSub}>{practitionerName}</Text>}
          {mentions.map((m, i) => (
            <Text key={i} style={styles.infoSub}>{m}</Text>
          ))}
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Patient / Destinataire</Text>
          <Text style={styles.infoValue}>{patientName}</Text>
          <Text style={styles.infoSub}>Dossier: {patientId || 'Non spécifié'}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colTooth, styles.headerText]}>Dent</Text>
          <Text style={[styles.colLabel, styles.headerText]}>Désignation de l'acte médical</Text>
          <Text style={[styles.colPrice, styles.headerText]}>Montant (FCFA)</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colTooth}>{item.tooth ? `Dent ${item.tooth}` : 'Général'}</Text>
            <Text style={styles.colLabel}>{item.label}</Text>
            <Text style={styles.colPrice}>{Number(item.price).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{total.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>NET À PAYER</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} FCFA</Text>
          </View>
        </View>
      </View>

      {/* Footer / Certification */}
      <View style={styles.footer}>
        <View style={styles.certificationBlock}>
          <View>
            <Text style={styles.certifText1}>
              {acquittee
                ? `Réglée le ${paidAt ? new Date(paidAt).toLocaleDateString('fr-FR') : dateEmission.toLocaleDateString('fr-FR')}${paymentMethod ? ` en ${MOYENS[paymentMethod] || paymentMethod}` : ''}.`
                : 'Facture non réglée à ce jour.'}
            </Text>
            <Text style={styles.certifText2}>
              Document émis par le logiciel du cabinet — {dateEmission.toLocaleDateString('fr-FR')}
            </Text>
          </View>
          {acquittee && (
            <View style={styles.stampBox}>
              <Text style={styles.stampText}>Acquittée</Text>
            </View>
          )}
        </View>
      </View>
    </Page>
  </Document>
  );
};
