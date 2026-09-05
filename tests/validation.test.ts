import { describe, it, expect } from 'vitest';
import {
  MONTANT_MAX,
  QUANTITE_MAX,
  bornerTexte,
  validerCreneau,
  validerDent,
  validerMontant,
  validerNom,
  validerQuantite,
  validerTelephone,
} from '@/lib/validation';

// Ces validations sont la dernière barrière avant l'écriture en base. Chacune
// est née d'une saisie qui avait réellement corrompu quelque chose : un acte à
// prix négatif qui diminuait le chiffre d'affaires, une « dent 999 » dans un
// dossier clinique, un stock à -500 aiguilles, un créneau finissant avant de
// commencer.

describe('validerMontant', () => {
  it('accepte un montant normal et l’arrondit au franc', () => {
    expect(validerMontant(42_000)).toEqual({ ok: true, valeur: 42_000 });
    expect(validerMontant('18000.4')).toEqual({ ok: true, valeur: 18_000 });
  });

  it('refuse un montant négatif', () => {
    expect(validerMontant(-1000).ok).toBe(false);
  });

  it('refuse un montant hors de proportion', () => {
    expect(validerMontant(MONTANT_MAX + 1).ok).toBe(false);
  });

  it('refuse ce qui n’est pas un nombre', () => {
    expect(validerMontant('quarante mille').ok).toBe(false);
  });

  it('traite l’absence selon que le montant est requis ou non', () => {
    expect(validerMontant('').ok).toBe(false);
    expect(validerMontant('', { obligatoire: false })).toEqual({ ok: true, valeur: 0 });
  });
});

describe('validerDent', () => {
  it('accepte la notation FDI, permanente comme temporaire', () => {
    expect(validerDent(16)).toEqual({ ok: true, valeur: 16 });
    expect(validerDent(48)).toEqual({ ok: true, valeur: 48 });
    expect(validerDent(85)).toEqual({ ok: true, valeur: 85 });
  });

  it('accepte l’absence de dent : tous les actes ne visent pas une dent', () => {
    expect(validerDent(null)).toEqual({ ok: true, valeur: null });
    expect(validerDent('')).toEqual({ ok: true, valeur: null });
  });

  it('refuse un numéro hors notation', () => {
    expect(validerDent(999).ok).toBe(false);
    expect(validerDent(19).ok).toBe(false); // rang 9 n'existe pas
    expect(validerDent(56).ok).toBe(false); // temporaire au-delà du rang 5
    expect(validerDent(0).ok).toBe(false);
  });
});

describe('validerQuantite', () => {
  it('accepte un entier positif, zéro compris', () => {
    expect(validerQuantite(0)).toEqual({ ok: true, valeur: 0 });
    expect(validerQuantite(120)).toEqual({ ok: true, valeur: 120 });
  });

  it('refuse un stock négatif, une décimale ou une quantité absurde', () => {
    expect(validerQuantite(-5).ok).toBe(false);
    expect(validerQuantite(2.5).ok).toBe(false);
    expect(validerQuantite(QUANTITE_MAX + 1).ok).toBe(false);
  });
});

describe('validerCreneau', () => {
  const dansUnMois = new Date(Date.now() + 30 * 86_400_000).toISOString();

  it('accepte un rendez-vous ordinaire', () => {
    const r = validerCreneau(dansUnMois, 30);
    expect(r.ok).toBe(true);
  });

  it('refuse une durée nulle, négative ou démesurée', () => {
    expect(validerCreneau(dansUnMois, 0).ok).toBe(false);
    expect(validerCreneau(dansUnMois, -30).ok).toBe(false);
    expect(validerCreneau(dansUnMois, 10_000).ok).toBe(false);
  });

  it('refuse une durée non entière et une date illisible', () => {
    expect(validerCreneau(dansUnMois, 22.5).ok).toBe(false);
    expect(validerCreneau('pas une date', 30).ok).toBe(false);
  });

  it('refuse une année manifestement mal saisie', () => {
    expect(validerCreneau('2226-01-01T10:00:00Z', 30).ok).toBe(false);
  });
});

describe('validerNom et validerTelephone', () => {
  it('accepte un nom sénégalais courant', () => {
    expect(validerNom('Issakha Mbaye')).toEqual({ ok: true, valeur: 'Issakha Mbaye' });
  });

  it('refuse un nom vide ou réduit à une lettre', () => {
    expect(validerNom('').ok).toBe(false);
    expect(validerNom('M').ok).toBe(false);
  });

  it('accepte un numéro sénégalais avec ou sans indicatif', () => {
    expect(validerTelephone('+221 77 843 87 86').ok).toBe(true);
    expect(validerTelephone('778438786').ok).toBe(true);
  });

  it('refuse un numéro qui n’en est pas un', () => {
    expect(validerTelephone('appelez le cabinet').ok).toBe(false);
  });
});

describe('bornerTexte', () => {
  it('coupe au-delà de la limite et rend null sur une saisie vide', () => {
    expect(bornerTexte('IPM Cap Vert', 80)).toBe('IPM Cap Vert');
    expect(bornerTexte('x'.repeat(200), 80)).toHaveLength(80);
    expect(bornerTexte('   ', 80)).toBeNull();
    expect(bornerTexte(undefined, 80)).toBeNull();
  });
});
