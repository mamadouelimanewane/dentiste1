import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { PORTAL_COOKIE_NAME, verifyPortalSessionToken } from "@/lib/portal-session";
import { PortalPatientProvider } from "@/lib/portal-context";
import { PortalLogoutButton } from "./PortalLogoutButton";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  const session = token ? await verifyPortalSessionToken(token) : null;

  if (!session) {
    redirect("/portal/invalid");
  }

  const rows = await sql`
    select id, full_name, phone, dossier_number, status
    from patients
    where id = ${session.patientId}
    limit 1
  `;
  const patient = rows[0];

  // Le jeton vit sept jours. Un dossier clôturé au titre du droit à l'oubli
  // restait donc consultable une semaine : l'anonymisation supprime les liens
  // magiques, mais pas les sessions déjà ouvertes. Le porteur du téléphone
  // continuait de lire documents et messages après la demande d'effacement.
  if (!patient || patient.status === "anonymized") {
    redirect("/portal/invalid");
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <header className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Espace Patient</p>
          <h1 className="text-lg font-black">Cabinet Dentaire du Cap Vert</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold">{patient.full_name}</p>
            <p className="text-[10px] text-slate-400">{patient.dossier_number}</p>
          </div>
          <PortalLogoutButton />
        </div>
      </header>
      <PortalPatientProvider patient={patient as any}>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </PortalPatientProvider>
    </div>
  );
}
