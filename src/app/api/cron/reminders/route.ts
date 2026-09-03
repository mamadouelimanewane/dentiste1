import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { sendWhatsAppMessage, MODELES } from '@/lib/integrations/whatsapp';
import { sendSms } from '@/lib/integrations/sms';
import { notifyPatient } from '@/lib/integrations/notify';

export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;

async function dispatch(channel: string, params: { patientId?: string | null; phone: string; body: string }) {
  return channel === 'sms' ? sendSms(params) : sendWhatsAppMessage(params);
}

export async function GET(request: Request) {
  // Vercel Cron envoie l'en-tête Authorization: Bearer <CRON_SECRET> défini
  // dans vercel.json / les variables d'environnement.
  // La route est publique au sens du middleware (Vercel Cron n'a pas de
  // session) : c'est donc ici, et nulle part ailleurs, qu'elle est protégée.
  // En production un secret absent doit fermer la porte, jamais l'ouvrir.
  if (!CRON_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'CRON_SECRET non configuré.' }, { status: 401 });
    }
  } else {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }
  }

  const now = new Date();
  const results = { scheduled: 0, appointmentReminders: 0, followUps: 0, errors: [] as string[] };

  // 1. Messages programmés arrivés à échéance.
  const due = await sql`
    select * from scheduled_messages
    where status = 'pending' and send_at <= ${now.toISOString()}
    limit 100
  `;

  for (const msg of due) {
    const result = await dispatch(msg.channel, { patientId: msg.patient_id, phone: msg.phone, body: msg.body });
    await sql`
      update scheduled_messages set status = ${result.error ? 'failed' : 'sent'} where id = ${msg.id}
    `;
    if (result.error) results.errors.push(`scheduled ${msg.id}: ${result.error}`);
    else results.scheduled++;
  }

  // 2. Rappels de rendez-vous du lendemain. Le cron ne tourne qu'une fois par
  // jour (limite du plan Vercel Hobby), donc la fenêtre couvre toute une
  // journée (12h à 36h à l'avance) plutôt qu'une précision de 30 minutes —
  // chaque rendez-vous reçoit son rappel une seule fois grâce à
  // reminder_sent_at, peu importe où il tombe dans cette fenêtre.
  const windowStart = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
  const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000).toISOString();

  const upcoming = await sql`
    select a.id, a.patient_id, a.scheduled_at, a.type, p.full_name, p.phone, p.whatsapp_phone
    from appointments a
    join patients p on p.id = a.patient_id
    where a.status = 'scheduled'
      and a.reminder_sent_at is null
      and a.scheduled_at between ${windowStart} and ${windowEnd}
    limit 100
  `;

  for (const appt of upcoming) {
    if (!appt.phone) continue;
    const when = new Date(appt.scheduled_at).toLocaleString('fr-FR', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    const body = `Bonjour ${appt.full_name}, rappel de votre rendez-vous ${appt.type || ''} le ${when} au Cabinet Dentaire du Cap Vert.`;
    // Rappel à l'initiative du cabinet : hors fenêtre de 24h, Meta n'accepte
    // qu'un modèle approuvé. Variables du modèle : nom, puis date/heure.
    // Passe par notifyPatient plutôt que par WhatsApp seul : le rappel
    // bénéficie ainsi du repli SMS si l'envoi WhatsApp est rejeté, et de la
    // ligne WhatsApp distincte quand le patient en a une.
    const result = await notifyPatient({
      patientId: appt.patient_id,
      phone: appt.phone,
      whatsappPhone: appt.whatsapp_phone,
      body,
      templateName: MODELES.rappel,
      templateParams: [appt.full_name, when],
    });
    if (!result.error) {
      await sql`update appointments set reminder_sent_at = ${now.toISOString()} where id = ${appt.id}`;
      results.appointmentReminders++;
    } else {
      results.errors.push(`reminder ${appt.id}: ${result.error}`);
    }
  }

  // 3. Suivi post-opératoire pour les rendez-vous "completed" de la veille
  // (fenêtre large pour un cron quotidien — reminder envoyé une seule fois
  // grâce à follow_up_sent_at).
  const followUpBefore = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const followUpAfter = new Date(now.getTime() - 30 * 60 * 60 * 1000).toISOString();

  const completed = await sql`
    select a.id, a.patient_id, p.full_name, p.phone, p.whatsapp_phone
    from appointments a
    join patients p on p.id = a.patient_id
    where a.status = 'completed'
      and a.follow_up_sent_at is null
      and a.completed_at is not null
      and a.completed_at between ${followUpAfter} and ${followUpBefore}
    limit 100
  `;

  for (const appt of completed) {
    if (!appt.phone) continue;
    const body = `Bonjour ${appt.full_name}, comment vous sentez-vous après votre soin d'aujourd'hui ? N'hésitez pas à nous contacter en cas de douleur inhabituelle.`;
    const result = await notifyPatient({
      patientId: appt.patient_id,
      phone: appt.phone,
      whatsappPhone: appt.whatsapp_phone,
      body,
    });
    if (!result.error) {
      await sql`update appointments set follow_up_sent_at = ${now.toISOString()} where id = ${appt.id}`;
      results.followUps++;
    } else {
      results.errors.push(`followup ${appt.id}: ${result.error}`);
    }
  }

  return NextResponse.json(results);
}
