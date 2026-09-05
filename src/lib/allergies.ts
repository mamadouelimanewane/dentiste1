// Rappel d'allergie à la prescription.
//
// CE QUE CECI EST : un rappel textuel entre l'allergie notée au dossier et le
// nom du médicament saisi, sur quelques familles courantes en odontologie.
//
// CE QUE CECI N'EST PAS : un contrôle d'interactions médicamenteuses. Il n'y a
// ici ni base pharmacologique, ni posologies, ni contre-indications, ni
// grossesse, ni insuffisance rénale. Une famille absente de cette liste ne
// déclenchera rien — l'ABSENCE D'ALERTE NE VEUT DONC RIEN DIRE.
//
// C'est délibéré et c'est la limite à tenir : un praticien qui se fierait au
// silence de ce module serait plus en danger qu'avec rien du tout. L'écran le
// dit en toutes lettres à côté de l'alerte.

interface Famille {
  // Ce que le cabinet a pu écrire dans le champ « allergies ».
  allergie: string[];
  // Molécules et noms commerciaux appartenant à cette famille.
  medicaments: string[];
  libelle: string;
}

const FAMILLES: Famille[] = [
  {
    libelle: 'pénicillines',
    allergie: ['penicilline', 'penicillines', 'beta-lactamine', 'betalactamine', 'amoxicilline', 'augmentin'],
    medicaments: ['amoxicilline', 'ampicilline', 'augmentin', 'clamoxyl', 'penicilline', 'oxacilline', 'cloxacilline'],
  },
  {
    libelle: 'anti-inflammatoires non stéroïdiens',
    allergie: ['ains', 'aspirine', 'acide acetylsalicylique', 'ibuprofene', 'anti-inflammatoire'],
    medicaments: ['ibuprofene', 'aspirine', 'acide acetylsalicylique', 'ketoprofene', 'diclofenac', 'naproxene', 'advil', 'nurofen'],
  },
  {
    libelle: 'macrolides',
    allergie: ['macrolide', 'erythromycine', 'azithromycine'],
    medicaments: ['erythromycine', 'azithromycine', 'clarithromycine', 'spiramycine', 'josamycine', 'rodogyl'],
  },
  {
    libelle: 'sulfamides',
    allergie: ['sulfamide', 'sulfamides', 'bactrim', 'cotrimoxazole'],
    medicaments: ['sulfamethoxazole', 'bactrim', 'cotrimoxazole', 'trimethoprime'],
  },
  {
    libelle: 'dérivés iodés',
    allergie: ['iode', 'iode', 'betadine', 'povidone'],
    medicaments: ['betadine', 'povidone', 'iode'],
  },
  {
    libelle: 'anesthésiques locaux',
    allergie: ['lidocaine', 'xylocaine', 'articaine', 'anesthesique local'],
    medicaments: ['lidocaine', 'xylocaine', 'articaine', 'mepivacaine', 'septanest'],
  },
];

// Minuscules sans accents : le champ « allergies » est saisi à la main, on y
// trouve aussi bien « PÉNICILLINE » que « pénicilline » ou « Penicilline ».
function normaliser(v: string) {
  return v
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export interface RappelAllergie {
  medicament: string;
  famille: string;
  allergieNotee: string;
}

// Rapproche les médicaments saisis de l'allergie notée au dossier.
export function rappelsAllergie(
  allergiesDuDossier: string | null | undefined,
  medicaments: { name: string }[]
): RappelAllergie[] {
  const allergies = normaliser(allergiesDuDossier || '');
  if (!allergies) return [];

  const rappels: RappelAllergie[] = [];
  for (const med of medicaments) {
    const nom = normaliser(med.name || '');
    if (!nom) continue;

    for (const famille of FAMILLES) {
      const dossierConcerne = famille.allergie.some((a) => allergies.includes(a));
      const medicamentConcerne = famille.medicaments.some((m) => nom.includes(m));
      if (dossierConcerne && medicamentConcerne) {
        rappels.push({
          medicament: med.name,
          famille: famille.libelle,
          allergieNotee: (allergiesDuDossier || '').trim(),
        });
        break;
      }
    }
  }
  return rappels;
}
