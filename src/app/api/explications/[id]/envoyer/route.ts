import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';
import { notifyPatient } from '@/lib/integrations/notify';

export const dynamic = 'force-dynamic';

// Envoie au patient l'explication de son plan de soins, après validation
// explicite par le praticien.
//
// Rien ne part automatiquement : un texte rédigé par un modèle et transmis
// sans relecture engagerait le cabinet sur des mots qu'il n'a pas choisis.
// L'envoi vaut donc validation, et les deux sont enregistrés.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { session, error, status } = await requirePermission(4, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json().catch(() => ({}));
  const { langue } = body as { langue?: 'fr' | 'wo' };

  const rows = await sql`
    select e.id, e.patient_id, e.texte_fr, e.texte_wo, e.envoye_le, p.full_name, p.phone
    from patient_explanations e
    join patients p on p.id = e.patient_id
    where e.id = ${params.id}
    limit 1
  `;
  const expl = rows[0];
  if (!expl) {
    return NextResponse.json({ error: 'Explication introuvable.' }, { status: 404 });
  }
  if (!expl.phone) {
    return NextResponse.json(
      { error: "Ce patient n'a pas de numéro enregistré. Imprimez l'explication et remettez-la en main propre." },
      { status: 400 }
    );
  }

  const texte = langue === 'wo' ? (expl.texte_wo as string) : (expl.texte_fr as string);
  if (!texte?.trim()) {
    return NextResponse.json(
      { error: langue === 'wo' ? "Aucune version wolof disponible." : 'Aucun texte à envoyer.' },
      { status: 400 }
    );
  }

  const message =
    `Cabinet Dentaire du Cap Vert — ${expl.full_name}\n\n` +
    `${texte}\n\n` +
    `Pour toute question, contactez le cabinet.`;

  const envoi = await notifyPatient({
    patientId: expl.patient_id as string,
    phone: expl.phone as string,
    body: message,
    sentBy: session!.userId,
  });

  if (envoi.error) {
    return NextResponse.json({ error: envoi.error }, { status: 502 });
  }

  await sql`
    update patient_explanations
    set valide_par = ${session!.userId},
        valide_le = coalesce(valide_le, now()),
        envoye_le = now()
    where id = ${params.id}
  `;

  return NextResponse.json({ envoye: true, canal: envoi.canal, simulated: envoi.simulated === true });
}
