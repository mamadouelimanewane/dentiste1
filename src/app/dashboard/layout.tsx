import { chargerCompteVivantPourPage } from "@/lib/permissions";
import { signOut } from "@/app/login/actions";
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

  // Compte et rôle relus en base, jamais tirés du jeton : voir la note de
  // chargerCompteVivantPourPage. Un compte désactivé ou supprimé ne doit pas
  // continuer d'afficher le tableau de bord jusqu'à l'expiration du jeton, et
  // un rôle rétrogradé ne doit pas garder les menus de l'ancien.
  const { session, role, error } = await chargerCompteVivantPourPage();

  // Surtout PAS de redirection vers /login ici : le jeton reste
  // cryptographiquement valide, et le middleware renvoie toute session valide
  // de /login vers le tableau de bord — on tournerait en boucle. On affiche
  // donc l'accès révoqué et on offre la seule sortie utile : se déconnecter,
  // ce qui efface le cookie.
  if (error || !session || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-sm shadow-sm p-8 text-center space-y-4">
          <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">
            Accès révoqué
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {error || "Ce compte n'a plus accès à l'application."} Rapprochez-vous d'un
            administrateur du cabinet.
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    );
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
