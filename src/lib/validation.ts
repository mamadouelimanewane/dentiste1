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

// Plafond volontairement large : l'acte le plus cher de la nomenclature est
// à 120 000 F. Au-delà de 5 millions, c'est une faute de frappe, pas un
// soin — et sans borne, un zéro de trop injectait près de mille milliards
// de chiffre d'affaires dans la comptabilité.
export const MONTANT_MAX = 5_000_000;

export function validerMontant(
  valeur: unknown,
  { obligatoire = true }: { obligatoire?: boolean } = {}
): { ok: true; valeur: number } | { ok: false; erreur: string } {
  if (valeur === undefined || valeur === null || valeur === '') {
    if (obligatoire) return { ok: false, erreur: 'Le montant est requis.' };
    return { ok: true, valeur: 0 };
  }

  const n = Number(valeur);
  if (!Number.isFinite(n)) {
    return { ok: false, erreur: 'Montant invalide : un nombre est attendu.' };
  }
  if (n < 0) {
    // Un avoir se saisit par une facture d'avoir, pas par un acte négatif
    // qui viendrait diminuer silencieusement le chiffre d'affaires.
    return { ok: false, erreur: 'Le montant ne peut pas être négatif.' };
  }
  if (n > MONTANT_MAX) {
    return {
      ok: false,
      erreur: `Montant improbable (plafond ${MONTANT_MAX.toLocaleString('fr-FR')} FCFA). Vérifiez la saisie.`,
    };
  }
  return { ok: true, valeur: Math.round(n) };
}

// Notation FDI : dents permanentes 11–18, 21–28, 31–38, 41–48 ;
// dents temporaires 51–55, 61–65, 71–75, 81–85. Une « dent 999 » n'existe
// pas et n'a rien à faire dans un dossier clinique.
export function validerDent(
  valeur: unknown
): { ok: true; valeur: number | null } | { ok: false; erreur: string } {
  if (valeur === undefined || valeur === null || valeur === '') {
    return { ok: true, valeur: null };
  }
  const n = Number(valeur);
  if (!Number.isInteger(n)) {
    return { ok: false, erreur: 'Numéro de dent invalide.' };
  }
  const quadrant = Math.floor(n / 10);
  const rang = n % 10;
  const permanente = quadrant >= 1 && quadrant <= 4 && rang >= 1 && rang <= 8;
  const temporaire = quadrant >= 5 && quadrant <= 8 && rang >= 1 && rang <= 5;

  if (!permanente && !temporaire) {
    return {
      ok: false,
      erreur: `Numéro de dent hors notation FDI (${n}). Attendu 11–48 ou 51–85.`,
    };
  }
  return { ok: true, valeur: n };
}

// Quantités de stock. La colonne est un `integer` PostgreSQL : au-delà de
// 2 147 483 647 l'insertion échoue en 500. Sans borne inférieure, le stock
// pouvait tomber à -500 aiguilles, ce qui fausse les alertes de réassort.
export const QUANTITE_MAX = 1_000_000;

export function validerQuantite(
  valeur: unknown
): { ok: true; valeur: number } | { ok: false; erreur: string } {
  const n = Number(valeur);
  if (!Number.isFinite(n)) {
    return { ok: false, erreur: 'Quantité invalide : un nombre entier est attendu.' };
  }
  if (!Number.isInteger(n)) {
    return { ok: false, erreur: 'La quantité doit être un nombre entier.' };
  }
  if (n < 0) {
    return { ok: false, erreur: 'La quantité ne peut pas être négative.' };
  }
  if (n > QUANTITE_MAX) {
    return {
      ok: false,
      erreur: `Quantité improbable (plafond ${QUANTITE_MAX.toLocaleString('fr-FR')}). Vérifiez la saisie.`,
    };
  }
  return { ok: true, valeur: n };
}

// Rendez-vous. Sans bornes : une durée négative créait un créneau qui finit
// avant de commencer (et rendait la détection de conflits inopérante), une
// durée de 10 000 minutes bloquait l'agenda une semaine entière, et une
// date illisible faisait planter la route en 500.
export const DUREE_MIN = 5;
export const DUREE_MAX = 480; // 8 heures : au-delà, c'est une erreur de saisie
const ANS_MAX_A_L_AVANCE = 2;

export function validerCreneau(
  scheduledAt: unknown,
  durationMinutes: unknown
):
  | { ok: true; debut: string; duree: number }
  | { ok: false; erreur: string } {
  const d = new Date(String(scheduledAt ?? ''));
  if (Number.isNaN(d.getTime())) {
    return { ok: false, erreur: 'Date et heure du rendez-vous invalides.' };
  }

  const limite = new Date();
  limite.setFullYear(limite.getFullYear() + ANS_MAX_A_L_AVANCE);
  if (d > limite) {
    return {
      ok: false,
      erreur: `Date trop lointaine (au-delà de ${ANS_MAX_A_L_AVANCE} ans). Vérifiez l'année saisie.`,
    };
  }

  const n = Number(durationMinutes);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    return { ok: false, erreur: 'Durée invalide : un nombre entier de minutes est attendu.' };
  }
  if (n < DUREE_MIN) {
    return { ok: false, erreur: `La durée doit être d'au moins ${DUREE_MIN} minutes.` };
  }
  if (n > DUREE_MAX) {
    return { ok: false, erreur: `Durée improbable (plafond ${DUREE_MAX} minutes).` };
  }

  return { ok: true, debut: d.toISOString(), duree: n };
}
