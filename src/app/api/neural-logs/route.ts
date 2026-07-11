import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireStaff } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { error, status } = await requireStaff();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const commandType = searchParams.get('command_type');
  const limit = Number(searchParams.get('limit') || 50);

  const logs = commandType
    ? await sql`
        select * from neural_logs
        where command_type = ${commandType}
        order by created_at desc
        limit ${limit}
      `
    : await sql`
        select * from neural_logs
        order by created_at desc
        limit ${limit}
      `;

  return NextResponse.json({ logs });
}

export async function POST(request: Request) {
  const { error, status } = await requireStaff();
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { commandId, commandType, content, suggestion, statusValue, meta } = body as {
    commandId?: string;
    commandType?: string;
    content?: string;
    suggestion?: string;
    statusValue?: string;
    meta?: unknown;
  };

  if (!commandType || !content) {
    return NextResponse.json({ error: 'commandType et content sont requis.' }, { status: 400 });
  }

  const rows = await sql`
    insert into neural_logs (command_id, command_type, content, suggestion, status, meta_data)
    values (${commandId ?? null}, ${commandType}, ${content}, ${suggestion ?? null}, ${statusValue || 'pending'}, ${meta ? JSON.stringify(meta) : null})
    returning *
  `;

  return NextResponse.json({ log: rows[0] });
}
