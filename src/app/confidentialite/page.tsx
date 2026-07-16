import Link from 'next/link';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getClinicIdentity() {
  try {
    const rows = await sql`select clinic_name, address, phone, email from clinic_settings where id = true limit 1`;
    return rows[0] || null;
  } catch {
    return null;
  }
}

export default async function ConfidentialitePage() {
  const clinic = await getClinicIdentity();
  const name = clinic?.clinic_name || 'Cabinet Dentaire du Cap Vert';
  const contactEmail = clinic?.email || null;

  return (
    <div className="min-h-screen bg-[#0F172A] px-4 py-12">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-8 text-slate-300 space-y-6">
        <div>
          <Link href="/login" className="text-blue-400 text-xs font-bold uppercase tracking-widest hover:underline">← Retour</Link>
          <h1 className="text-xl font-bold text-white mt-4">Politique de confidentialité</h1>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Responsable du traitement</h2>
          <p className="text-sm">
            {name} est responsable du traitement des données personnelles et de santé collectées via cette application, conformément à la loi n°2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel (Sénégal).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Données collectées</h2>
          <p className="text-sm">
            Identité et coordonnées (nom, téléphone, adresse, date de naissance), données de santé (dossier médical, actes réalisés, ordonnances, radiographies), données de facturation, et échanges via le portail patient ou WhatsApp/SMS.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Finalités</h2>
          <p className="text-sm">
            Gestion du dossier médical et du suivi clinique, prise de rendez-vous et rappels, facturation et gestion des mutuelles/assurances, communication avec le patient (portail, SMS, WhatsApp).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Base légale</h2>
          <p className="text-sm">
            Exécution de la relation de soins, consentement du patient pour les communications électroniques, et obligations légales de conservation des dossiers médicaux.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Destinataires</h2>
          <p className="text-sm">
            Le personnel habilité du cabinet (accès restreint par rôle, tracé dans un journal d'audit), ainsi que nos prestataires techniques (hébergement de l'application et de la base de données, envoi de SMS/WhatsApp), tenus à des obligations de sécurité et de confidentialité.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Conservation</h2>
          <p className="text-sm">
            Les données sont conservées pendant la durée nécessaire au suivi médical du patient et conformément aux obligations légales de conservation des dossiers de santé.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Vos droits</h2>
          <p className="text-sm">
            Vous disposez d'un droit d'accès, de rectification et de suppression/anonymisation de vos données personnelles, ainsi que du droit de retirer votre consentement aux communications électroniques à tout moment.
            {contactEmail ? <> Pour exercer ces droits, contactez-nous à <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">{contactEmail}</a>.</> : ' Pour exercer ces droits, contactez le cabinet directement.'}
          </p>
          <p className="text-sm">
            Vous pouvez également adresser une réclamation à la Commission de protection des Données personnelles (CDP) du Sénégal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Sécurité</h2>
          <p className="text-sm">
            Accès protégé par authentification, permissions par rôle, et journal d'audit des actions sensibles. Aucune donnée n'est vendue ni partagée à des fins publicitaires.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-white uppercase tracking-widest">Cookies</h2>
          <p className="text-sm">
            Seuls des cookies de session strictement nécessaires au fonctionnement (connexion sécurisée) sont utilisés — aucun cookie publicitaire ou de suivi tiers.
          </p>
        </section>

        <p className="text-xs text-slate-500 pt-4 border-t border-slate-800">
          Voir également nos <Link href="/mentions-legales" className="text-blue-400 hover:underline">mentions légales</Link>.
        </p>
      </div>
    </div>
  );
}
