import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { lienEnvoi } from '@/lib/integrations/envoi-manuel';

export const dynamic = 'force-dynamic';

// File des messages préparés qui attendent d'être envoyés à la main.
//
// C'est l'écran du matin : les rappels de rendez-vous déposés par la tâche
// planifiée pendant la nuit, plus ce que le personnel a préparé lui-même.
// Le lien est reconstruit ici à chaque lecture plutôt que stocké : si le
// numéro du patient est corrigé entre-temps, la file suit la correction.
export async function GET() {
  const { error, status } = await requirePermission(18, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`
    select m.id, m.patient_id, m.phone, m.channel::text as channel, m.body, m.created_at,
           p.full_name, p.dossier_number
    from patient_messages m
    left join patients p on p.id = m.patient_id
    where m.status = 'a_envoyer'::message_status
      and m.envoi_manuel = true
    order by m.created_at asc
    limit 200
  `;

  const envois = rows.map((r) => ({
    id: r.id,
    patientId: r.patient_id,
    nom: (r.full_name as string) || 'Patient inconnu',
    dossier: r.dossier_number,
    numero: r.phone,
    canal: r.channel,
    body: r.body,
    createdAt: r.created_at,
    lien: lienEnvoi(r.channel as 'whatsapp' | 'sms', r.phone as string, r.body as string),
  }));

  return NextResponse.json({ envois, total: envois.length });
}
