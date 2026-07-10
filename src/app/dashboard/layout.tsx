import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/session";
import { AuthProvider } from "@/lib/auth-context";

const isDbConfigured = !!process.env.DATABASE_URL && !!process.env.SESSION_SECRET;

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
      <AuthProvider user={{ id: "demo", fullName: "Mode démo", role: "admin" }}>
        {children}
      </AuthProvider>
    );
  }

  const session = await getStaffSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider user={{ id: session.userId, fullName: session.fullName, role: session.role }}>
      {children}
    </AuthProvider>
  );
}
