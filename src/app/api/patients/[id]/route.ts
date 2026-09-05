import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission, getRoleById } from '@/lib/permissions';
import { getStaffSession } from '@/lib/session';
import { hasPermission } from '@/lib/modules';
import { recordAudit } from '@/lib/audit';
import { validerTelephone } from '@/lib/validation';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { error, status } = await requirePermission(20, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`
    select id, dossier_number, full_name, birth_date, phone, whatsapp_phone, address, national_id,
           allergies, mutuelle, medical_history, status, created_at
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
// Accessible à l'accueil (module 1) comme au praticien (module 3) : une
// allergie découverte au fauteuil doit pouvoir être consignée immédiatement
// par le soignant, sans passer par la réception.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getStaffSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  const role = await getRoleById(session.roleId);
  if (!role || (!hasPermission(role.permissions, 1, 'manage') && !hasPermission(role.permissions, 3, 'manage'))) {
    return NextResponse.json({ error: 'Rôle non autorisé.' }, { status: 403 });
  }

  const body = await request.json();
  const {
    full_name: fullName,
    birth_date: birthDate,
    phone,
    // Ligne WhatsApp du patient, quand elle diffère de la ligne d'appel. La
    // colonne existait (migration 0027) et l'envoi s'en servait déjà, mais
    // aucune route ne permettait de la modifier : une fois le dossier créé, le
    // numéro n'était plus atteignable autrement qu'en SQL.
    whatsapp_phone: whatsappPhone,
    address,
    allergies,
    mutuelle,
  } = body as Record<string, string | null | undefined>;

  // Antécédents médicaux (module Arrivée) : objet libre {reponses, observations}
  const medicalHistory = (body as Record<string, unknown>).medical_history;

  // Les deux lignes sont validées ici : la modification de fiche ne l'a jamais
  // fait, alors que la création le fait. Un numéro mal formé enregistré ici
  // ressortait plus tard en échec d'envoi, sans qu'on sache d'où il venait.
  for (const [libelle, valeur] of [
    ['Téléphone', phone],
    ['Numéro WhatsApp', whatsappPhone],
  ] as const) {
    if (valeur === undefined || valeur === null || valeur === '') continue;
    const verif = validerTelephone(valeur);
    if (!verif.ok) {
      return NextResponse.json({ error: `${libelle} — ${verif.erreur}` }, { status: 400 });
    }
  }

  if (fullName !== undefined && !String(fullName).trim()) {
    return NextResponse.json({ error: 'Le nom ne peut pas être vide.' }, { status: 400 });
  }

  const rows = await sql`
    update patients set
      full_name = coalesce(${fullName ?? null}, full_name),
      birth_date = coalesce(${birthDate ?? null}, birth_date),
      phone = coalesce(${phone ?? null}, phone),
      whatsapp_phone = coalesce(${whatsappPhone ?? null}, whatsapp_phone),
      address = coalesce(${address ?? null}, address),
      allergies = coalesce(${allergies ?? null}, allergies),
      mutuelle = coalesce(${mutuelle ?? null}, mutuelle),
      medical_history = coalesce(${medicalHistory ? JSON.stringify(medicalHistory) : null}::jsonb, medical_history),
      updated_at = now()
    where id = ${params.id}
    returning id, dossier_number, full_name, birth_date, phone, whatsapp_phone, address, national_id,
              allergies, mutuelle, status, created_at
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Patient introuvable.' }, { status: 404 });
  }

  await recordAudit({
    actorId: session.userId,
    action: 'Modification dossier patient',
    entityTable: 'patients',
    entityId: params.id,
    meta: { champsModifies: Object.keys(body) },
  });

  return NextResponse.json({ patient: rows[0] });
}
