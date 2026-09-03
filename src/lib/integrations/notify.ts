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
  body: string;
  sentBy?: string | null;
}): Promise<NotifyResult> {
  if (DOUBLE_CANAL) {
    const [wa] = await Promise.all([
      sendWhatsAppMessage(params),
      sendSms(params),
    ]);
    return { canal: 'whatsapp', simulated: wa.simulated, error: wa.error };
  }

  if (isWhatsAppConfigured()) {
    const wa = await sendWhatsAppMessage(params);
    if (!wa.error) {
      return { canal: 'whatsapp', simulated: wa.simulated };
    }
    // Rejet immédiat de WhatsApp (numéro sans compte, modèle manquant...) :
    // le message ne doit pas être perdu pour autant.
    if (isSmsConfigured()) {
      const sms = await sendSms(params);
      return { canal: 'sms', simulated: sms.simulated, error: sms.error };
    }
    return { canal: 'whatsapp', error: wa.error };
  }

  if (isSmsConfigured()) {
    const sms = await sendSms(params);
    return { canal: 'sms', simulated: sms.simulated, error: sms.error };
  }

  // Aucun canal configuré : on journalise quand même via WhatsApp, qui
  // enregistre le message en « simulé ».
  const wa = await sendWhatsAppMessage(params);
  return { canal: 'aucun', simulated: wa.simulated, error: wa.error };
}
