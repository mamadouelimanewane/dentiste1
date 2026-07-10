import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { PORTAL_COOKIE_NAME, verifyPortalSessionToken } from "@/lib/portal-session";
import { PortalPatientProvider } from "@/lib/portal-context";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  const session = token ? await verifyPortalSessionToken(token) : null;

  if (!session) {
    redirect("/portal/invalid");
  }

  const rows = await sql`
    select id, full_name, phone, dossier_number
    from patients
    where id = ${session.patientId}
    limit 1
  `;
  const patient = rows[0];

  if (!patient) {
    redirect("/portal/invalid");
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <header className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Espace Patient</p>
          <h1 className="text-lg font-black">Cabinet Dentaire du Cap Vert</h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{patient.full_name}</p>
          <p className="text-[10px] text-slate-400">{patient.dossier_number}</p>
        </div>
      </header>
      <PortalPatientProvider patient={patient as any}>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </PortalPatientProvider>
    </div>
  );
}
