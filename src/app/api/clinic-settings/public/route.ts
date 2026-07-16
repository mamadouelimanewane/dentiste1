import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Sous-ensemble public de clinic_settings (identité légale du cabinet),
// sans authentification, utilisé par les pages légales publiques
// (mentions légales, politique de confidentialité). Ne jamais y exposer
// de donnée sensible.
export async function GET() {
  const rows = await sql`
    select clinic_name, address, phone, email, ninea, rccm
    from clinic_settings
    where id = true
    limit 1
  `;

  return NextResponse.json({ settings: rows[0] || null });
}
