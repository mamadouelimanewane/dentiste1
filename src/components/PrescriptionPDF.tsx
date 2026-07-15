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
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1E3A8A',
    paddingBottom: 16,
    marginBottom: 24,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  practitionerLine: {
    fontSize: 10,
    color: '#334155',
    marginTop: 4,
  },
  contactLine: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  dateLine: {
    fontSize: 9,
    color: '#334155',
    textAlign: 'right',
    marginBottom: 30,
  },
  patientLine: {
    fontSize: 10,
    color: '#1E293B',
    marginBottom: 30,
  },
  patientName: {
    fontWeight: 'bold',
  },
  medBlock: {
    marginBottom: 18,
  },
  medName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  medDetail: {
    fontSize: 10,
    color: '#334155',
    marginTop: 2,
    paddingLeft: 10,
  },
  empty: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 60,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    right: 50,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
});

interface Med {
  name: string;
  dosage?: string;
  duration?: string;
  posology?: string;
}

interface PrescriptionPDFProps {
  patientName: string;
  practitionerName: string;
  medications: Med[];
}

export const PrescriptionPDF = ({ patientName, practitionerName, medications }: PrescriptionPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.clinicName}>Cabinet Dentaire du Cap Vert</Text>
        <Text style={styles.practitionerLine}>{practitionerName}</Text>
        <Text style={styles.contactLine}>Dakar, Sénégal</Text>
      </View>

      <Text style={styles.dateLine}>
        Dakar, le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </Text>

      <Text style={styles.patientLine}>
        Prescription pour : <Text style={styles.patientName}>{patientName}</Text>
      </Text>

      {medications.length === 0 ? (
        <Text style={styles.empty}>Aucun médicament prescrit.</Text>
      ) : (
        medications.map((med, i) => (
          <View key={i} style={styles.medBlock}>
            <Text style={styles.medName}>{med.name}{med.dosage ? ` ${med.dosage}` : ''}</Text>
            {med.duration && <Text style={styles.medDetail}>QSP : {med.duration}</Text>}
            {med.posology && <Text style={styles.medDetail}>{med.posology}</Text>}
          </View>
        ))
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Elite ERP Cap Vert — Ordonnance générée électroniquement, valable sous réserve de signature du praticien.
        </Text>
      </View>
    </Page>
  </Document>
);
