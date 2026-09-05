// Valeur de la lettre-clé D par défaut, en FCFA.
//
// Elle ne fait plus autorité : la base réelle vient de `clinic_settings.valeur_d`
// pour le tarif du cabinet, ou de la convention choisie. Cette constante ne
// sert qu'à calculer les prix affichés tant que le paramétrage n'est pas
// chargé, et à garder cohérents les `price` figés ci-dessous.
export const D_VALUE = 1200;

// Cotation « D15 » → 15. Renvoie null si l'acte n'en porte pas.
export function coefficientCotation(cotation?: string): number | null {
  if (!cotation) return null;
  const m = /^D\s*(\d+(?:[.,]\d+)?)$/i.exec(cotation.trim());
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// Prix d'un acte pour une valeur de D donnée.
//
// On met le prix du catalogue à l'échelle, plutôt que de le recalculer depuis
// la cotation. La différence compte : « Appareil 13 à 14 dents » est coté D135
// mais tarifé 180 000 F, là où 135 × 1 200 donnerait 162 000. Recalculer
// depuis la cotation ferait donc BAISSER ce prix de 18 000 F sans que
// personne ne l'ait décidé. La mise à l'échelle préserve le tarif voulu par le
// cabinet et reste exacte pour tous les actes cohérents.
//
// La cotation ne sert de repli que pour un acte sans prix enregistré.
export function prixSelonD(acte: DentalProcedure, valeurD: number): number {
  if (typeof acte.price === 'number' && acte.price > 0) {
    if (valeurD === D_VALUE) return acte.price;
    return Math.round((acte.price * valeurD) / D_VALUE);
  }
  const coef = coefficientCotation(acte.cotation);
  return coef === null ? 0 : Math.round(coef * valeurD);
}

export type DentalProcedure = {
  id: string;
  category: string;
  label: string;
  cotation?: string;
  price?: number;
};

export const DENTAL_NOMENCLATURE: DentalProcedure[] = [
  // I — CONSULTATIONS
  { id: "CONS1", category: "CONSULTATIONS", label: "Consultation simple", cotation: "D5", price: 6000 },
  { id: "CONS4", category: "CONSULTATIONS", label: "Consultation et soins d'urgence", cotation: "D10", price: 12000 },

  // II — SOINS CONSERVATEURS - Amalgame
  { id: "AMAL1", category: "SOINS CONSERVATEURS", label: "Amalgame : Cavité simple (1 face)", cotation: "D10", price: 12000 },
  { id: "AMAL2", category: "SOINS CONSERVATEURS", label: "Amalgame : Cavité composée (2 faces)", cotation: "D12", price: 14400 },
  { id: "AMAL3", category: "SOINS CONSERVATEURS", label: "Amalgame : Cavité composée (3 faces)", cotation: "D15", price: 18000 },
  { id: "AMAL4", category: "SOINS CONSERVATEURS", label: "Amalgame : Cavité complexe (screw-post/tenon)", cotation: "D20", price: 24000 },

  // II — SOINS CONSERVATEURS - Composites
  { id: "COMP1", category: "SOINS CONSERVATEURS", label: "Composite : Cavité simple (1 face)", cotation: "D15", price: 18000 },
  { id: "COMP2", category: "SOINS CONSERVATEURS", label: "Composite : Cavité composée (2 faces)", cotation: "D20", price: 24000 },
  { id: "COMP3", category: "SOINS CONSERVATEURS", label: "Composite : Cavité composée (3 faces)", cotation: "D25", price: 30000 },
  { id: "COMP4", category: "SOINS CONSERVATEURS", label: "Composite : Cavité complexe (screw-post/tenon)", cotation: "D30", price: 36000 },

  // II — SOINS CONSERVATEURS - Pulpe et Canaux
  { id: "PULP1", category: "SOINS CONSERVATEURS", label: "Pulpotomie", cotation: "D10", price: 12000 },
  { id: "ENDO1", category: "SOINS CONSERVATEURS", label: "Pulpectomie permanente : Incisivo-canin", cotation: "D15", price: 18000 },
  { id: "ENDO2", category: "SOINS CONSERVATEURS", label: "Pulpectomie permanente : Prémolaire", cotation: "D20", price: 24000 },
  { id: "ENDO3", category: "SOINS CONSERVATEURS", label: "Pulpectomie permanente : Molaires", cotation: "D25", price: 30000 },
  { id: "ENDO4", category: "SOINS CONSERVATEURS", label: "Pulpectomie lactéale : Incisivo-canin", cotation: "D10", price: 12000 },
  { id: "ENDO5", category: "SOINS CONSERVATEURS", label: "Pulpectomie lactéale : Molaires", cotation: "D15", price: 18000 },

  // III — SOINS PARODONTAUX
  { id: "PARO1", category: "SOINS PARODONTAUX", label: "Enseignement d'hygiène", cotation: "D5", price: 6000 },
  { id: "PARO2", category: "SOINS PARODONTAUX", label: "Application de fluor (par séance)", cotation: "D10", price: 12000 },
  { id: "PARO3", category: "SOINS PARODONTAUX", label: "Gouttière occlusale", cotation: "D40", price: 48000 },
  { id: "PARO4", category: "SOINS PARODONTAUX", label: "Curetage parodontal (par quadran)", cotation: "D15", price: 18000 },

  // IV — SOINS CHIRURGICAUX - Extractions simples
  { id: "EXT1", category: "SOINS CHIRURGICAUX", label: "Extraction d'une incisive", cotation: "D10", price: 12000 },
  { id: "EXT1S", category: "SOINS CHIRURGICAUX", label: "Incisive supplémentaire (même séance)", cotation: "D5", price: 6000 },
  { id: "EXT2", category: "SOINS CHIRURGICAUX", label: "Extraction canine ou prémolaire", cotation: "D12", price: 14400 },
  { id: "EXT2S", category: "SOINS CHIRURGICAUX", label: "Canine/Prémolaire suppl. (même séance)", cotation: "D6", price: 7200 },
  { id: "EXT3", category: "SOINS CHIRURGICAUX", label: "Extraction d'une molaire", cotation: "D15", price: 18000 },
  { id: "EXT3S", category: "SOINS CHIRURGICAUX", label: "Molaire supplémentaire (même séance)", cotation: "D8", price: 9600 },
  { id: "EXT4", category: "SOINS CHIRURGICAUX", label: "Extraction dent de sagesse", cotation: "D20", price: 24000 },
  { id: "EXT5", category: "SOINS CHIRURGICAUX", label: "Extraction dent de lait", cotation: "D8", price: 9600 },
  { id: "EXT5S", category: "SOINS CHIRURGICAUX", label: "Dent de lait suppl. (même séance)", cotation: "D4", price: 4800 },

  // IV — SOINS CHIRURGICAUX - Extractions complexes
  { id: "EXTC1", category: "SOINS CHIRURGICAUX", label: "Extraction dent enclavée", cotation: "D40", price: 48000 },
  { id: "EXTC2", category: "SOINS CHIRURGICAUX", label: "Extraction dent incluse", cotation: "D50", price: 60000 },
  { id: "GERM1", category: "SOINS CHIRURGICAUX", label: "Germectomie dent de sagesse", cotation: "D40", price: 48000 },
  { id: "GERM2", category: "SOINS CHIRURGICAUX", label: "Germectomie autres dents", cotation: "D20", price: 24000 },

  // IV — SOINS CHIRURGICAUX - Lésions
  { id: "CHIR1", category: "SOINS CHIRURGICAUX", label: "Cellulite périmaxillaire (incision/drainage)", cotation: "D15", price: 18000 },
  { id: "CHIR2", category: "SOINS CHIRURGICAUX", label: "Régularisation crête alvéolaire", cotation: "D10", price: 12000 },
  { id: "CHIR3", category: "SOINS CHIRURGICAUX", label: "Curetage péri-apical sans résection", cotation: "D25", price: 30000 },
  { id: "CHIR4", category: "SOINS CHIRURGICAUX", label: "Curetage péri-apical avec résection", cotation: "D25", price: 30000 },
  { id: "CHIR5", category: "SOINS CHIRURGICAUX", label: "Exérèse chirurgicale d'un kyste", cotation: "D25", price: 30000 },
  { id: "CHIR6", category: "SOINS CHIRURGICAUX", label: "Traitement hémorragie post-op", cotation: "D10", price: 12000 },

  // VI — PROTHÈSE DENTAIRE - Fixée
  { id: "PROTF1", category: "PROTHÈSE DENTAIRE", label: "Couronne coulée", cotation: "D80", price: 96000 },
  { id: "PROTF2", category: "PROTHÈSE DENTAIRE", label: "CIV Résine (dent à tenon)", cotation: "D100", price: 120000 },
  { id: "PROTF3", category: "PROTHÈSE DENTAIRE", label: "CIV Céramique", cotation: "D140", price: 168000 },
  { id: "PROTF4", category: "PROTHÈSE DENTAIRE", label: "Céramique pure", cotation: "D250", price: 300000 },

  // VI — PROTHÈSE DENTAIRE - Adjointe Résine
  { id: "PROTA1", category: "PROTHÈSE DENTAIRE", label: "Appareil 1 à 3 dents", cotation: "D30", price: 36000 },
  { id: "PROTA2", category: "PROTHÈSE DENTAIRE", label: "Appareil 4 dents", cotation: "D35", price: 42000 },
  { id: "PROTA3", category: "PROTHÈSE DENTAIRE", label: "Appareil 5 dents", cotation: "D40", price: 48000 },
  { id: "PROTA4", category: "PROTHÈSE DENTAIRE", label: "Appareil 6 dents", cotation: "D45", price: 54000 },
  { id: "PROTA5", category: "PROTHÈSE DENTAIRE", label: "Appareil 7 dents", cotation: "D60", price: 72000 },
  { id: "PROTA6", category: "PROTHÈSE DENTAIRE", label: "Appareil 8 dents", cotation: "D70", price: 84000 },
  { id: "PROTA7", category: "PROTHÈSE DENTAIRE", label: "Appareil 9 dents", cotation: "D80", price: 96000 },
  { id: "PROTA8", category: "PROTHÈSE DENTAIRE", label: "Appareil 10 dents", cotation: "D90", price: 108000 },
  { id: "PROTA9", category: "PROTHÈSE DENTAIRE", label: "Appareil 11 dents", cotation: "D100", price: 120000 },
  { id: "PROTA10", category: "PROTHÈSE DENTAIRE", label: "Appareil 12 dents", cotation: "D110", price: 132000 },
  { id: "PROTA11", category: "PROTHÈSE DENTAIRE", label: "Appareil 13 à 14 dents", cotation: "D135", price: 180000 },
  { id: "PROTA12", category: "PROTHÈSE DENTAIRE", label: "Prothèse adjointe totale unimaxillaire", cotation: "D120", price: 144000 },
  { id: "PROTA_REP", category: "PROTHÈSE DENTAIRE", label: "Dent/Crochet ajouté sur résine", cotation: "D10", price: 12000 },

  // VII — ORTHOPÉDIE DENTO-FACIALE
  { id: "ODF1", category: "ORTHOPÉDIE DENTO-FACIALE", label: "Examen avec diagnostic (radio comprise)", cotation: "D15", price: 18000 },
  { id: "ODF2", category: "ORTHOPÉDIE DENTO-FACIALE", label: "Traitement dysmorphoses (par 6 mois)", cotation: "D90", price: 108000 },

  // VIII — RADIOGRAPHIE
  { id: "RAD1", category: "RADIOGRAPHIE", label: "Film occlusal du rétroalvéolaire", cotation: "D5", price: 6000 },
];
