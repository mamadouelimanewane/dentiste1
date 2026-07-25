import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { formatToGoogleCalendarDate } from "@/lib/google-calendar";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const practitionerId = searchParams.get("practitionerId");

    const sql = getDb();
    let query = `
      SELECT 
        a.id, a.scheduled_at, a.duration_minutes, a.type, a.status,
        p.full_name as patient_name,
        pr.full_name as practitioner_name
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN profiles pr ON a.practitioner_id = pr.id
      WHERE a.status != 'cancelled'
    `;
    const params: any[] = [];

    if (practitionerId) {
      query += ` AND a.practitioner_id = $1`;
      params.push(practitionerId);
    }

    query += ` ORDER BY a.scheduled_at DESC LIMIT 200`;

    const result = await sql.query(query, params);
    const appointments = result.rows;

    const eventsIcs = appointments.map((app) => {
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
