import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

// Diagnostic WhatsApp Business, en LECTURE SEULE.
//
// Le compte du cabinet est resté bloqué des semaines sur l'erreur 131042
// (« moyen de paiement absent »), visible seulement à l'envoi : il fallait
// écrire à un vrai patient pour savoir où en était le compte. Cette route
// interroge Meta sans rien envoyer, et rend l'état réel du compte, du numéro
// et des modèles.
//
// Ce qu'elle ne peut pas faire : lire l'état de facturation. Meta ne l'expose
// dans aucune API. On peut donc constater que tout le reste est en ordre,
// jamais affirmer que la facturation l'est — seul un envoi le prouve.

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const API = 'https://graph.facebook.com/v20.0';

type Lecture = { data?: Record<string, unknown>; erreur?: string };

async function lire(chemin: string): Promise<Lecture> {
  try {
    const res = await fetch(`${API}/${chemin}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        erreur: `${data?.error?.code ?? res.status} ${data?.error?.message || 'échec'}`.trim(),
      };
    }
    return { data };
  } catch (e) {
    return { erreur: e instanceof Error ? e.message : 'erreur réseau' };
  }
}

export async function GET() {
  const { error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  if (!ACCESS_TOKEN || !WABA_ID) {
    return NextResponse.json(
      { error: 'WhatsApp Cloud API non configuré (jeton ou identifiant de compte absent).' },
      { status: 503 }
    );
  }

  const [compte, numero, modeles] = await Promise.all([
    lire(`${WABA_ID}?fields=id,name,account_review_status,business_verification_status,country,currency,timezone_id,owner_business_info`),
    PHONE_NUMBER_ID
      ? lire(`${PHONE_NUMBER_ID}?fields=display_phone_number,verified_name,quality_rating,code_verification_status,name_status,platform_type`)
      : Promise.resolve<Lecture>({ erreur: 'WHATSAPP_PHONE_NUMBER_ID absent' }),
    lire(`${WABA_ID}/message_templates?fields=name,status,language,category,rejected_reason&limit=50`),
  ]);

  const brutModeles = (modeles.data?.data as Record<string, unknown>[] | undefined) || [];
  const listeModeles = brutModeles.map((m) => ({
    nom: String(m.name ?? ''),
    statut: String(m.status ?? ''),
    langue: String(m.language ?? ''),
    categorie: String(m.category ?? ''),
    motifRejet:
      m.rejected_reason && m.rejected_reason !== 'NONE' ? String(m.rejected_reason) : null,
  }));

  return NextResponse.json({
    compte: compte.erreur ? { erreur: compte.erreur } : compte.data,
    numero: numero.erreur ? { erreur: numero.erreur } : numero.data,
    modeles: modeles.erreur ? { erreur: modeles.erreur } : listeModeles,
    approuves: listeModeles.filter((m: { statut: string }) => m.statut === 'APPROVED').length,
    // Rappel affiché tel quel dans la réponse : sans lui, un diagnostic « tout
    // vert » se lirait comme la preuve que les envois vont aboutir.
    remarque:
      "Meta n'expose l'état de facturation dans aucune API. Un compte en ordre ici peut encore refuser les envois avec l'erreur 131042 : seul un envoi réel le confirme.",
  });
}
