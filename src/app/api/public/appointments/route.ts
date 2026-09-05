import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Prise de rendez-vous en ligne, volontairement accessible sans compte
// (page /portail). Comme tout endpoint anonyme qui écrit en base, il est
// limité par IP pour éviter la création massive de faux patients/RDV.
const MAX_BOOKINGS_PER_WINDOW = 5;
const WINDOW_MINUTES = 60;
const MAX_DAYS_AHEAD = 180;

async function getClientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

function normalizePhone(raw: string) {
  const cleaned = raw.replace(/[\s.-]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned) ? cleaned : null;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Les sauts de ligne et tabulations n'ont aucun sens dans un nom, mais en
    // ont dans les formats que ce nom traverse ensuite (iCalendar, CSV) : on
    // les neutralise à l'entrée, en plus de l'échappement à la sortie.
    const patientName = String(data?.patientName || '').replace(/\s+/g, ' ').trim();
    const rawPhone = String(data?.phone || '').trim();
    const reason = String(data?.reason || '').replace(/\s+/g, ' ').trim() || 'Consultation générale';
    const scheduledAtRaw = String(data?.scheduledAt || '');

    if (!patientName || !rawPhone || !scheduledAtRaw) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    }
    if (patientName.length > 120 || reason.length > 200) {
      return NextResponse.json({ error: 'Champs trop longs.' }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone);
    if (!phone) {
      return NextResponse.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 });
    }

    const scheduledAt = new Date(scheduledAtRaw);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: 'Date de rendez-vous invalide.' }, { status: 400 });
    }
    const now = new Date();
    if (scheduledAt < now) {
      return NextResponse.json({ error: 'La date choisie est déjà passée.' }, { status: 400 });
    }
    const maxDate = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000);
    if (scheduledAt > maxDate) {
      return NextResponse.json({ error: 'Date trop éloignée.' }, { status: 400 });
    }

    const ip = await getClientIp();
    const recent = await sql`
      select count(*)::int as count from public_booking_attempts
      where ip = ${ip} and created_at > now() - make_interval(mins => ${WINDOW_MINUTES})
    `;
    if (Number(recent[0]?.count || 0) >= MAX_BOOKINGS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Trop de demandes depuis cette connexion. Réessayez plus tard ou appelez le cabinet.' },
        { status: 429 }
      );
    }
    await sql`insert into public_booking_attempts (ip, phone) values (${ip}, ${phone})`;

    // Patient rattaché par téléphone s'il existe déjà, sinon créé avec le
    // statut "new" pour que l'accueil sache que le dossier vient du web et
    // reste à compléter.
    const existing = await sql`select id from patients where phone = ${phone} limit 1`;
    let patientId: string;

    if (existing.length > 0) {
      patientId = existing[0].id as string;
    } else {
      const created = await sql`
        insert into patients (full_name, phone, status)
        values (${patientName}, ${phone}, 'new')
        returning id
      `;
      patientId = created[0].id as string;
    }

    // Non assigné : l'accueil affecte le praticien depuis l'Agenda.
    await sql`
      insert into appointments (patient_id, scheduled_at, duration_minutes, type, notes, status)
      values (${patientId}, ${scheduledAt.toISOString()}, 30, ${reason}, 'Demande enregistrée depuis le portail public.', 'scheduled')
    `;

    return NextResponse.json({ success: true, message: 'Rendez-vous confirmé' });
  } catch (error) {
    console.error('Erreur API public appointment:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
