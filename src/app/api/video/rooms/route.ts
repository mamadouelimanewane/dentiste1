import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';
import { createOrGetDailyRoom } from '@/lib/integrations/daily';

export async function POST(request: Request) {
  const { error, status } = await requirePermission(11, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { appointmentId } = body as { appointmentId?: string };

  if (!appointmentId) {
    return NextResponse.json({ error: 'appointmentId est requis.' }, { status: 400 });
  }

  const result = await createOrGetDailyRoom(appointmentId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json(result);
}
