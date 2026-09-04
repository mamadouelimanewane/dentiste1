import 'server-only';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { sendSms, isSmsConfigured } from '@/lib/integrations/sms';
import { isWhatsAppConfigured } from '@/lib/integrations/whatsapp';
import { preparerEnvoiManuel } from '@/lib/integrations/envoi-manuel';

// Envoi d'une notification patient sur un seul canal.
//
// L'accueil d'un nouveau patient et la confirmation de rendez-vous partaient
// simultanément en WhatsApp **et** en SMS. Ce sont les deux notifications les
// plus fréquentes d'un cabinet : le patient recevait donc deux fois le même
// texte — ce qu'il lit comme un dysfonctionnement — et le cabinet payait deux
// envois pour un seul message utile.
//
// On privilégie WhatsApp (gratuit dans la fenêtre de service, et le canal le
// plus lu au Sénégal) et on ne bascule en SMS que si l'envoi WhatsApp échoue
// immédiatement, ou si WhatsApp n'est pas configuré. Le cabinet qui tient au
// double envoi peut le rétablir avec NOTIFY_BOTH_CHANNELS=true.
const DOUBLE_CANAL = process.env.NOTIFY_BOTH_CHANNELS === 'true';

export interface NotifyResult {
  canal: 'whatsapp' | 'sms' | 'manuel' | 'aucun';
  simulated?: boolean;
  error?: string;
  // Identifiant du message déposé dans la file d'envoi manuel, le cas échéant.
  manuelId?: string;
}

// Dernier recours quand aucun canal automatique n'a pu porter le message.
//
// Le rappel n'est pas perdu : il passe en 'a_envoyer' et attend l'assistante,
// qui l'enverra depuis le téléphone du cabinet. On rend un résultat SANS
// erreur, pour que l'appelant (le cron) marque bien le rappel comme traité —
// sinon il le rejouerait chaque nuit et la file se remplirait de doublons.
async function deposerEnFile(params: {
  patientId?: string | null;
  numero: string;
  canal: 'whatsapp' | 'sms';
  body: string;
  sentBy?: string | null;
  motif?: string;
}): Promise<NotifyResult> {
  try {
    const prepare = await preparerEnvoiManuel(params);
    return { canal: 'manuel', manuelId: prepare.id };
  } catch {
    // Si même l'enregistrement échoue, on remonte l'échec d'origine plutôt
    // que de laisser croire que le message a été pris en charge.
    return { canal: 'aucun', error: params.motif || "Aucun canal d'envoi disponible." };
  }
}

export async function notifyPatient(params: {
  patientId?: string | null;
  phone: string;
  // Numéro WhatsApp lorsqu'il diffère de la ligne d'appel. Beaucoup de
  // patients ont deux puces : sans cette distinction, le message WhatsApp
  // partait vers une ligne qui n'a pas WhatsApp.
  whatsappPhone?: string | null;
  body: string;
  sentBy?: string | null;
  // Modèle approuvé et ses variables. Sans eux, l'envoi WhatsApp reste en
  // texte libre et n'aboutit que dans la fenêtre de 24h.
  templateName?: string;
  templateParams?: string[];
}): Promise<NotifyResult> {
  // Chaque canal reçoit sa propre ligne. À défaut de numéro WhatsApp
  // renseigné, on retombe sur le numéro d'appel : les dossiers existants
  // continuent de fonctionner sans reprise.
  const versWhatsApp = { ...params, phone: params.whatsappPhone || params.phone };
  const versSms = { ...params, phone: params.phone };

  if (DOUBLE_CANAL) {
    const [wa] = await Promise.all([
      sendWhatsAppMessage(versWhatsApp),
      sendSms(versSms),
    ]);
    return { canal: 'whatsapp', simulated: wa.simulated, error: wa.error };
  }

  if (isWhatsAppConfigured()) {
    const wa = await sendWhatsAppMessage(versWhatsApp);
    if (!wa.error) {
      return { canal: 'whatsapp', simulated: wa.simulated };
    }
    // Rejet immédiat de WhatsApp (numéro sans compte, modèle manquant...) :
    // le message ne doit pas être perdu pour autant.
    if (isSmsConfigured()) {
      const sms = await sendSms(versSms);
      if (!sms.error) return { canal: 'sms', simulated: sms.simulated };
      // Les deux canaux ont échoué : le message part en file manuelle plutôt
      // que de rester un « échec » que personne ne regarde.
      return deposerEnFile({
        patientId: params.patientId,
        numero: versWhatsApp.phone,
        canal: 'whatsapp',
        body: params.body,
        sentBy: params.sentBy,
        motif: sms.error,
      });
    }
    return deposerEnFile({
      patientId: params.patientId,
      numero: versWhatsApp.phone,
      canal: 'whatsapp',
      body: params.body,
      sentBy: params.sentBy,
      motif: wa.error,
    });
  }

  if (isSmsConfigured()) {
    const sms = await sendSms(versSms);
    if (!sms.error) return { canal: 'sms', simulated: sms.simulated };
    return deposerEnFile({
      patientId: params.patientId,
      numero: versSms.phone,
      canal: 'sms',
      body: params.body,
      sentBy: params.sentBy,
      motif: sms.error,
    });
  }

  // Aucun fournisseur paramétré du tout : la file manuelle est la seule voie.
  return deposerEnFile({
    patientId: params.patientId,
    numero: versWhatsApp.phone,
    canal: 'whatsapp',
    body: params.body,
    sentBy: params.sentBy,
  });
}
