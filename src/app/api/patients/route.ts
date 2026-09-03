import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { notifyPatient } from '@/lib/integrations/notify';
import { isDatabaseConfigured } from '@/lib/db';
import {
  validerNom,
  validerTelephone,
  validerDateNaissance,
  bornerTexte,
} from '@/lib/validation';
import { recordAudit } from '@/lib/audit';

function getBaseUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { error, status } = await requirePermission(20, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  const patients = q
    ? await sql`
        select id, dossier_number, full_name, phone, status, created_at
        from patients
        where full_name ilike ${'%' + q + '%'}
           or dossier_number ilike ${'%' + q + '%'}
           or phone ilike ${'%' + q + '%'}
        order by created_at desc
        limit 50
      `
    : await sql`
        select id, dossier_number, full_name, phone, status, created_at
        from patients
        order by created_at desc
        limit 50
      `;

  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(1, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const { fullName, birthDate, phone, address, allergies, mutuelle } = body as {
    fullName?: string;
    birthDate?: string;
    phone?: string;
    address?: string;
    allergies?: string;
    mutuelle?: string;
  };

  // Auparavant seul un `fullName` non vide au sens de JavaScript était exigé :
  // trois espaces, un téléphone « pas-un-numero » ou un nom de 10 000
  // caractères passaient sans broncher.
  const nom = validerNom(fullName);
  if (!nom.ok) return NextResponse.json({ error: nom.erreur }, { status: 400 });

  const tel = validerTelephone(phone);
  if (!tel.ok) return NextResponse.json({ error: tel.erreur }, { status: 400 });

  const naissance = validerDateNaissance(birthDate);
  if (!naissance.ok) return NextResponse.json({ error: naissance.erreur }, { status: 400 });

  const rows = await sql`
    insert into patients (full_name, birth_date, phone, address, allergies, mutuelle, created_by)
    values (${nom.valeur}, ${naissance.valeur}, ${tel.valeur}, ${bornerTexte(address, 300)},
            ${bornerTexte(allergies, 500)}, ${bornerTexte(mutuelle, 150)}, ${session!.userId})
    returning id, dossier_number, full_name, birth_date, phone, address, allergies, mutuelle, status, created_at
  `;

  const patient = rows[0];

  await recordAudit({
    actorId: session!.userId,
    action: 'Création dossier patient',
    entityTable: 'patients',
    entityId: patient.id,
    meta: { fullName: patient.full_name, dossierNumber: patient.dossier_number },
  });

  // ── Envoi automatique du message de bienvenue + lien portail ──────────────
  let welcomeResult: {
    link: string | null;
    simulated: boolean;
    channels: string[];
    error?: string;
  } = { link: null, simulated: false, channels: [] };

  if (phone && isDatabaseConfigured()) {
    try {
      // Token portail à usage long (48h) — aligné sur la même échelle que le
      // lien de renvoi (24h, voir magic-link/route.ts) pour éviter une
      // fenêtre de validité incohérente entre les deux flux.
      const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;
      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

      await sql`
        insert into patient_portal_tokens (patient_id, token, expires_at, created_by)
        values (${patient.id}, ${token}, ${expiresAt}, ${session!.userId})
      `;

      const baseUrl = getBaseUrl(request);
      const link = `${baseUrl}/portal/auth?token=${token}`;
      const dossier = patient.dossier_number;

      const messageBody =
        `🦷 Bienvenue au Cabinet Dentaire du Cap Vert, ${patient.full_name} !\n\n` +
        `Votre dossier N°${dossier} a bien été créé.\n\n` +
        `Accédez à votre espace patient (rendez-vous, documents, ordonnances) :\n${link}\n\n` +
        `Lien valable 48h. À bientôt !`;

      // Un seul canal (voir src/lib/integrations/notify.ts) : le double envoi
      // faisait recevoir deux fois le même message de bienvenue.
      const envoi = await notifyPatient({
        patientId: patient.id,
        phone,
        body: messageBody,
        sentBy: session!.userId,
      });

      welcomeResult = {
        link,
        simulated: envoi.simulated === true,
        channels: [envoi.canal],
        error: envoi.error,
      };
    } catch (err) {
      // L'échec du message de bienvenue ne doit pas bloquer la création du dossier
      welcomeResult = {
        link: null,
        simulated: false,
        channels: [],
        error: err instanceof Error ? err.message : 'Erreur envoi bienvenue.',
      };
    }
  } else if (phone && !isDatabaseConfigured()) {
    // Mode démo complet sans DB : simuler le lien portail localement
    const baseUrl = getBaseUrl(request);
    welcomeResult = {
      link: `${baseUrl}/portal/auth?token=DEMO_TOKEN_${patient.id}`,
      simulated: true,
      channels: ['whatsapp', 'sms'],
    };
  }
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ patient, welcome: welcomeResult });
}
