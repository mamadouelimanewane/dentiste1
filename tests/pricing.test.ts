import { describe, it, expect } from 'vitest';
import {
  D_VALUE,
  DENTAL_NOMENCLATURE,
  coefficientCotation,
  prixSelonD,
} from '@/lib/pricing';

describe('coefficientCotation', () => {
  it('lit une cotation normale', () => {
    expect(coefficientCotation('D15')).toBe(15);
    expect(coefficientCotation('D135')).toBe(135);
  });

  it('tolère les espaces, la casse et la virgule décimale', () => {
    expect(coefficientCotation('d 15')).toBe(15);
    expect(coefficientCotation('D12,5')).toBe(12.5);
  });

  it('refuse ce qui n’est pas une cotation', () => {
    expect(coefficientCotation('')).toBeNull();
    expect(coefficientCotation(undefined)).toBeNull();
    expect(coefficientCotation('15')).toBeNull();
    expect(coefficientCotation('D')).toBeNull();
  });
});

describe('prixSelonD', () => {
  it('multiplie la cotation par la valeur de la lettre-clé', () => {
    expect(prixSelonD({ id: 'X', category: 'C', label: 'L', cotation: 'D5' }, 1200)).toBe(6000);
    expect(prixSelonD({ id: 'X', category: 'C', label: 'L', cotation: 'D5' }, 1000)).toBe(5000);
  });

  it('suit la convention appliquée, pas le tarif du cabinet', () => {
    // Le devis suivait la convention du patient, la réalisation des soins
    // appliquait le tarif du cabinet : le patient signait un devis puis était
    // facturé sur une autre base. Les deux passent désormais par ici.
    const acte = { id: 'PROTA12', category: 'P', label: 'Prothèse', cotation: 'D120' };
    expect(prixSelonD(acte, 1200)).toBe(144_000);
    expect(prixSelonD(acte, 1000)).toBe(120_000);
  });

  it('renvoie 0 plutôt qu’un prix inventé quand rien ne permet de calculer', () => {
    expect(prixSelonD({ id: 'X', category: 'C', label: 'L' }, 1200)).toBe(0);
  });
});

describe('catalogue des actes', () => {
  // Ce test est né d'un défaut réel : « Appareil 13 à 14 dents » portait la
  // cotation D135 ET un prix figé de 180 000 F, là où 135 × 1 200 donne
  // 162 000. Le prix l'emportait en silence, si bien que le devis affichait
  // une cotation qui ne correspondait pas au montant réclamé.
  it('n’a aucun acte sans cotation exploitable', () => {
    const sansCotation = DENTAL_NOMENCLATURE.filter((a) => coefficientCotation(a.cotation) === null);
    expect(sansCotation.map((a) => a.id)).toEqual([]);
  });

  it('ne porte aucun prix figé pouvant contredire la cotation', () => {
    const avecPrixFige = DENTAL_NOMENCLATURE.filter((a) => typeof a.price === 'number');
    expect(avecPrixFige.map((a) => a.id)).toEqual([]);
  });

  it('chiffre chaque acte à un montant strictement positif', () => {
    const aZero = DENTAL_NOMENCLATURE.filter((a) => prixSelonD(a, D_VALUE) <= 0);
    expect(aZero.map((a) => a.id)).toEqual([]);
  });

  it('donne des identifiants uniques', () => {
    const ids = DENTAL_NOMENCLATURE.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
