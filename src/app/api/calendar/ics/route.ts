import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { formatToGoogleCalendarDate } from "@/lib/google-calendar";

// Flux iCal toujours calculé à la demande : la route lit request.url et doit
// refléter l'agenda en temps réel, jamais une version figée au build.
export const dynamic = "force-dynamic";

interface AppointmentRow {
  id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  type: string | null;
  status: string;
  patient_name: string | null;
  practitioner_name: string | null;
}

export async function GET(req: Request) {
  // Ce flux porte le nom de chaque patient et l'heure de son rendez-vous.
  // La route ne vérifiait aucune permission : elle ne tenait que par la
  // redirection du middleware, donc n'importe quel compte connecté pouvait
  // l'aspirer — y compris un rôle sans aucun accès à l'agenda. Aujourd'hui
  // tous les rôles ont l'agenda en lecture, donc rien ne fuyait ; un rôle
  // personnalisé créé demain aurait suffi à ouvrir la brèche.
  const { error, status } = await requirePermission(13, "view");
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { searchParams } = new URL(req.url);
    const practitionerId = searchParams.get("practitionerId");

    const appointments = (practitionerId
      ? await sql`
          SELECT 
            a.id, a.scheduled_at, a.duration_minutes, a.type, a.status,
            p.full_name as patient_name,
            u.full_name as practitioner_name
          FROM appointments a
          LEFT JOIN patients p ON a.patient_id = p.id
          LEFT JOIN users u ON a.practitioner_id = u.id
          WHERE a.status != 'cancelled' AND a.practitioner_id = ${practitionerId}
          ORDER BY a.scheduled_at DESC LIMIT 200
        `
      : await sql`
          SELECT 
            a.id, a.scheduled_at, a.duration_minutes, a.type, a.status,
            p.full_name as patient_name,
            u.full_name as practitioner_name
          FROM appointments a
          LEFT JOIN patients p ON a.patient_id = p.id
          LEFT JOIN users u ON a.practitioner_id = u.id
          WHERE a.status != 'cancelled'
          ORDER BY a.scheduled_at DESC LIMIT 200
        `) as unknown as AppointmentRow[];

    const eventsIcs = appointments.map((app: AppointmentRow) => {
      const startDate = new Date(app.scheduled_at);
      const duration = app.duration_minutes || 30;
      const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

      const startStr = formatToGoogleCalendarDate(startDate);
      const endStr = formatToGoogleCalendarDate(endDate);
      const title = `RDV Dentaire - ${app.patient_name || 'Patient'} (${app.type || 'Consultation'})`;
      const description = `Praticien: ${app.practitioner_name || 'Dr.'}\\nStatut: ${app.status}\\nCabinet Dentaire du Cap Vert`;

      return [
        "BEGIN:VEVENT",
        `UID:rdv-${app.id}@dentiste.capvert`,
        `DTSTAMP:${formatToGoogleCalendarDate(new Date())}`,
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        "LOCATION:Cabinet Dentaire du Cap Vert",
        "STATUS:CONFIRMED",
        "END:VEVENT"
      ].join("\r\n");
    }).join("\r\n");

    const fullCalendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Cabinet Dentaire du Cap Vert//ERP Dentiste Lite//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Cabinet Dentaire Cap Vert",
      "X-WR-TIMEZONE:UTC",
      eventsIcs,
      "END:VCALENDAR"
    ].join("\r\n");

    return new NextResponse(fullCalendar, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="agenda-cabinet.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (error: any) {
    console.error("Erreur flux iCal:", error);
    return NextResponse.json({ error: "Erreur de génération du flux agenda." }, { status: 500 });
  }
}
