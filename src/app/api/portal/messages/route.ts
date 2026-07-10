import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { PORTAL_COOKIE_NAME, verifyPortalSessionToken } from '@/lib/portal-session';

export const dynamic = 'force-dynamic';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  return token ? verifyPortalSessionToken(token) : null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Session portail invalide.' }, { status: 401 });

  const messages = await sql`
    select id, body, direction, status, created_at
    from patient_messages
    where patient_id = ${session.patientId} and channel in ('portal', 'whatsapp', 'sms')
    order by created_at asc
    limit 200
  `;

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Session portail invalide.' }, { status: 401 });

  const { message } = await request.json();
  if (!message) return NextResponse.json({ error: 'message est requis.' }, { status: 400 });

  const rows = await sql`
    insert into patient_messages (patient_id, channel, direction, body, status)
    values (${session.patientId}, 'portal', 'inbound', ${message}, 'received')
    returning *
  `;

  return NextResponse.json({ message: rows[0] });
}
