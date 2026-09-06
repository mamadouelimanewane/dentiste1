import type { ElementType } from 'react';
import {
  UserPlus, LogIn, RotateCcw, Stethoscope, Activity, FileText,
  History, Calculator, ShieldCheck, Users, Video, Brain,
  Calendar, Scan, Smile, Layers, Pill, MessageSquare,
  Package, FolderOpen, Settings, ShieldAlert, Database, LayoutGrid,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DentalCategoryKey = 'patient' | 'clinique' | 'gestion' | 'ia' | 'systeme';

export interface DentalModule {
  id: number;
  name: string;
  fullTitle: string;
  desc: string;
  icon: ElementType;
  badge?: string;
}

export interface DentalGroup {
  key: DentalCategoryKey;
  label: string;
  hint: string;
  modules: DentalModule[];
}

// ── Couleurs par catégorie ────────────────────────────────────────────────────

export const DENTAL_CATEGORY_STYLE: Record<
  DentalCategoryKey,
  { color: string; tint: string; ring: string; icon: ElementType }
> = {
  patient:  { color: '#2563eb', tint: '#eff6ff', ring: 'rgba(37,99,235,0.30)',   icon: UserPlus    },
  clinique: { color: '#059669', tint: '#ecfdf5', ring: 'rgba(5,150,105,0.30)',   icon: Stethoscope },
  gestion:  { color: '#d97706', tint: '#fffbeb', ring: 'rgba(217,119,6,0.30)',   icon: FileText    },
  ia:       { color: '#7c3aed', tint: '#f5f3ff', ring: 'rgba(124,58,237,0.30)',  icon: Brain       },
  systeme:  { color: '#0f766e', tint: '#f0fdfa', ring: 'rgba(15,118,110,0.30)',  icon: Settings    },
};

// ── Registre complet des 24 modules ──────────────────────────────────────────

export const DENTAL_MODULE_GROUPS: DentalGroup[] = [
  {
    key: 'patient',
    label: 'Gestion Patient',
    hint: 'Accueil, rendez-vous et admission',
    modules: [
      { id: 1,  name: 'Accueil',       fullTitle: 'Accueil & prise en charge',   desc: 'Enregistrement, bienvenue SMS/WhatsApp et vérification des droits.',  icon: UserPlus   },
      { id: 2,  name: 'Arrivée',       fullTitle: 'Arrivée au cabinet',          desc: 'Pointage et questionnaire médical numérique.',                          icon: LogIn      },
      { id: 3,  name: 'Nouveau Dossier', fullTitle: 'Nouveau dossier patient',   desc: 'Réinitialisation et nouveau cycle patient.',                            icon: RotateCcw  },
      { id: 13, name: 'Agenda',         fullTitle: 'Agenda du cabinet',        desc: "Rendez-vous, salle d'attente, reports et rappels aux patients.", icon: Calendar  },
      { id: 18, name: 'Communication',  fullTitle: 'Messages aux patients',        desc: 'Envoi automatique et manuel de messages patients.',                       icon: MessageSquare },
    ],
  },
  {
    key: 'clinique',
    label: 'Clinique & Soins',
    hint: 'Actes, diagnostics et prothèses',
    modules: [
      { id: 4,  name: 'Consultation',  fullTitle: 'Consultation clinique',        desc: 'Diagnostic, odontogramme et plan de traitement.',                      icon: Stethoscope},
      { id: 5,  name: 'Réalisation',   fullTitle: 'Réalisation des actes',       desc: 'Enregistrement des soins et interventions en temps réel.',              icon: Activity   },
      { id: 7,  name: 'Suivi',         fullTitle: 'Suivi & archivage',           desc: 'Clôture du dossier et planification des prochains RDV.',                icon: History    },
      { id: 14, name: 'Imagerie',       fullTitle: 'Clichés du patient',     desc: 'Consultation des radiographies importées.',                              icon: Scan },
      { id: 15, name: 'Comparaison',    fullTitle: 'Comparaison de clichés',     desc: 'Superposition de deux photographies du dossier patient.',                icon: Smile },
      { id: 16, name: 'Labo & CFAO',    fullTitle: 'Laboratoire & prothèses',     desc: 'Flux numériques et travaux prothétiques.',                               icon: Layers   },
      { id: 17, name: 'Ordonnances',    fullTitle: "Ordonnances",       desc: 'Création, impression et envoi numérique d\'ordonnances.',                icon: Pill     },
      { id: 11, name: 'Téléconsult',    fullTitle: 'Téléconsultation',        desc: 'Consultations vidéo sécurisées (Daily.co).',                            icon: Video    },
      { id: 20, name: 'Recherche',     fullTitle: 'Recherche de dossiers', desc: 'Recherche et accès rapide à tous les dossiers patients.',               icon: FolderOpen },
    ],
  },
  {
    key: 'gestion',
    label: 'Gestion Administrative',
    hint: 'Finances et communication',
    modules: [
      { id: 6,  name: 'Facturation',   fullTitle: 'Facturation & règlements',  desc: 'Devis, facturation et enregistrement des paiements.',                    icon: FileText   },
      { id: 8,  name: 'Comptabilité',   fullTitle: 'Comptabilité & finances',   desc: 'Registre des recettes, dépenses et rapports financiers.',                icon: Calculator },
      { id: 9,  name: 'Mutuelles',      fullTitle: 'Prises en charge mutuelles',     desc: 'Prises en charge IPM, assurances et calcul automatique des parts.',      icon: ShieldCheck},
      { id: 19, name: 'Stocks',         fullTitle: 'Stock du cabinet',     desc: 'Consommables, alertes de stock et commandes fournisseurs.',              icon: Package    },
    ],
  },
  {
    key: 'ia',
    label: 'Outils & Analyse',
    hint: "Dictée vocale, statistiques et journal d'activité",
    modules: [
      { id: 12, name: 'Dictée vocale',  fullTitle: 'Dictée vocale',             desc: 'Reconnaissance vocale du navigateur, sauvegarde locale.',                 icon: Brain },
      { id: 23, name: 'Statistiques',   fullTitle: 'Statistiques du cabinet', desc: 'KPIs, analyse de performance et pilotage confidentiel.',               icon: Calculator, badge: 'NEW' },
      { id: 24, name: 'Journal',        fullTitle: "Journal d'activité",        desc: "Historique des actions enregistrees par l'assistant de saisie.",        icon: Database   },
    ],
  },
  {
    key: 'systeme',
    label: 'Système & Administration',
    hint: 'Utilisateurs, config et accès',
    modules: [
      { id: 10, name: 'Utilisateurs',  fullTitle: 'Comptes et rôles',   desc: 'Rôles RBAC, privilèges et gestion des comptes staff.',                   icon: Users      },
      { id: 21, name: 'Configuration', fullTitle: 'Configuration du cabinet',   desc: 'Logo, informations légales et personnalisation des documents.',           icon: Settings   },
      { id: 22, name: 'Super Admin',   fullTitle: "Administration du cabinet", desc: 'Logs, catalogue des actes et Business Intelligence.',                     icon: ShieldAlert},
    ],
  },
];

export const DENTAL_TOTAL_MODULES = DENTAL_MODULE_GROUPS.reduce((n, g) => n + g.modules.length, 0);

// ── Helpers localStorage (préférence vue portail vs. workflow) ────────────────

const HOME_KEY = 'dentiste_home_view';

export function getDentalHomeView(): 'portal' | 'workflow' {
  return localStorage.getItem(HOME_KEY) === 'workflow' ? 'workflow' : 'portal';
}

export function setDentalHomeView(v: 'portal' | 'workflow') {
  localStorage.setItem(HOME_KEY, v);
}
