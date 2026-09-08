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

  const reglages = await sql`select clinic_name from clinic_settings limit 1`;
  const nomCabinet = (reglages[0]?.clinic_name as string) || 'Votre cabinet dentaire';

  // Le jeton vit sept jours. Un dossier clôturé au titre du droit à l'oubli
  // restait donc consultable une semaine : l'anonymisation supprime les liens
  // magiques, mais pas les sessions déjà ouvertes. Le porteur du téléphone
  // continuait de lire documents et messages après la demande d'effacement.
  if (!patient || patient.status === "anonymized") {
    redirect("/portal/invalid");
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Sur téléphone — l'écran sur lequel un patient ouvre son lien — les
          trois blocs de cet en-tête se chevauchaient : le nom du cabinet
          passait sur deux lignes, le nom du patient s'empilait, et le bouton
          de déconnexion se brisait en deux. Ils se placent désormais l'un sous
          l'autre tant que la largeur manque.

          Le nom du cabinet était par ailleurs écrit en dur, alors que le
          patient doit reconnaître celui qui lui a envoyé le lien. Et le numéro
          de dossier — un identifiant interne — occupait une place précieuse
          sans rien apprendre au patient. */}
      <header className="bg-[#0F172A] text-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Espace patient</p>
          <h1 className="text-lg font-black leading-tight">{nomCabinet}</h1>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <p className="text-sm font-bold">{patient.full_name}</p>
          <PortalLogoutButton />
        </div>
      </header>
      <PortalPatientProvider patient={patient as any}>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </PortalPatientProvider>
    </div>
  );
}
