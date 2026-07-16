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
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 10,
    color: '#1E293B',
    lineHeight: 1.6,
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

interface TemplateDocumentPDFProps {
  clinicName: string;
  templateName: string;
  body: string;
}

export const TemplateDocumentPDF = ({ clinicName, templateName, body }: TemplateDocumentPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.clinicName}>{clinicName}</Text>
        <Text style={styles.title}>{templateName}</Text>
      </View>

      {body.split('\n').map((line, i) => (
        <Text key={i} style={[styles.body, { marginBottom: line.trim() === '' ? 10 : 2 }]}>
          {line || ' '}
        </Text>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Document généré électroniquement par Elite ERP Cap Vert.
        </Text>
      </View>
    </Page>
  </Document>
);
