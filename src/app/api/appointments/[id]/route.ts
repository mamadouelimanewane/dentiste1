import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { validerCreneau } from '@/lib/validation';
import { notifyPatient, type NotifyResult } from '@/lib/integrations/notify';

// Prévenir le patient d'une annulation ou d'un report.
//
// Sans ce message, un rendez-vous annulé au cabinet restait connu du seul
// cabinet : le patient, lui, avait reçu une confirmation et se déplaçait pour
// une porte close. C'est le déplacement inutile le plus coûteux pour lui, et
// celui qu'un logiciel d'agenda peut éviter à peu de frais.
//
// L'envoi passe par notifyPatient, donc par la même cascade que le reste :
// WhatsApp, puis SMS, puis la file d'envoi manuel. Aucun canal n'étant ouvert
// aujourd'hui, le message atterrit dans la file — où l'assistante le voit et
// garde la main pour appeler plutôt qu'écrire, si elle préfère.
async function previenirPatient(
  patientId: string | null,
  texte: string
): Promise<NotifyResult | null> {
  if (!patientId) return null;
  const lignes = await sql`
    select full_name, phone, whatsapp_phone from patients where id = ${patientId} limit 1
  `;
  const p = lignes[0];
  if (!p?.phone && !p?.whatsapp_phone) return null;

  try {
    return await notifyPatient({
      patientId,
      phone: (p.phone as string) || (p.whatsapp_phone as string),
      whatsappPhone: p.whatsapp_phone as string | null,
      body: texte,
    });
  } catch {
    // Un rendez-vous annulé doit le rester même si la notification échoue.
    return null;
  }
}

function formaterCreneau(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(
    new Date(iso)
  );
}

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
  let notification: NotifyResult | null = null;

  // Nom du cabinet tel qu'il est paramétré : un message signé d'un nom que le
  // patient ne reconnaît pas se lit comme une tentative d'arnaque.
  const reglages = await sql`select clinic_name from clinic_settings limit 1`;
  const nomCabinet = (reglages[0]?.clinic_name as string) || 'Cabinet Dentaire du Cap Vert';

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
    case 'cancel': {
      // On relit l'heure AVANT de modifier : le message doit citer le
      // créneau que le patient avait noté.
      const avant = await sql`
        select patient_id, scheduled_at from appointments
        where id = ${params.id} and status <> 'cancelled' limit 1
      `;
      rows = await sql`
        update appointments set status = 'cancelled' where id = ${params.id} returning *
      `;
      if (rows.length > 0 && avant[0]) {
        notification = await previenirPatient(
          avant[0].patient_id as string | null,
          `${nomCabinet} : votre rendez-vous du ${formaterCreneau(
            String(avant[0].scheduled_at)
          )} est annulé. Merci de nous contacter pour convenir d'une nouvelle date.`
        );
      }
      break;
    }
    case 'no-show':
      rows = await sql`
        update appointments set status = 'no_show' where id = ${params.id} returning *
      `;
      break;
    case 'reschedule':
      if (!scheduledAt) {
        return NextResponse.json({ error: 'scheduledAt est requis pour replanifier.' }, { status: 400 });
      }
      const current = await sql`select patient_id, practitioner_id, duration_minutes, scheduled_at from appointments where id = ${params.id} limit 1`;
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
      if (rows.length > 0) {
        // Le message cite l'ancienne ET la nouvelle date : le patient doit
        // pouvoir vérifier que c'est bien son rendez-vous qu'on déplace.
        notification = await previenirPatient(
          patient_id as string | null,
          `${nomCabinet} : votre rendez-vous du ${formaterCreneau(
            String(current[0].scheduled_at ?? scheduledAt)
          )} est reporté au ${formaterCreneau(scheduledAt)}. Merci de nous contacter si cette date ne vous convient pas.`
        );
      }
      break;
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Rendez-vous introuvable.' }, { status: 404 });
  }

  // `notification` dit à l'écran ce qui est réellement parti : envoyé par
  // WhatsApp, par SMS, ou déposé en file d'envoi manuel. Sans cette
  // remontée, l'assistante ne saurait pas si le patient a été prévenu.
  return NextResponse.json({ appointment: rows[0], notification });
}
