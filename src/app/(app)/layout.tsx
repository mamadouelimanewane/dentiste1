import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider, type Role } from "@/lib/auth-context";

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    // Pas de projet Supabase branché (dev/preview sans .env.local) : on
    // laisse passer avec une identité de démonstration plutôt que de
    // bloquer tout le monde derrière un login impossible à satisfaire.
    return (
      <AuthProvider user={{ id: "demo", fullName: "Mode démo", role: "admin" }}>
        {children}
      </AuthProvider>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <AuthProvider
      user={{ id: user.id, fullName: profile.full_name, role: profile.role as Role }}
    >
      {children}
    </AuthProvider>
  );
}
