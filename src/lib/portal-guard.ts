import 'server-only';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { PORTAL_COOKIE_NAME, verifyPortalSessionToken } from '@/lib/portal-session';

// Session patient valide ET dossier encore ouvert.
//
// `verifyPortalSessionToken` ne contrôle que la signature du jeton, qui vit
// SEPT JOURS. Rien ne vérifiait ensuite l'état du dossier :
//
//   * un dossier ANONYMISÉ restait consultable une semaine. L'anonymisation
//     supprime bien les liens magiques, mais pas les sessions déjà ouvertes :
//     après une demande de droit à l'oubli, le porteur du téléphone
//     continuait de lire documents et messages ;
//   * un dossier supprimé laissait de même un jeton parfaitement valide.
//
// Ce garde est le pendant, côté patient, de celui posé pour le personnel :
// l'autorisation se relit à chaque requête, elle ne se déduit pas d'un jeton
// émis des jours plus tôt.
export async function chargerPatientDuPortail(): Promise<
  | { patientId: string; erreur: null }
  | { patientId: null; erreur: string; statut: 401 | 403 }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  const session = token ? await verifyPortalSessionToken(token) : null;

  if (!session) {
    return { patientId: null, erreur: 'Session portail invalide.', statut: 401 };
  }

  const lignes = await sql`
    select status from patients where id = ${session.patientId} limit 1
  `;
  if (lignes.length === 0) {
    return { patientId: null, erreur: 'Dossier introuvable.', statut: 401 };
  }
  if (lignes[0].status === 'anonymized') {
    return { patientId: null, erreur: 'Ce dossier a été clôturé.', statut: 403 };
  }

  return { patientId: session.patientId, erreur: null };
}
