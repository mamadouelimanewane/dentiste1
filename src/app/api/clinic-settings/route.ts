import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET() {
  const { error, status } = await requirePermission(21, 'view');
  if (error) return NextResponse.json({ error }, { status });

  const rows = await sql`select * from clinic_settings where id = true limit 1`;
  return NextResponse.json({ settings: rows[0] || null });
}

export async function PUT(request: Request) {
  const { session, error, status } = await requirePermission(21, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json();
  const {
    clinicName, slogan, phone, email, website, address, rpps, ninea, rccm, currency,
  } = body as Record<string, string | undefined>;

  if (!clinicName?.trim()) {
    return NextResponse.json({ error: 'Le nom du cabinet est requis.' }, { status: 400 });
  }

  // Valeur de la lettre-clé D du cabinet. Elle multiplie chaque cotation du
  // catalogue : une saisie erronée décale l'intégralité des devis et des
  // factures, proportionnellement et sans rien signaler. D'où des bornes.
  const valeurDBrute = (body as { valeurD?: unknown }).valeurD;
  let valeurD: number | null = null;
  if (valeurDBrute !== undefined && valeurDBrute !== null && valeurDBrute !== '') {
    const n = Number(valeurDBrute);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 100 || n > 100_000) {
      return NextResponse.json(
        { error: 'Valeur de D invalide : un entier entre 100 et 100 000 FCFA est attendu.' },
        { status: 400 }
      );
    }
    valeurD = n;
  }

  const rows = await sql`
    update clinic_settings
    set
      clinic_name = ${clinicName.trim()},
      slogan = ${slogan || null},
      phone = ${phone || null},
      email = ${email || null},
      website = ${website || null},
      address = ${address || null},
      rpps = ${rpps || null},
      ninea = ${ninea || null},
      rccm = ${rccm || null},
      currency = ${currency || 'FCFA'},
      -- Absente du corps : on conserve la valeur en place plutôt que de la
      -- remettre à la valeur par défaut.
      valeur_d = coalesce(${valeurD}, valeur_d),
      updated_by = ${session!.userId},
      updated_at = now()
    where id = true
    returning *
  `;

  return NextResponse.json({ settings: rows[0] });
}
