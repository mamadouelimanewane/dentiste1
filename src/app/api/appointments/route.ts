import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validerCreneau } from '@/lib/validation';
import { requirePermission } from '@/lib/permissions';
import { notifyPatient } from '@/lib/integrations/notify';

const RECURRENCE_STEP_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
};

export async function GET(request: Request) {
  const { error, status } = await requirePermission(13, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const practitionerId = searchParams.get('practitionerId');

  if (!from || !to) {
    return NextResponse.json({ error: 'from et to sont requis.' }, { status: 400 });
  }

  const appointments = practitionerId
    ? await sql`
        select a.*, p.full_name as patient_name, p.phone as patient_phone,
               u.full_name as practitioner_name
        from appointments a
        join patients p on p.id = a.patient_id
        left join users u on u.id = a.practitioner_id
        where a.scheduled_at between ${from} and ${to} and a.practitioner_id = ${practitionerId}
        order by a.scheduled_at asc
      `
    : await sql`
        select a.*, p.full_name as patient_name, p.phone as patient_phone,
               u.full_name as practitioner_name
        from appointments a
        join patients p on p.id = a.patient_id
        left join users u on u.id = a.practitioner_id
        where a.scheduled_at between ${from} and ${to}
        order by a.scheduled_at asc
      `;

  return NextResponse.json({ appointments });
}

// Un patient ne peut pas être dans deux fauteuils en même temps. Ce contrôle
// est indépendant du praticien : hasConflict() ne teste que le praticien et
// se désactive entièrement quand le rendez-vous n'est pas assigné (cas par
// défaut dans l'agenda), ce qui laissait passer les doublons patient.
async function hasPatientConflict(patientId: string, scheduledAt: string, durationMinutes: number) {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const rows = await sql`
    select a.id, a.scheduled_at, a.type
    from appointments a
    where a.patient_id = ${patientId}
      and a.status = 'scheduled'
      and a.scheduled_at < ${end.toISOString()}
      and (a.scheduled_at + (a.duration_minutes || ' minutes')::interval) > ${start.toISOString()}
    limit 1
  `;

  return rows[0] || null;
}

async function hasConflict(practitionerId: string | null, scheduledAt: string, durationMinutes: number, excludeId?: string) {
  if (!practitionerId) return null;
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const rows = excludeId
    ? await sql`
        select a.id, a.scheduled_at, a.duration_minutes, p.full_name as patient_name
        from appointments a
        join patients p on p.id = a.patient_id
        where a.practitioner_id = ${practitionerId}
          and a.status = 'scheduled'
          and a.id != ${excludeId}
          and a.scheduled_at < ${end.toISOString()}
          and (a.scheduled_at + (a.duration_minutes || ' minutes')::interval) > ${start.toISOString()}
      `
    : await sql`
        select a.id, a.scheduled_at, a.duration_minutes, p.full_name as patient_name
        from appointments a
        join patients p on p.id = a.patient_id
        where a.practitioner_id = ${practitionerId}
          and a.status = 'scheduled'
          and a.scheduled_at < ${end.toISOString()}
          and (a.scheduled_at + (a.duration_minutes || ' minutes')::interval) > ${start.toISOString()}
      `;

  return rows[0] || null;
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(13, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const {
    patientId,
    patientIds = [],
    practitionerId,
    scheduledAt,
    durationMinutes = 30,
    type,
    notes,
    recurrence = 'none',
    recurrenceCount = 1,
    multiMode = 'sequential',
  } = body as {
    patientId?: string;
    patientIds?: string[];
    practitionerId?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    type?: string;
    notes?: string;
    recurrence?: 'none' | 'weekly' | 'biweekly' | 'monthly';
    recurrenceCount?: number;
    multiMode?: 'sequential' | 'concurrent';
  };

  const finalPatientIds = patientIds.length > 0 ? patientIds : (patientId ? [patientId] : []);

  if (finalPatientIds.length === 0 || !scheduledAt) {
    return NextResponse.json({ error: 'patientId(s) et scheduledAt sont requis.' }, { status: 400 });
  }

  // Une durée négative créait un créneau finissant avant de commencer, ce qui
  // rendait la détection de conflits inopérante ; une date illisible faisait
  // planter la route en 500 ; l'an 2200 était accepté sans broncher.
  const creneau = validerCreneau(scheduledAt, durationMinutes);
  if (!creneau.ok) {
    return NextResponse.json({ error: creneau.erreur }, { status: 400 });
  }

  const occurrences = recurrence === 'none' ? 1 : Math.min(Math.max(recurrenceCount, 1), 12);
  const stepDays = RECURRENCE_STEP_DAYS[recurrence] || 0;
  const recurrenceGroupId = occurrences > 1 ? crypto.randomUUID() : null;

  // Récupérer les patients pour les notifications
  const patientsInfo = finalPatientIds.length > 0 
    ? await sql`select id, full_name, phone from patients where id = any(${finalPatientIds as string[]})`
    : [];
  
  const created: unknown[] = [];
  const skipped: { scheduledAt: string; reason: string; conflictWith?: string }[] = [];

  for (let i = 0; i < occurrences; i++) {
    const occurrenceBaseDate = new Date(scheduledAt);
    occurrenceBaseDate.setDate(occurrenceBaseDate.getDate() + stepDays * i);

    for (let pIdx = 0; pIdx < finalPatientIds.length; pIdx++) {
      const pId = finalPatientIds[pIdx];
      const patient = patientsInfo.find(p => p.id === pId);
      
      const occurrenceDate = new Date(occurrenceBaseDate);
      if (multiMode === 'sequential' && pIdx > 0) {
        occurrenceDate.setMinutes(occurrenceDate.getMinutes() + (creneau.duree * pIdx));
      }
      const occurrenceIso = occurrenceDate.toISOString();

      const patientConflict = await hasPatientConflict(pId, occurrenceIso, creneau.duree);
      if (patientConflict) {
        skipped.push({
          scheduledAt: occurrenceIso,
          reason: 'conflit_patient',
          conflictWith: patient?.full_name as string | undefined,
        });
        continue;
      }

      const conflict = await hasConflict(practitionerId || null, occurrenceIso, creneau.duree);
      if (conflict) {
        skipped.push({
          scheduledAt: occurrenceIso,
          reason: 'conflit',
          conflictWith: conflict.patient_name,
        });
        continue;
      }

      const rows = await sql`
        insert into appointments (patient_id, practitioner_id, scheduled_at, duration_minutes, type, notes, recurrence_group_id)
        values (${pId}, ${practitionerId || null}, ${occurrenceIso}, ${creneau.duree}, ${type || null}, ${notes || null}, ${recurrenceGroupId})
        returning *
      `;
      const newAppointment = rows[0];
      created.push(newAppointment);

      // Envoi automatique SMS/WhatsApp
      if (patient && patient.phone) {
        const formattedDate = new Intl.DateTimeFormat('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(new Date(occurrenceIso));

        const msg = `Bonjour ${patient.full_name}, votre rendez-vous est confirmé pour le ${formattedDate}. À bientôt au Cabinet !`;

        // Un seul canal : le patient recevait auparavant deux fois le même
        // texte, et le cabinet payait deux envois pour une seule information.
        notifyPatient({ patientId: pId, phone: patient.phone, body: msg, sentBy: session?.userId }).catch(console.error);
      }
    }
  }

  if (created.length === 0) {
    return NextResponse.json(
      { error: 'Conflit de créneau sur tous les rendez-vous demandés.', skipped },
      { status: 409 }
    );
  }

  return NextResponse.json({ appointments: created, skipped });
}
