import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/session";
import { getRoleById } from "@/lib/permissions";
import { AuthProvider } from "@/lib/auth-context";
import { MODULES, type ModulePermissions } from "@/lib/modules";

const isDbConfigured = !!process.env.DATABASE_URL && !!process.env.SESSION_SECRET;

const ALL_PERMISSIONS: ModulePermissions = Object.fromEntries(
  MODULES.map((m) => [String(m.id), { view: true, manage: true }])
);

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDbConfigured) {
    // Pas de base Neon branchée (dev/preview sans .env.local) : on laisse
    // passer avec une identité de démonstration plutôt que de bloquer tout
    // le monde derrière un login impossible à satisfaire.
    return (
      <AuthProvider
        user={{
          id: "demo",
          fullName: "Mode démo",
          role: "admin",
          roleLabel: "Administrateur",
          permissions: ALL_PERMISSIONS,
          manageRoles: true,
        }}
      >
        {children}
      </AuthProvider>
    );
  }

  const session = await getStaffSession();

  if (!session) {
    redirect("/login");
  }

  const role = await getRoleById(session.roleId);
  if (!role) {
    redirect("/login");
  }

  return (
    <AuthProvider
      user={{
        id: session.userId,
        fullName: session.fullName,
        role: role.slug,
        roleLabel: role.label,
        permissions: role.permissions,
        manageRoles: role.manage_roles,
      }}
    >
      {children}
    </AuthProvider>
  );
}
