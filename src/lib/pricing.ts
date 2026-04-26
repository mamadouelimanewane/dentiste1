export const D_VALUE = 1200;

export type DentalProcedure = {
  id: string;
  category: string;
  label: string;
  cotation?: string;
  price?: number;
};

export const DENTAL_NOMENCLATURE: DentalProcedure[] = [
  { id: "C1", category: "CONSULTATIONS", label: "Consultation simple", cotation: "D5", price: 6000 },
  { id: "C4", category: "CONSULTATIONS", label: "Consultation d'urgence", cotation: "D10", price: 12000 },
  { id: "SCC1", category: "SOINS", label: "Obturation composite (1 face)", cotation: "D15", price: 18000 },
  { id: "CHIR1", category: "CHIRURGIE", label: "Extraction simple", cotation: "D10", price: 12000 },
  { id: "PROT1", category: "PROTHÈSE", label: "Couronne coulée", cotation: "D80", price: 96000 },
  { id: "PROT3", category: "PROTHÈSE", label: "CIV Céramique", cotation: "D140", price: 168000 },
];
