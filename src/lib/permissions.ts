import 'server-only';
import { sql } from '@/lib/db';
import { getStaffSession } from '@/lib/session';
import { hasPermission, type ModulePermissions, type PermissionAction } from '@/lib/modules';

export interface RoleRow {
  id: string;
  slug: string;
  label: string;
  is_system: boolean;
  is_practitioner: boolean;
  manage_roles: boolean;
  permissions: ModulePermissions;
}

export async function getRoleById(roleId: string): Promise<RoleRow | null> {
  const rows = await sql`select * from roles where id = ${roleId}`;
  return (rows[0] as RoleRow) || null;
}

// Compte et rôle relus en base à chaque requête, jamais tirés du jeton.
//
// Le jeton de session vit SEPT JOURS et porte le `roleId` figé à la connexion.
// Deux conséquences que personne n'aurait vues avant l'incident :
//
//   * désactiver un compte ne coupait RIEN. `is_active` n'était vérifié qu'à
//     la connexion : un collaborateur parti gardait l'accès complet jusqu'à
//     une semaine, alors que le cabinet avait cliqué « Désactiver » et le
//     croyait dehors ;
//   * changer le rôle d'une personne ne changeait rien non plus, puisque le
//     `roleId` du jeton continuait de désigner l'ancien rôle. Rétrograder un
//     administrateur le laissait administrateur pendant sept jours.
//
// Seules les PERMISSIONS d'un rôle étaient relues — pas l'appartenance à ce
// rôle, ni l'existence du compte. Une requête supplémentaire par appel est un
// prix modeste pour que « Désactiver » veuille dire désactiver.
async function chargerCompteVivant() {
  const session = await getStaffSession();
  if (!session) return { session: null, role: null, status: 401 as const, error: 'Non authentifié.' };

  const lignes = await sql`
    select u.id, u.is_active, u.role_id, r.id as r_id, r.slug, r.label,
           r.is_system, r.is_practitioner, r.manage_roles, r.permissions
    from users u
    left join roles r on r.id = u.role_id
    where u.id = ${session.userId}
    limit 1
  `;
  const ligne = lignes[0];

  // Compte supprimé entre-temps : le jeton reste cryptographiquement valide,
  // il ne doit pour autant plus ouvrir aucune porte.
  if (!ligne) {
    return { session: null, role: null, status: 401 as const, error: 'Compte introuvable.' };
  }
  if (ligne.is_active === false) {
    return { session: null, role: null, status: 403 as const, error: 'Compte désactivé.' };
  }
  if (!ligne.r_id) {
    return { session: null, role: null, status: 403 as const, error: 'Aucun rôle attribué.' };
  }

  const role: RoleRow = {
    id: ligne.r_id as string,
    slug: ligne.slug as string,
    label: ligne.label as string,
    is_system: ligne.is_system as boolean,
    is_practitioner: ligne.is_practitioner as boolean,
    manage_roles: ligne.manage_roles as boolean,
    permissions: ligne.permissions as ModulePermissions,
  };

  // La session rendue porte le rôle COURANT, pas celui du jeton.
  return {
    session: { ...session, roleId: role.id, role: role.slug, roleLabel: role.label },
    role,
    status: 200 as const,
    error: null,
  };
}

// Vérifie la session et le privilège requis (module + action) depuis une
// route API. Compte, rôle et permissions sont relus en base à chaque requête
// pour qu'une désactivation ou un changement de rôle prenne effet
// immédiatement, sans attendre l'expiration du jeton.
export async function requirePermission(moduleId: number, action: PermissionAction) {
  const base = await chargerCompteVivant();
  if (base.error) return base;

  if (!hasPermission(base.role!.permissions, moduleId, action)) {
    return { session: null, role: null, status: 403 as const, error: 'Rôle non autorisé.' };
  }
  return base;
}

// Pour les routes de support (listes utilisées dans des sélecteurs, etc.)
// où seule l'authentification staff est requise, sans privilège de module
// particulier. Le compte doit tout de même être encore actif.
export async function requireStaff() {
  const base = await chargerCompteVivant();
  if (base.error) return { session: null, status: base.status, error: base.error };
  return { session: base.session, status: 200 as const, error: null };
}

export async function requireManageRoles() {
  const base = await chargerCompteVivant();
  if (base.error) return base;

  if (!base.role!.manage_roles) {
    return { session: null, role: null, status: 403 as const, error: 'Rôle non autorisé.' };
  }
  return base;
}
