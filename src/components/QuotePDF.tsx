import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  brand: { fontSize: 26, fontWeight: 'bold', color: '#1E3A8A' },
  brandSub: { fontSize: 8, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  docTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginTop: 15, textTransform: 'uppercase', letterSpacing: 1 },
  docSubtitle: { fontSize: 10, color: '#64748B', marginTop: 4 },
  
  infoBlock: { flexDirection: 'row', marginTop: 30, backgroundColor: '#F8FAFC', padding: 15, borderLeftWidth: 4, borderLeftColor: '#1E3A8A' },
  infoCol: { flex: 1 },
  infoLabel: { fontSize: 8, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
  infoText: { fontSize: 11, color: '#0F172A', fontWeight: 'bold' },
  
  table: { marginTop: 30 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1E3A8A', padding: 10 },
  colDescHeader: { flex: 3, fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textTransform: 'uppercase' },
  colQtyHeader: { flex: 1, fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' },
  colPriceHeader: { flex: 1, fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' },
  colTotalHeader: { flex: 1, fontSize: 9, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase' },
  
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  tableRowAlt: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  colDesc: { flex: 3, fontSize: 10, color: '#334155' },
  colQty: { flex: 1, fontSize: 10, textAlign: 'center', color: '#334155' },
  colPrice: { flex: 1, fontSize: 10, textAlign: 'right', color: '#334155' },
  colTotal: { flex: 1, fontSize: 10, textAlign: 'right', color: '#0F172A', fontWeight: 'bold' },
  
  totalSection: { marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end' },
  totalBox: { backgroundColor: '#F8FAFC', padding: 15, width: '50%', borderTopWidth: 2, borderTopColor: '#1E3A8A' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalLabel: { fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: 'bold' },
  totalValueBig: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A' },
  
  signatureSection: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: '40%' },
  signatureTitle: { fontSize: 9, color: '#1E3A8A', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 40 },
  signatureLine: { borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 5 },
  signatureLabel: { fontSize: 8, color: '#94A3B8', textAlign: 'center' },
  
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, color: '#94A3B8', textAlign: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 }
});


interface QuotePDFProps {
  items: { label: string; qty: number; price: number }[];
  total: number;
  patientName: string;
}

export const QuotePDF = ({ items, total, patientName }: QuotePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Clinique du Cap Vert</Text>
          <Text style={styles.brandSub}>Chirurgie & Esthétique Dentaire</Text>
          <Text style={styles.docTitle}>Devis Conventionnel</Text>
          <Text style={styles.docSubtitle}>Valable pour une durée de 30 jours</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.infoLabel}>Document Réf</Text>
          <Text style={styles.infoText}>DEV-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000)}</Text>
          <Text style={[styles.infoLabel, { marginTop: 10 }]}>Date d'émission</Text>
          <Text style={styles.infoText}>{new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </View>

      {/* Patient & Doctor Info */}
      <View style={styles.infoBlock}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Informations Patient</Text>
          <Text style={styles.infoText}>{patientName}</Text>
          <Text style={[styles.infoText, { fontSize: 10, color: '#64748B', marginTop: 2 }]}>Dossier : SN-12345-X</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Praticien Traitant</Text>
          <Text style={styles.infoText}>Dr. Diallo</Text>
          <Text style={[styles.infoText, { fontSize: 10, color: '#64748B', marginTop: 2 }]}>Ordre National : 4521</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDescHeader}>Désignation de l'Acte</Text>
          <Text style={styles.colQtyHeader}>Qté</Text>
          <Text style={styles.colPriceHeader}>P.U (FCFA)</Text>
          <Text style={styles.colTotalHeader}>Total</Text>
        </View>
        {items.map((item, index) => (
          <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.colDesc}>{item.label}</Text>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colPrice}>{item.price.toLocaleString()}</Text>
            <Text style={styles.colTotal}>{(item.price * item.qty).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalSection}>
        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Net à Payer</Text>
            <Text style={styles.totalValueBig}>{total.toLocaleString()} FCFA</Text>
          </View>
        </View>
      </View>

      {/* Signatures */}
      <View style={styles.signatureSection}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureTitle}>Le Praticien</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Cachet et Signature</Text>
          </View>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureTitle}>Le Patient</Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>Bon pour accord, le : ____/____/20__</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Clinique du Cap Vert - Dakar, Plateau - Tél: +221 77 000 00 00 - NINEA: 012345678{'\n'}
        Généré par DentisteLite Hub Praticien
      </Text>
    </Page>
  </Document>
);
