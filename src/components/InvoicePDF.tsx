"use client";

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#1E3A8A',
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoBlock: {
    flexDirection: 'column',
    width: '45%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    padding: 8,
    alignItems: 'center',
  },
  colTooth: { width: '10%', fontSize: 10, fontWeight: 'bold', color: '#1E3A8A' },
  colLabel: { width: '60%', fontSize: 10, color: '#334155' },
  colPrice: { width: '30%', fontSize: 10, textAlign: 'right', fontWeight: 'bold' },
  headerText: { fontSize: 8, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' },
  totalSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    marginRight: 10,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  }
});

interface InvoicePDFProps {
  items: any[];
  total: number;
  patientName: string;
  patientId?: string;
  invoiceNumber: string;
}

export const InvoicePDF = ({ items, total, patientName, patientId, invoiceNumber }: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Text style={styles.title}>ELITE ERP CAP VERT</Text>
          <Text style={styles.subtitle}>Cabinet Dentaire de Référence</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1E293B' }}>FACTURE</Text>
          <Text style={{ fontSize: 10, color: '#64748B' }}>#{invoiceNumber}</Text>
          <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Date: {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Émetteur</Text>
          <Text style={styles.infoValue}>Dr. Mamadou Diallo</Text>
          <Text style={{ fontSize: 9, color: '#64748B' }}>Chirurgien-Dentiste</Text>
          <Text style={{ fontSize: 9, color: '#64748B' }}>Dakar, Sénégal</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Patient</Text>
          <Text style={styles.infoValue}>{patientName}</Text>
          {patientId && <Text style={{ fontSize: 9, color: '#64748B' }}>ID: {patientId}</Text>}
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colTooth, styles.headerText]}>Dent</Text>
          <Text style={[styles.colLabel, styles.headerText]}>Designation de l'acte</Text>
          <Text style={[styles.colPrice, styles.headerText, { textAlign: 'right' }]}>Montant (FCFA)</Text>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colTooth}>{item.tooth || '-'}</Text>
            <Text style={styles.colLabel}>{item.label}</Text>
            <Text style={styles.colPrice}>{item.price.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Net à Payer</Text>
          <Text style={styles.totalAmount}>{total.toLocaleString()} FCFA</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Merci de votre confiance. Cette facture est certifiée conforme aux tarifs en vigueur.
        </Text>
        <Text style={[styles.footerText, { marginTop: 4 }]}>
          Elite ERP Cap Vert v1.3 - Système de Gestion Certifié CABINET DENTAIRE DU CAP VERT
        </Text>
      </View>
    </Page>
  </Document>
);
