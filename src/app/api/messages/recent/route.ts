import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

// Alimente le panneau "Derniers Envois" de CommunicationHub avec les vrais
// messages sortants récents, tous patients confondus.
export async function GET() {
  const { error, status } = await requirePermission(18, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const messages = await sql`
    select pm.id, pm.channel, pm.status, pm.body, pm.created_at,
           coalesce(p.full_name, pm.phone, 'Destinataire inconnu') as recipient_name
    from patient_messages pm
    left join patients p on p.id = pm.patient_id
    where pm.direction = 'outbound'
    order by pm.created_at desc
    limit 10
  `;

  return NextResponse.json({ messages });
}
