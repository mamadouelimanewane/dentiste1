import Link from "next/link";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { PORTAL_COOKIE_NAME, verifyPortalSessionToken } from "@/lib/portal-session";

async function getPatientId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)!.value;
  const session = await verifyPortalSessionToken(token);
  return session!.patientId;
}

export default async function PortalHomePage() {
  const patientId = await getPatientId();

  const appointments = await sql`
    select id, scheduled_at, type, status, daily_room_url
    from appointments
    where patient_id = ${patientId}
      and scheduled_at >= now()
      and status = 'scheduled'
    order by scheduled_at asc
    limit 5
  `;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/portal/messages"
          className="bg-white border border-slate-200 rounded p-5 shadow-sm hover:border-blue-300 transition-colors"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Messagerie</p>
          <p className="text-sm font-bold text-slate-900 mt-1">Contacter le cabinet</p>
        </Link>
        <Link
          href="/portal/documents"
          className="bg-white border border-slate-200 rounded p-5 shadow-sm hover:border-blue-300 transition-colors"
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documents</p>
          <p className="text-sm font-bold text-slate-900 mt-1">Ordonnances, devis, fichiers</p>
        </Link>
        <div className="bg-white border border-slate-200 rounded p-5 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rendez-vous à venir</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{appointments.length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900">Mes prochains rendez-vous</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {appointments.length === 0 && (
            <p className="p-5 text-sm text-slate-400">Aucun rendez-vous à venir.</p>
          )}
          {appointments.map((appt) => (
            <div key={appt.id} className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {new Date(appt.scheduled_at).toLocaleString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-slate-500">{appt.type || "Consultation"}</p>
              </div>
              {appt.daily_room_url && (
                <a
                  href={appt.daily_room_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded transition-colors"
                >
                  Rejoindre la téléconsultation
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
