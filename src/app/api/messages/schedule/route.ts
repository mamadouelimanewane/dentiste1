import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/lib/session';

export async function POST(request: Request) {
  const { session, error, status } = await requireRole(['accueil', 'praticien', 'admin']);
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { patientId, phone, message, channel, sendAt } = body as {
    patientId?: string;
    phone?: string;
    message?: string;
    channel?: 'whatsapp' | 'sms';
    sendAt?: string;
  };

  if (!phone || !message || !channel || !sendAt) {
    return NextResponse.json(
      { error: 'phone, message, channel et sendAt sont requis.' },
      { status: 400 }
    );
  }

  const rows = await sql`
    insert into scheduled_messages (patient_id, phone, channel, body, send_at, source, created_by)
    values (${patientId ?? null}, ${phone}, ${channel}, ${message}, ${sendAt}, 'manual', ${session!.userId})
    returning *
  `;

  return NextResponse.json({ scheduled: rows[0] });
}
