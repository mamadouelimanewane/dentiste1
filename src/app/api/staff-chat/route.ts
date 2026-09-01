import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireStaff } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const MAX_LENGTH = 2000;

// Chat interne du cabinet : le widget est accessible à tout le personnel
// connecté (pas rattaché à un module de la sidebar), d'où requireStaff()
// plutôt qu'un privilège de module.
export async function GET() {
  const { error, status } = await requireStaff();
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`
    select m.id, m.body, m.created_at, m.author_id, u.full_name as author_name
    from staff_messages m
    join users u on u.id = m.author_id
    order by m.created_at desc
    limit 50
  `;

  // Renvoyé du plus ancien au plus récent pour un affichage naturel du fil.
  return NextResponse.json({ messages: rows.slice().reverse() });
}

export async function POST(request: Request) {
  const { session, error, status } = await requireStaff();
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const text = String(body?.body || '').trim();

  if (!text) {
    return NextResponse.json({ error: 'Message vide.' }, { status: 400 });
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ error: `Message trop long (max ${MAX_LENGTH} caractères).` }, { status: 400 });
  }

  const rows = await sql`
    insert into staff_messages (author_id, body)
    values (${session!.userId}, ${text})
    returning id, body, created_at, author_id
  `;

  return NextResponse.json({ message: rows[0] });
}
