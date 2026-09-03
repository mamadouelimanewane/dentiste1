import 'server-only';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { sendSms, isSmsConfigured } from '@/lib/integrations/sms';
import { isWhatsAppConfigured } from '@/lib/integrations/whatsapp';

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
  canal: 'whatsapp' | 'sms' | 'aucun';
  simulated?: boolean;
  error?: string;
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
      return { canal: 'sms', simulated: sms.simulated, error: sms.error };
    }
    return { canal: 'whatsapp', error: wa.error };
  }

  if (isSmsConfigured()) {
    const sms = await sendSms(versSms);
    return { canal: 'sms', simulated: sms.simulated, error: sms.error };
  }

  // Aucun canal configuré : on journalise quand même via WhatsApp, qui
  // enregistre le message en « simulé ».
  const wa = await sendWhatsAppMessage(versWhatsApp);
  return { canal: 'aucun', simulated: wa.simulated, error: wa.error };
}
