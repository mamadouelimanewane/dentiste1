import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { ReglagesCabinetPDF } from './InvoicePDF';

const styles = StyleSheet.create({
  page: { padding: 50, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  logoSection: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 40, height: 40, backgroundColor: '#1E3A8A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  titleText: { fontSize: 20, fontWeight: 'bold', color: '#0F172A', letterSpacing: 1 },
  subtitleText: { fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  
  invoiceTag: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  invoiceTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 2 },
  invoiceNumber: { fontSize: 10, color: '#64748B' },
  
  infoBlock: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40, paddingTop: 20, borderTopWidth: 2, borderTopColor: '#F1F5F9' },
  infoCol: { width: '45%' },
  infoLabel: { fontSize: 8, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 },
  infoText: { fontSize: 11, color: '#0F172A', fontWeight: 'bold', marginBottom: 3 },
  infoSub: { fontSize: 9, color: '#64748B', marginBottom: 1 },
  
  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 12, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  colDescHeader: { flex: 3, fontSize: 8, color: '#64748B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
  colQtyHeader: { flex: 1, fontSize: 8, color: '#64748B', fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  colPriceHeader: { flex: 1, fontSize: 8, color: '#64748B', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 },
  colTotalHeader: { flex: 1, fontSize: 8, color: '#64748B', fontWeight: 'bold', textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 },
  
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center' },
  colDesc: { flex: 3, fontSize: 9, color: '#334155' },
  colQty: { flex: 1, fontSize: 9, textAlign: 'center', color: '#334155' },
  colPrice: { flex: 1, fontSize: 9, textAlign: 'right', color: '#334155' },
  colTotal: { flex: 1, fontSize: 9, textAlign: 'right', fontWeight: 'bold', color: '#0F172A' },
  
  summarySection: { marginTop: 30, flexDirection: 'row', justifyContent: 'flex-end' },
  summaryBox: { width: '50%', backgroundColor: '#F8FAFC', padding: 15, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 9, color: '#64748B', textTransform: 'uppercase' },
  summaryValue: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#CBD5E1' },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#0F172A', textTransform: 'uppercase' },
  totalValueBig: { fontSize: 14, fontWeight: 'bold', color: '#1E3A8A' },
  
  signatureSection: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBox: { width: '40%' },
  signatureTitle: { fontSize: 9, color: '#1E3A8A', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 40 },
  signatureLine: { borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 5 },
  signatureLabel: { fontSize: 8, color: '#94A3B8', textAlign: 'center' },
  
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, fontSize: 8, color: '#94A3B8', textAlign: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10 }
});

interface QuotePDFProps {
  // Base tarifaire appliquée : le prix de chaque acte est une cotation
  // multipliée par la valeur de la lettre-clé D, laquelle dépend de la
  // convention. Sans cette mention, un devis présenté au patient ne permet
  // pas de vérifier d'où viennent ses montants — ni de comprendre, des mois
  // plus tard, pourquoi le même acte a été chiffré autrement.
  baseTarifaire?: { nom: string; valeurD: number } | null;
  items: { label: string; qty: number; price: number }[];
  total: number;
  patientName: string;
  signatureBase64?: string | null;
  // Identité réelle du cabinet et du dossier — voir la note ci-dessous.
  clinic?: ReglagesCabinetPDF | null;
  patientDossier?: string | null;
  practitionerName?: string | null;
  reference?: string | null;
  issuedAt?: string | null;
}

// Ce devis est remis au patient et engage le cabinet. Il portait pourtant,
// écrits en dur : un praticien inexistant (« Dr. Mamadou Diallo »), un numéro
// d'Ordre inventé (« 4521 »), un cabinet qui n'est pas celui-ci (« Cabinet
// Dentaire Premium ») et — le plus gênant — un numéro de dossier fixe,
// « SN-12345-X », qui n'était celui d'aucun patient. La référence du devis
// était de surcroît TIRÉE AU SORT à chaque impression : le patient qui
// revenait avec « DEV-2026-4821 » présentait une référence introuvable, et
// deux impressions du même devis ne portaient pas le même numéro.
//
// Ce qui n'est pas renseigné dans Configuration reste vide plutôt qu'inventé.
export const QuotePDF = ({
  items,
  total,
  patientName,
  signatureBase64,
  baseTarifaire,
  clinic,
  patientDossier,
  practitionerName,
  reference,
  issuedAt,
}: QuotePDFProps) => {
  const nomCabinet = clinic?.clinic_name?.trim() || 'Cabinet dentaire';
  const mentions = [clinic?.address, clinic?.phone, clinic?.ninea ? `NINEA : ${clinic.ninea}` : null]
    .map((v) => (v || '').trim())
    .filter(Boolean);
  const dateDevis = issuedAt ? new Date(issuedAt) : new Date();

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
          <Text style={styles.invoiceTitle}>DEVIS</Text>
          {!!reference && <Text style={styles.invoiceNumber}>Réf : {reference}</Text>}
          <Text style={{ fontSize: 8, color: '#94A3B8', marginTop: 4 }}>
            Établi le {dateDevis.toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoBlock}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Informations Patient</Text>
          <Text style={styles.infoText}>{patientName}</Text>
          {!!patientDossier && <Text style={styles.infoSub}>Dossier : {patientDossier}</Text>}
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Praticien traitant</Text>
          <Text style={styles.infoText}>{practitionerName || nomCabinet}</Text>
          {mentions.map((m, i) => (
            <Text key={i} style={styles.infoSub}>{m}</Text>
          ))}
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
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.label}</Text>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colPrice}>{item.price.toLocaleString()}</Text>
            <Text style={styles.colTotal}>{(item.price * item.qty).toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{total.toLocaleString()} FCFA</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL DU DEVIS</Text>
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
          {signatureBase64 ? (
            <Image src={signatureBase64} style={{ width: 150, height: 50, marginBottom: 5 }} />
          ) : (
            <View style={[styles.signatureLine, { marginTop: 30 }]}>
              <Text style={styles.signatureLabel}>Bon pour accord, le : ____/____/20__</Text>
            </View>
          )}
          {signatureBase64 && (
            <View style={styles.signatureLine}>
              {/* Portait la date d'IMPRESSION : un devis signé en juillet et
                  réédité en septembre s'annonçait signé en septembre. */}
              <Text style={styles.signatureLabel}>
                Signé électroniquement le {dateDevis.toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Le pied portait une adresse, un téléphone (« +221 77 000 00 00 ») et
          un NINEA (« 012345678 ») entièrement inventés. */}
      <Text style={styles.footer}>
        Devis valable 30 jours à compter du {dateDevis.toLocaleDateString('fr-FR')}.{'\n'}
        {mentions.length > 0 ? `${nomCabinet} — ${mentions.join(' — ')}` : nomCabinet}
      </Text>
    </Page>
  </Document>
  );
};
