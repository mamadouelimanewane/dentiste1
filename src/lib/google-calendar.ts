/**
 * Integration Google Calendar pour Dentiste Lite / Elite ERP
 * Permet l'exportation 1-clic vers Google Calendar, la génération de liens direct
 * et le téléchargement de fichiers .ics pour l'agenda des praticiens et patients.
 */

export interface CalendarEventParams {
  title: string;
  startTime: string | Date;
  durationMinutes?: number;
  description?: string;
  location?: string;
  patientName?: string;
  practitionerName?: string;
}

/**
 * Échappe une valeur destinée à un champ iCalendar (RFC 5545).
 *
 * Un patient saisit lui-même son nom lors d'une prise de rendez-vous en ligne.
 * Sans échappement, un nom contenant un retour à la ligne referme le champ
 * SUMMARY et laisse écrire des propriétés arbitraires dans l'agenda que le
 * cabinet importe : faux événements, ou flux illisible. Les caractères
 * « \ », « ; » et « , » ont eux aussi un sens dans le format.
 */
export function echapperIcal(valeur: unknown): string {
  return String(valeur ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Formate une date au format ISO compact requis par Google Calendar (YYYYMMDDTHHmmssZ)
 */
export function formatToGoogleCalendarDate(dateInput: string | Date): string {
  const d = new Date(dateInput);
  return d.toISOString().replace(/-|:|\.\d+/g, "");
}

/**
 * Génère une URL directe d'ajout à Google Calendar ("Add to Google Calendar" Web Intent)
 */
export function createGoogleCalendarUrl(params: CalendarEventParams): string {
  const startDate = new Date(params.startTime);
  const duration = params.durationMinutes || 30;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const startStr = formatToGoogleCalendarDate(startDate);
  const endStr = formatToGoogleCalendarDate(endDate);

  const title = encodeURIComponent(params.title || "Rendez-vous Dentaire");
  const detailsParts = [];
  if (params.patientName) detailsParts.push(`Patient: ${params.patientName}`);
  if (params.practitionerName) detailsParts.push(`Praticien: ${params.practitionerName}`);
  if (params.description) detailsParts.push(params.description);
  detailsParts.push("\nRendez-vous géré via Elite ERP Dentiste");

  const details = encodeURIComponent(detailsParts.join("\n"));
  const location = encodeURIComponent(params.location || "Cabinet Dentaire du Cap Vert");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
}

/**
 * Génère le contenu au format iCalendar (.ics)
 */
export function generateIcalEvent(params: CalendarEventParams): string {
  const startDate = new Date(params.startTime);
  const duration = params.durationMinutes || 30;
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const startStr = formatToGoogleCalendarDate(startDate);
  const endStr = formatToGoogleCalendarDate(endDate);
  const uid = `rdv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@dentiste.capvert`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cabinet Dentaire du Cap Vert//ERP Dentiste Lite//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatToGoogleCalendarDate(new Date())}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${params.title}`,
    `DESCRIPTION:${(params.description || "").replace(/\n/g, "\\n")}`,
    `LOCATION:${params.location || "Cabinet Dentaire du Cap Vert"}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Rappel de votre rendez-vous dentaire dans 1h",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

/**
 * Déclenche le téléchargement d'un fichier .ics dans le navigateur
 */
export function downloadIcsFile(params: CalendarEventParams): void {
  const icsContent = generateIcalEvent(params);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rdv-dentaire-${Date.now()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
