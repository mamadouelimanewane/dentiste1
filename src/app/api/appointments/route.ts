import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

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
  const { error, status } = await requirePermission(13, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const {
    patientId,
    practitionerId,
    scheduledAt,
    durationMinutes = 30,
    type,
    notes,
    recurrence = 'none',
    recurrenceCount = 1,
  } = body as {
    patientId?: string;
    practitionerId?: string;
    scheduledAt?: string;
    durationMinutes?: number;
    type?: string;
    notes?: string;
    recurrence?: 'none' | 'weekly' | 'biweekly' | 'monthly';
    recurrenceCount?: number;
  };

  if (!patientId || !scheduledAt) {
    return NextResponse.json({ error: 'patientId et scheduledAt sont requis.' }, { status: 400 });
  }

  const occurrences = recurrence === 'none' ? 1 : Math.min(Math.max(recurrenceCount, 1), 12);
  const stepDays = RECURRENCE_STEP_DAYS[recurrence] || 0;
  const recurrenceGroupId = occurrences > 1 ? crypto.randomUUID() : null;

  const created: unknown[] = [];
  const skipped: { scheduledAt: string; reason: string; conflictWith?: string }[] = [];

  for (let i = 0; i < occurrences; i++) {
    const occurrenceDate = new Date(scheduledAt);
    occurrenceDate.setDate(occurrenceDate.getDate() + stepDays * i);
    const occurrenceIso = occurrenceDate.toISOString();

    const conflict = await hasConflict(practitionerId || null, occurrenceIso, durationMinutes);
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
      values (${patientId}, ${practitionerId || null}, ${occurrenceIso}, ${durationMinutes}, ${type || null}, ${notes || null}, ${recurrenceGroupId})
      returning *
    `;
    created.push(rows[0]);
  }

  if (created.length === 0) {
    return NextResponse.json(
      { error: 'Conflit de créneau sur tous les rendez-vous demandés.', skipped },
      { status: 409 }
    );
  }

  return NextResponse.json({ appointments: created, skipped });
}
