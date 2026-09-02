// Catalogue partagé (serveur + client) des modules de l'application, utilisé
// à la fois pour l'affichage de la sidebar (dashboard/page.tsx) et pour la
// matrice de permissions des rôles (AdminHub). L'id correspond au numéro
// d'étape historique (steps[]) — ne pas réordonner/réutiliser un id existant.

export interface ModuleDef {
  id: number;
  label: string;
}

export const MODULES: ModuleDef[] = [
  { id: 1, label: "Accueil" },
  { id: 2, label: "Arrivée" },
  { id: 3, label: "Nouv. Dossier" },
  { id: 4, label: "Consultation" },
  { id: 5, label: "Réalisation" },
  { id: 6, label: "Administration" },
  { id: 7, label: "Suivi" },
  { id: 8, label: "Comptabilité" },
  { id: 9, label: "Mutuelles" },
  { id: 10, label: "Utilisateurs" },
  { id: 11, label: "Téléconsult" },
  { id: 12, label: "Dictée IA" },
  { id: 13, label: "Agenda" },
  { id: 14, label: "Radio IA" },
  { id: 15, label: "Comparaison clichés" },
  { id: 16, label: "Labo & CFAO" },
  { id: 17, label: "Ordonnances" },
  { id: 18, label: "Communication" },
  { id: 19, label: "Stocks" },
  { id: 20, label: "Recherche" },
  { id: 21, label: "Configuration" },
  { id: 22, label: "Super Admin" },
  { id: 23, label: "Statistiques" },
  { id: 24, label: "Neural Center" },
];

export type PermissionAction = "view" | "manage";

export type ModulePermissions = Record<string, { view?: boolean; manage?: boolean }>;

export function hasPermission(
  permissions: ModulePermissions | null | undefined,
  moduleId: number,
  action: PermissionAction
): boolean {
  if (!permissions) return false;
  const entry = permissions[String(moduleId)];
  if (!entry) return false;
  return action === "manage" ? !!entry.manage : !!(entry.view || entry.manage);
}
