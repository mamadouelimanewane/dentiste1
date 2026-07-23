import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/session";
import { getRoleById } from "@/lib/permissions";
import { AuthProvider } from "@/lib/auth-context";
import { MODULES, type ModulePermissions } from "@/lib/modules";

const isDbConfigured = !!process.env.DATABASE_URL && !!process.env.SESSION_SECRET;

const ALL_PERMISSIONS: ModulePermissions = Object.fromEntries(
  MODULES.map((m) => [String(m.id), { view: true, manage: true }])
);

import { StaffChatWidget } from "@/components/StaffChatWidget";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isDbConfigured) {
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
        <StaffChatWidget />
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
      <StaffChatWidget />
    </AuthProvider>
  );
}
