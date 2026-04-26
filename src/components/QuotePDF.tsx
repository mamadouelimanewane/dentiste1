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
    marginBottom: 30,
    borderBottom: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  infoSection: {
    marginBottom: 30,
  },
  infoLabel: {
    fontSize: 8,
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#F1F5F9',
  },
  colDesc: { flex: 3, fontSize: 10 },
  colQty: { flex: 1, fontSize: 10, textAlign: 'center' },
  colPrice: { flex: 1, fontSize: 10, textAlign: 'right' },
  colTotal: { flex: 1, fontSize: 10, textAlign: 'right' },
  totalSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTop: 2,
    borderTopColor: '#2563EB',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTop: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  }
});

interface QuotePDFProps {
  items: { label: string; qty: number; price: number }[];
  total: number;
  patientName: string;
}

export const QuotePDF = ({ items, total, patientName }: QuotePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DentisteLite</Text>
          <Text style={styles.subtitle}>Devis de soins dentaires</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoText}>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoLabel}>Patient</Text>
        <Text style={styles.infoText}>{patientName}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qté</Text>
          <Text style={styles.colPrice}>Prix Unitaire</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.label}</Text>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colPrice}>{item.price.toLocaleString()} FCFA</Text>
            <Text style={styles.colTotal}>{(item.price * item.qty).toLocaleString()} FCFA</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>TOTAL À RÉGLER</Text>
        <Text style={styles.totalValue}>{total.toLocaleString()} FCFA</Text>
      </View>

      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.subtitle}>Signature Praticien</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.subtitle}>Bon pour accord (Patient)</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Ce devis est valable 30 jours. Les prix sont indiqués en FCFA.
        DentisteLite v1.0 - Workflow Engine Integration
      </Text>
    </Page>
  </Document>
);
