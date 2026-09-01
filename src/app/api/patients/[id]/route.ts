import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { recordAudit } from '@/lib/audit';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requirePermission(20, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`
    select id, dossier_number, full_name, birth_date, phone, address, national_id,
           allergies, mutuelle, status, created_at
    from patients
    where id = ${params.id}
    limit 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Patient introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ patient: rows[0] });
}

// Correction d'un dossier existant (faute de frappe, changement de numéro,
// ajout d'allergies découvertes en consultation...). Chaque champ est
// optionnel : seuls ceux fournis sont écrasés.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { session, error, status } = await requirePermission(1, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const {
    full_name: fullName,
    birth_date: birthDate,
    phone,
    address,
    allergies,
    mutuelle,
  } = body as Record<string, string | null | undefined>;

  if (fullName !== undefined && !String(fullName).trim()) {
    return NextResponse.json({ error: 'Le nom ne peut pas être vide.' }, { status: 400 });
  }

  const rows = await sql`
    update patients set
      full_name = coalesce(${fullName ?? null}, full_name),
      birth_date = coalesce(${birthDate ?? null}, birth_date),
      phone = coalesce(${phone ?? null}, phone),
      address = coalesce(${address ?? null}, address),
      allergies = coalesce(${allergies ?? null}, allergies),
      mutuelle = coalesce(${mutuelle ?? null}, mutuelle),
      updated_at = now()
    where id = ${params.id}
    returning id, dossier_number, full_name, birth_date, phone, address, national_id,
              allergies, mutuelle, status, created_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Patient introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session!.userId,
    action: 'Modification dossier patient',
    entityTable: 'patients',
    entityId: params.id,
    meta: { champsModifies: Object.keys(body) },
  });

  return NextResponse.json({ patient: rows[0] });
}
