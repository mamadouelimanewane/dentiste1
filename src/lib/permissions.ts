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

// Vérifie la session et le privilège requis (module + action) depuis une
// route API. Les permissions sont relues en base à chaque requête (pas
// mises en cache dans le JWT) pour qu'un changement de rôle prenne effet
// immédiatement, sans attendre une reconnexion.
export async function requirePermission(moduleId: number, action: PermissionAction) {
  const session = await getStaffSession();
  if (!session) {
    return { session: null, role: null, status: 401 as const, error: 'Non authentifié.' };
  }
  const role = await getRoleById(session.roleId);
  if (!role || !hasPermission(role.permissions, moduleId, action)) {
    return { session: null, role: null, status: 403 as const, error: 'Rôle non autorisé.' };
  }
  return { session, role, status: 200 as const, error: null };
}

// Pour les routes de support (listes utilisées dans des sélecteurs, etc.)
// où seule l'authentification staff est requise, sans privilège de module
// particulier.
export async function requireStaff() {
  const session = await getStaffSession();
  if (!session) {
    return { session: null, status: 401 as const, error: 'Non authentifié.' };
  }
  return { session, status: 200 as const, error: null };
}

export async function requireManageRoles() {
  const session = await getStaffSession();
  if (!session) {
    return { session: null, role: null, status: 401 as const, error: 'Non authentifié.' };
  }
  const role = await getRoleById(session.roleId);
  if (!role || !role.manage_roles) {
    return { session: null, role: null, status: 403 as const, error: 'Rôle non autorisé.' };
  }
  return { session, role, status: 200 as const, error: null };
}
