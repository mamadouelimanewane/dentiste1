import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Conversations réelles du cabinet, reconstruites depuis patient_messages
// (table alimentée par les envois WhatsApp/SMS et les webhooks entrants).
// Sans patientId : la liste des conversations, un fil par patient, avec son
// dernier message. Avec patientId : le fil complet de ce patient.
export async function GET(request: Request) {
  const { error, status } = await requirePermission(18, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId');

  if (patientId) {
    const messages = await sql`
      select id, patient_id, phone, channel, direction, body, status, media_url, media_type, created_at
      from patient_messages
      where patient_id = ${patientId}
      order by created_at asc
      limit 200
    `;
    return NextResponse.json({ messages });
  }

  // distinct on (patient_id) + order by created_at desc => le message le plus
  // récent de chaque patient ; le tri final remet les fils les plus actifs en tête.
  const threads = await sql`
    select * from (
      select distinct on (pm.patient_id)
        pm.patient_id,
        p.full_name,
        p.phone,
        pm.body as last_message,
        pm.direction as last_direction,
        pm.channel as last_channel,
        pm.created_at
      from patient_messages pm
      join patients p on p.id = pm.patient_id
      where pm.patient_id is not null
      order by pm.patient_id, pm.created_at desc
    ) t
    order by t.created_at desc
    limit 50
  `;

  return NextResponse.json({ threads });
}
