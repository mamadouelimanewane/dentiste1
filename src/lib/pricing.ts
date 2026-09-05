// Valeur de la lettre-clé D par défaut, en FCFA.
//
// Elle ne fait plus autorité : la base réelle vient de `clinic_settings.valeur_d`
// pour le tarif du cabinet, ou de la convention choisie. Cette constante ne
// sert qu'à calculer les prix affichés tant que le paramétrage n'est pas
// chargé.
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
// La cotation est la SEULE source du prix. Le catalogue portait auparavant les
// deux — une cotation et un prix figé — et les deux pouvaient se contredire :
// « Appareil 13 à 14 dents » était coté D135 et tarifé 180 000 F, là où
// 135 × 1 200 donne 162 000. Le prix figé l'emportait en silence, si bien que
// le devis affichait une cotation qui ne correspondait pas au montant réclamé,
// et qu'un contrôle par l'organisme payeur ne pouvait que le relever.
//
// Le contrôle des 59 actes n'a trouvé que cette seule discordance : les 58
// autres respectaient exactement cotation × 1 200. C'était donc une faute de
// saisie isolée, et la cotation D135 est cohérente avec la progression de la
// série (D110 pour 12 dents, D120 pour la prothèse totale). Retirer les prix
// figés ne change donc AUCUN tarif, hormis celui-là, qui repasse à 162 000 F.
//
// Ce champ `price` reste dans le type pour un acte hors nomenclature dont le
// prix serait fixé directement, mais aucun acte du catalogue n'en porte : la
// contradiction ne peut plus se reproduire.
export function prixSelonD(acte: DentalProcedure, valeurD: number): number {
  const coef = coefficientCotation(acte.cotation);
  if (coef !== null) return Math.round(coef * valeurD);
  if (typeof acte.price === 'number' && acte.price > 0) {
    return valeurD === D_VALUE ? acte.price : Math.round((acte.price * valeurD) / D_VALUE);
  }
  return 0;
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
  { id: "CONS1", category: "CONSULTATIONS", label: "Consultation simple", cotation: "D5" },
  { id: "CONS4", category: "CONSULTATIONS", label: "Consultation et soins d'urgence", cotation: "D10" },

  // II — SOINS CONSERVATEURS - Amalgame
  { id: "AMAL1", category: "SOINS CONSERVATEURS", label: "Amalgame : Cavité simple (1 face)", cotation: "D10" },
  { id: "AMAL2", category: "SOINS CONSERVATEURS", label: "Amalgame : Cavité composée (2 faces)", cotation: "D12" },
  { id: "AMAL3", category: "SOINS CONSERVATEURS", label: "Amalgame : Cavité composée (3 faces)", cotation: "D15" },
  { id: "AMAL4", category: "SOINS CONSERVATEURS", label: "Amalgame : Cavité complexe (screw-post/tenon)", cotation: "D20" },

  // II — SOINS CONSERVATEURS - Composites
  { id: "COMP1", category: "SOINS CONSERVATEURS", label: "Composite : Cavité simple (1 face)", cotation: "D15" },
  { id: "COMP2", category: "SOINS CONSERVATEURS", label: "Composite : Cavité composée (2 faces)", cotation: "D20" },
  { id: "COMP3", category: "SOINS CONSERVATEURS", label: "Composite : Cavité composée (3 faces)", cotation: "D25" },
  { id: "COMP4", category: "SOINS CONSERVATEURS", label: "Composite : Cavité complexe (screw-post/tenon)", cotation: "D30" },

  // II — SOINS CONSERVATEURS - Pulpe et Canaux
  { id: "PULP1", category: "SOINS CONSERVATEURS", label: "Pulpotomie", cotation: "D10" },
  { id: "ENDO1", category: "SOINS CONSERVATEURS", label: "Pulpectomie permanente : Incisivo-canin", cotation: "D15" },
  { id: "ENDO2", category: "SOINS CONSERVATEURS", label: "Pulpectomie permanente : Prémolaire", cotation: "D20" },
  { id: "ENDO3", category: "SOINS CONSERVATEURS", label: "Pulpectomie permanente : Molaires", cotation: "D25" },
  { id: "ENDO4", category: "SOINS CONSERVATEURS", label: "Pulpectomie lactéale : Incisivo-canin", cotation: "D10" },
  { id: "ENDO5", category: "SOINS CONSERVATEURS", label: "Pulpectomie lactéale : Molaires", cotation: "D15" },

  // III — SOINS PARODONTAUX
  { id: "PARO1", category: "SOINS PARODONTAUX", label: "Enseignement d'hygiène", cotation: "D5" },
  { id: "PARO2", category: "SOINS PARODONTAUX", label: "Application de fluor (par séance)", cotation: "D10" },
  { id: "PARO3", category: "SOINS PARODONTAUX", label: "Gouttière occlusale", cotation: "D40" },
  { id: "PARO4", category: "SOINS PARODONTAUX", label: "Curetage parodontal (par quadran)", cotation: "D15" },

  // IV — SOINS CHIRURGICAUX - Extractions simples
  { id: "EXT1", category: "SOINS CHIRURGICAUX", label: "Extraction d'une incisive", cotation: "D10" },
  { id: "EXT1S", category: "SOINS CHIRURGICAUX", label: "Incisive supplémentaire (même séance)", cotation: "D5" },
  { id: "EXT2", category: "SOINS CHIRURGICAUX", label: "Extraction canine ou prémolaire", cotation: "D12" },
  { id: "EXT2S", category: "SOINS CHIRURGICAUX", label: "Canine/Prémolaire suppl. (même séance)", cotation: "D6" },
  { id: "EXT3", category: "SOINS CHIRURGICAUX", label: "Extraction d'une molaire", cotation: "D15" },
  { id: "EXT3S", category: "SOINS CHIRURGICAUX", label: "Molaire supplémentaire (même séance)", cotation: "D8" },
  { id: "EXT4", category: "SOINS CHIRURGICAUX", label: "Extraction dent de sagesse", cotation: "D20" },
  { id: "EXT5", category: "SOINS CHIRURGICAUX", label: "Extraction dent de lait", cotation: "D8" },
  { id: "EXT5S", category: "SOINS CHIRURGICAUX", label: "Dent de lait suppl. (même séance)", cotation: "D4" },

  // IV — SOINS CHIRURGICAUX - Extractions complexes
  { id: "EXTC1", category: "SOINS CHIRURGICAUX", label: "Extraction dent enclavée", cotation: "D40" },
  { id: "EXTC2", category: "SOINS CHIRURGICAUX", label: "Extraction dent incluse", cotation: "D50" },
  { id: "GERM1", category: "SOINS CHIRURGICAUX", label: "Germectomie dent de sagesse", cotation: "D40" },
  { id: "GERM2", category: "SOINS CHIRURGICAUX", label: "Germectomie autres dents", cotation: "D20" },

  // IV — SOINS CHIRURGICAUX - Lésions
  { id: "CHIR1", category: "SOINS CHIRURGICAUX", label: "Cellulite périmaxillaire (incision/drainage)", cotation: "D15" },
  { id: "CHIR2", category: "SOINS CHIRURGICAUX", label: "Régularisation crête alvéolaire", cotation: "D10" },
  { id: "CHIR3", category: "SOINS CHIRURGICAUX", label: "Curetage péri-apical sans résection", cotation: "D25" },
  { id: "CHIR4", category: "SOINS CHIRURGICAUX", label: "Curetage péri-apical avec résection", cotation: "D25" },
  { id: "CHIR5", category: "SOINS CHIRURGICAUX", label: "Exérèse chirurgicale d'un kyste", cotation: "D25" },
  { id: "CHIR6", category: "SOINS CHIRURGICAUX", label: "Traitement hémorragie post-op", cotation: "D10" },

  // VI — PROTHÈSE DENTAIRE - Fixée
  { id: "PROTF1", category: "PROTHÈSE DENTAIRE", label: "Couronne coulée", cotation: "D80" },
  { id: "PROTF2", category: "PROTHÈSE DENTAIRE", label: "CIV Résine (dent à tenon)", cotation: "D100" },
  { id: "PROTF3", category: "PROTHÈSE DENTAIRE", label: "CIV Céramique", cotation: "D140" },
  { id: "PROTF4", category: "PROTHÈSE DENTAIRE", label: "Céramique pure", cotation: "D250" },

  // VI — PROTHÈSE DENTAIRE - Adjointe Résine
  { id: "PROTA1", category: "PROTHÈSE DENTAIRE", label: "Appareil 1 à 3 dents", cotation: "D30" },
  { id: "PROTA2", category: "PROTHÈSE DENTAIRE", label: "Appareil 4 dents", cotation: "D35" },
  { id: "PROTA3", category: "PROTHÈSE DENTAIRE", label: "Appareil 5 dents", cotation: "D40" },
  { id: "PROTA4", category: "PROTHÈSE DENTAIRE", label: "Appareil 6 dents", cotation: "D45" },
  { id: "PROTA5", category: "PROTHÈSE DENTAIRE", label: "Appareil 7 dents", cotation: "D60" },
  { id: "PROTA6", category: "PROTHÈSE DENTAIRE", label: "Appareil 8 dents", cotation: "D70" },
  { id: "PROTA7", category: "PROTHÈSE DENTAIRE", label: "Appareil 9 dents", cotation: "D80" },
  { id: "PROTA8", category: "PROTHÈSE DENTAIRE", label: "Appareil 10 dents", cotation: "D90" },
  { id: "PROTA9", category: "PROTHÈSE DENTAIRE", label: "Appareil 11 dents", cotation: "D100" },
  { id: "PROTA10", category: "PROTHÈSE DENTAIRE", label: "Appareil 12 dents", cotation: "D110" },
  { id: "PROTA11", category: "PROTHÈSE DENTAIRE", label: "Appareil 13 à 14 dents", cotation: "D135" },
  { id: "PROTA12", category: "PROTHÈSE DENTAIRE", label: "Prothèse adjointe totale unimaxillaire", cotation: "D120" },
  { id: "PROTA_REP", category: "PROTHÈSE DENTAIRE", label: "Dent/Crochet ajouté sur résine", cotation: "D10" },

  // VII — ORTHOPÉDIE DENTO-FACIALE
  { id: "ODF1", category: "ORTHOPÉDIE DENTO-FACIALE", label: "Examen avec diagnostic (radio comprise)", cotation: "D15" },
  { id: "ODF2", category: "ORTHOPÉDIE DENTO-FACIALE", label: "Traitement dysmorphoses (par 6 mois)", cotation: "D90" },

  // VIII — RADIOGRAPHIE
  { id: "RAD1", category: "RADIOGRAPHIE", label: "Film occlusal du rétroalvéolaire", cotation: "D5" },
];
