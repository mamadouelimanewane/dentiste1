import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { chargerPatientDuPortail } from '@/lib/portal-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Le jeton ne suffit pas : le dossier doit encore être ouvert. Voir
  // src/lib/portal-guard.ts — un dossier anonymisé restait consultable une
  // semaine, le temps que le jeton expire.
  const acces = await chargerPatientDuPortail();
  if (acces.erreur) {
    return NextResponse.json({ error: acces.erreur }, { status: acces.statut });
  }
  const session = { patientId: acces.patientId };

  const messages = await sql`
    select id, body, direction, status, created_at, media_url, media_type
    from patient_messages
    where patient_id = ${session.patientId} and channel in ('portal', 'whatsapp', 'sms')
    order by created_at asc
    limit 200
  `;

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  // Le jeton ne suffit pas : le dossier doit encore être ouvert. Voir
  // src/lib/portal-guard.ts — un dossier anonymisé restait consultable une
  // semaine, le temps que le jeton expire.
  const acces = await chargerPatientDuPortail();
  if (acces.erreur) {
    return NextResponse.json({ error: acces.erreur }, { status: acces.statut });
  }
  const session = { patientId: acces.patientId };

  const { message } = await request.json();
  if (!message) return NextResponse.json({ error: 'message est requis.' }, { status: 400 });

  const rows = await sql`
    insert into patient_messages (patient_id, channel, direction, body, status)
    values (${session.patientId}, 'portal', 'inbound', ${message}, 'received')
    returning *
  `;

  return NextResponse.json({ message: rows[0] });
}
