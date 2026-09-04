import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { validerCreneau } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requirePermission(13, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { action, scheduledAt } = body as {
    action?: 'check-in' | 'complete' | 'cancel' | 'no-show' | 'reschedule';
    scheduledAt?: string;
  };

  if (!action) {
    return NextResponse.json({ error: 'action est requise.' }, { status: 400 });
  }

  let rows;

  switch (action) {
    case 'check-in':
      rows = await sql`
        update appointments set checked_in_at = now() where id = ${params.id} returning *
      `;
      break;
    case 'complete':
      rows = await sql`
        update appointments set status = 'completed', completed_at = now() where id = ${params.id} returning *
      `;
      break;
    case 'cancel':
      rows = await sql`
        update appointments set status = 'cancelled' where id = ${params.id} returning *
      `;
      break;
    case 'no-show':
      rows = await sql`
        update appointments set status = 'no_show' where id = ${params.id} returning *
      `;
      break;
    case 'reschedule':
      if (!scheduledAt) {
        return NextResponse.json({ error: 'scheduledAt est requis pour replanifier.' }, { status: 400 });
      }
      const current = await sql`select patient_id, practitioner_id, duration_minutes from appointments where id = ${params.id} limit 1`;
      if (current.length === 0) {
        return NextResponse.json({ error: 'Rendez-vous introuvable.' }, { status: 404 });
      }
      const { patient_id, practitioner_id, duration_minutes } = current[0];

      // La création valide le créneau, le report ne le faisait pas : une date
      // illisible ou une année aberrante (9999) passait sans obstacle, et le
      // rendez-vous disparaissait alors de toutes les vues.
      const creneau = validerCreneau(scheduledAt, duration_minutes);
      if (!creneau.ok) {
        return NextResponse.json({ error: creneau.erreur }, { status: 400 });
      }

      const start = new Date(scheduledAt);
      const end = new Date(start.getTime() + duration_minutes * 60 * 1000);

      // Conflit patient. La création le vérifie depuis le correctif du
      // 2 septembre, le report non : le même patient pouvait donc être
      // déplacé sur un créneau où il avait déjà un autre rendez-vous — et
      // sans praticien assigné, aucun contrôle ne s'appliquait du tout.
      if (patient_id) {
        const doublon = await sql`
          select id from appointments
          where patient_id = ${patient_id}
            and status = 'scheduled'
            and id != ${params.id}
            and scheduled_at < ${end.toISOString()}
            and (scheduled_at + (duration_minutes || ' minutes')::interval) > ${start.toISOString()}
          limit 1
        `;
        if (doublon.length > 0) {
          return NextResponse.json(
            { error: 'Ce patient a déjà un rendez-vous sur ce créneau.' },
            { status: 409 }
          );
        }
      }

      if (practitioner_id) {
        const conflict = await sql`
          select id from appointments
          where practitioner_id = ${practitioner_id}
            and status = 'scheduled'
            and id != ${params.id}
            and scheduled_at < ${end.toISOString()}
            and (scheduled_at + (duration_minutes || ' minutes')::interval) > ${start.toISOString()}
          limit 1
        `;
        if (conflict.length > 0) {
          return NextResponse.json({ error: 'Ce créneau est déjà occupé pour ce praticien.' }, { status: 409 });
        }
      }
      rows = await sql`
        update appointments
        set scheduled_at = ${scheduledAt}, reminder_sent_at = null
        where id = ${params.id}
        returning *
      `;
      break;
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Rendez-vous introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ appointment: rows[0] });
}
