import { describe, expect, it } from 'vitest';
import React from 'react';
import { InvoicePDF } from '@/components/InvoicePDF';
import { QuotePDF } from '@/components/QuotePDF';
import { PrescriptionPDF } from '@/components/PrescriptionPDF';

// Le mode démonstration ne vaut que si la mention arrive réellement sur le
// document. Le drapeau peut être en base, exposé par l'API et coché dans
// Configuration sans que la facture ne le dise — c'est exactement le défaut
// déjà rencontré avec le rappel d'allergie : la valeur était calculée, elle
// n'était affichée nulle part.
//
// On compose donc les trois documents et on lit le texte qu'ils contiennent.
// (Le PDF lui-même n'est pas relu : son texte y est encodé en identifiants de
// glyphes d'une police incorporée, illisible sans la table de correspondance.
// Ce qui est vérifié ici, c'est que la mention est bien rendue — le passage
// d'un <Text> au PDF, lui, ne dépend plus de ce code.)
function texteDuDocument(noeud: unknown): string {
  if (noeud === null || noeud === undefined || typeof noeud === 'boolean') return '';
  if (typeof noeud === 'string' || typeof noeud === 'number') return `${noeud} `;
  if (Array.isArray(noeud)) return noeud.map(texteDuDocument).join('');
  if (React.isValidElement(noeud)) {
    const el = noeud as React.ReactElement<{ children?: unknown }>;
    // Composant de fonction : on l'exécute pour obtenir ce qu'il rend.
    if (typeof el.type === 'function') {
      return texteDuDocument((el.type as (p: unknown) => unknown)(el.props));
    }
    return texteDuDocument(el.props?.children);
  }
  return '';
}

const CABINET = {
  clinic_name: 'CABINET DENTAIRE DU CAP VERT',
  address: 'Sacré-Cœur 3, Dakar, Sénégal',
  phone: '+221 33 800 00 00',
  ninea: 'DÉMO-NINEA',
  rccm: 'DÉMO-RCCM',
};

const DOCUMENTS: { nom: string; mention: string; composer: (demo: boolean) => React.ReactElement }[] = [
  {
    nom: 'facture',
    mention: 'Document de démonstration',
    composer: (demo) =>
      React.createElement(InvoicePDF, {
        items: [{ label: 'Consultation', qty: 1, price: 15000 }],
        total: 15000,
        patientName: 'Patient Test',
        invoiceNumber: 'FA-TEST-001',
        clinic: { ...CABINET, mode_demo: demo },
      }),
  },
  {
    nom: 'devis',
    mention: 'Document de démonstration',
    composer: (demo) =>
      React.createElement(QuotePDF, {
        items: [{ label: 'Couronne céramique', qty: 1, price: 180000 }],
        total: 180000,
        patientName: 'Patient Test',
        clinic: { ...CABINET, mode_demo: demo },
      }),
  },
  {
    nom: 'ordonnance',
    mention: 'Ordonnance de démonstration',
    composer: (demo) =>
      React.createElement(PrescriptionPDF, {
        medications: [{ name: 'Amoxicilline 1 g', dosage: '1 cp matin et soir', duration: '7 jours' }],
        patientName: 'Patient Test',
        practitionerName: 'Dr Test',
        clinic: { ...CABINET, mode_demo: demo },
      }),
  },
];

describe('mention de démonstration sur les documents', () => {
  for (const doc of DOCUMENTS) {
    it(`${doc.nom} : la mention est imprimée quand le mode démonstration est actif`, () => {
      expect(texteDuDocument(doc.composer(true))).toContain(doc.mention);
    });

    it(`${doc.nom} : aucune mention quand le cabinet est en exploitation réelle`, () => {
      expect(texteDuDocument(doc.composer(false))).not.toContain('émonstration');
    });
  }

  it("le cabinet identifié apparaît sur la facture, et rien n'est inventé à sa place", () => {
    const avec = texteDuDocument(
      React.createElement(InvoicePDF, {
        items: [],
        total: 0,
        patientName: 'Patient Test',
        invoiceNumber: 'FA-TEST-002',
        clinic: { ...CABINET, mode_demo: true },
      })
    );
    expect(avec).toContain('CABINET DENTAIRE DU CAP VERT');
    expect(avec).toContain('DÉMO-NINEA');

    // Sans paramétrage, aucun numéro fiscal ne doit apparaître.
    const sans = texteDuDocument(
      React.createElement(InvoicePDF, {
        items: [],
        total: 0,
        patientName: 'Patient Test',
        invoiceNumber: 'FA-TEST-003',
        clinic: null,
      })
    );
    expect(sans).not.toContain('NINEA');
    expect(sans).not.toContain('RCCM');
  });
});
