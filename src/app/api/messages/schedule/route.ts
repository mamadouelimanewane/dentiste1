import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { bornerTexte, validerTelephone } from '@/lib/validation';

export const dynamic = 'force-dynamic';

// Messages programmés.
//
// La table `scheduled_messages` existait, la tâche planifiée la traitait
// chaque nuit — mais aucun écran n'appelait cette route : elle est restée
// vide depuis toujours. Le cabinet ne pouvait donc pas programmer un suivi
// post-opératoire, alors que tout était en place pour l'envoyer.

// Liste des envois en attente, pour que le cabinet voie ce qui partira et
// puisse l'annuler. Sans cela, programmer un message reviendrait à le confier
// à une boîte noire.
export async function GET() {
  const { error, status } = await requirePermission(18, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`
    select s.id, s.phone, s.channel::text as channel, s.body, s.send_at, s.status::text as status,
           p.full_name as patient_name
    from scheduled_messages s
    left join patients p on p.id = s.patient_id
    where s.status = 'pending'
    order by s.send_at asc
    limit 100
  `;
  return NextResponse.json({ programmes: rows });
}

// Annulation. On ne supprime pas la ligne : son statut passe à 'cancelled',
// ce qui laisse une trace de ce qui avait été prévu.
export async function DELETE(request: Request) {
  const { error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id est requis.' }, { status: 400 });

  const rows = await sql`
    update scheduled_messages set status = 'cancelled'
    where id = ${id} and status = 'pending'
    returning id
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Ce message n'est plus en attente." }, { status: 409 });
  }
  return NextResponse.json({ annule: rows[0].id });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(18, 'manage');
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

  const tel = validerTelephone(phone);
  if (!tel.ok) return NextResponse.json({ error: tel.erreur }, { status: 400 });
  if (!tel.valeur) return NextResponse.json({ error: 'Numéro requis.' }, { status: 400 });

  const texte = bornerTexte(message, 1000);
  if (!texte) return NextResponse.json({ error: 'Le message est vide.' }, { status: 400 });

  // Une date illisible ou trop lointaine laisserait une ligne que la tâche
  // planifiée ne traiterait jamais — un message perpétuellement « en attente ».
  const quand = new Date(sendAt);
  if (Number.isNaN(quand.getTime())) {
    return NextResponse.json({ error: "Date d'envoi invalide." }, { status: 400 });
  }
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() + 2);
  if (quand > limite) {
    return NextResponse.json(
      { error: "Date d'envoi trop lointaine (au-delà de 2 ans)." },
      { status: 400 }
    );
  }

  const rows = await sql`
    insert into scheduled_messages (patient_id, phone, channel, body, send_at, source, created_by)
    values (${patientId ?? null}, ${tel.valeur}, ${channel}, ${texte}, ${quand.toISOString()}, 'manual', ${session!.userId})
    returning *
  `;

  return NextResponse.json({ scheduled: rows[0] });
}
