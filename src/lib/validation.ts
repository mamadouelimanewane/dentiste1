import 'server-only';

// Validation partagée des saisies patient.
//
// Les routes n'exigeaient qu'un `fullName` non vide au sens de JavaScript :
// une chaîne de trois espaces, un téléphone « pas-un-numero » ou un nom de
// 10 000 caractères étaient acceptés. Dans un cabinet, cela produit des
// dossiers sans nom, des rappels qui n'arrivent jamais et des documents
// imprimés illisibles.

export const NOM_MIN = 2;
export const NOM_MAX = 120;

export function nettoyerNom(valeur: unknown): string {
  // Espaces multiples réduits : « Fatou   Ndiaye » et « Fatou Ndiaye »
  // doivent désigner le même dossier dans les recherches.
  return String(valeur ?? '').replace(/\s+/g, ' ').trim();
}

export function validerNom(valeur: unknown): { ok: true; valeur: string } | { ok: false; erreur: string } {
  const nom = nettoyerNom(valeur);
  if (nom.length < NOM_MIN) {
    return { ok: false, erreur: 'Le nom complet est requis (2 caractères minimum).' };
  }
  if (nom.length > NOM_MAX) {
    return { ok: false, erreur: `Le nom ne peut pas dépasser ${NOM_MAX} caractères.` };
  }
  return { ok: true, valeur: nom };
}

// Numéros sénégalais et internationaux : chiffres, espaces, points, tirets et
// un « + » initial. On normalise en supprimant les séparateurs pour que le
// même numéro saisi de deux façons ne crée pas deux fiches.
export function normaliserTelephone(valeur: unknown): string {
  return String(valeur ?? '').replace(/[\s.\-()]/g, '').trim();
}

export function validerTelephone(
  valeur: unknown
): { ok: true; valeur: string | null } | { ok: false; erreur: string } {
  const brut = normaliserTelephone(valeur);
  if (!brut) return { ok: true, valeur: null };

  if (!/^\+?\d{8,15}$/.test(brut)) {
    return {
      ok: false,
      erreur:
        'Numéro invalide. Attendu : 8 à 15 chiffres, éventuellement précédés de « + » (ex. +221 77 123 45 67).',
    };
  }
  return { ok: true, valeur: brut };
}

// Champs libres (adresse, allergies, mutuelle) : on borne la longueur pour
// que rien ne fasse exploser une ordonnance ou une facture imprimée.
export function bornerTexte(valeur: unknown, max: number): string | null {
  const s = String(valeur ?? '').trim();
  if (!s) return null;
  return s.slice(0, max);
}

// Une date de naissance dans le futur, ou antérieure à 1900, est une erreur
// de saisie — pas un patient.
export function validerDateNaissance(
  valeur: unknown
): { ok: true; valeur: string | null } | { ok: false; erreur: string } {
  const s = String(valeur ?? '').trim();
  if (!s) return { ok: true, valeur: null };

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, erreur: 'Date de naissance invalide.' };
  }
  if (d.getTime() > Date.now()) {
    return { ok: false, erreur: 'La date de naissance ne peut pas être dans le futur.' };
  }
  if (d.getFullYear() < 1900) {
    return { ok: false, erreur: 'Date de naissance improbable (antérieure à 1900).' };
  }
  return { ok: true, valeur: s };
}
