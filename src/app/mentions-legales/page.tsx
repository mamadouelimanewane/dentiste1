import Link from 'next/link';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getClinicIdentity() {
  try {
    const rows = await sql`select clinic_name, address, phone, email, ninea, rccm from clinic_settings where id = true limit 1`;
    return rows[0] || null;
  } catch {
    return null;
  }
}

export default async function MentionsLegalesPage() {
  const clinic = await getClinicIdentity();
  const name = clinic?.clinic_name || 'Cabinet Dentaire du Cap Vert';

  return (
    <div className="min-h-screen bg-[#0F172A] px-4 py-12">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 text-slate-300 space-y-6">
        <div>
          <Link href="/login" className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:underline">← Retour</Link>
          <h1 className="text-xl font-bold text-white mt-4">Mentions légales</h1>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Éditeur</h2>
          <p className="text-sm">
            {name}
            {clinic?.address && <><br />{clinic.address}</>}
            {clinic?.phone && <><br />Tél : {clinic.phone}</>}
            {clinic?.email && <><br />Email : {clinic.email}</>}
          </p>
          {(clinic?.ninea || clinic?.rccm) && (
            <p className="text-sm">
              {clinic?.ninea && <>NINEA : {clinic.ninea}<br /></>}
              {clinic?.rccm && <>RCCM : {clinic.rccm}</>}
            </p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Hébergement</h2>
          <p className="text-sm">
            Application hébergée par Vercel Inc. (États-Unis). Base de données hébergée par Neon (PostgreSQL serverless).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Objet</h2>
          <p className="text-sm">
            Ce site est un outil de gestion interne réservé au personnel du cabinet et à ses patients (portail patient sécurisé par lien nominatif). Il n'est pas destiné à la vente en ligne ni à un usage grand public non authentifié.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Propriété intellectuelle</h2>
          <p className="text-sm">
            L'ensemble des éléments de cette application (structure, textes, logiciel) est la propriété de {name}, sauf mention contraire.
          </p>
        </section>

        <p className="text-xs text-slate-500 pt-4 border-t border-slate-800">
          Voir également notre <Link href="/confidentialite" className="text-blue-400 hover:underline">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}
