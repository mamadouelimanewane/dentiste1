import 'server-only';
import { isWhatsAppConfigured } from '@/lib/integrations/whatsapp';
import { isSmsConfigured } from '@/lib/integrations/sms';
import { isPaymentConfigured, availableProviders } from '@/lib/integrations/payment';

// Expose uniquement des booléens (jamais les valeurs des clés) pour que
// l'UI puisse afficher un badge "Mode démo" sans jamais voir de secret.
//
// Ces indicateurs réutilisent les mêmes fonctions de détection que les
// modules d'envoi : toute autre logique finirait par diverger. C'était le
// cas auparavant — le statut ne testait que Meta pour WhatsApp (alors que
// l'envoi passe aussi par 360dialog ou Twilio, donc il affichait "démo"
// pendant que de vrais messages partaient) et ne testait que Twilio pour le
// SMS (alors que l'envoi privilégie Termii, donc il affichait "configuré"
// alors que les envois pouvaient échouer).
//
// Attention : ces booléens indiquent qu'un fournisseur est *paramétré*, pas
// que ses identifiants sont valides. Une clé expirée reste "true" ici et ne
// se révèle qu'à l'envoi (statut "failed" dans l'historique des messages).
export function getIntegrationStatus() {
  return {
    whatsapp: isWhatsAppConfigured(),
    sms: isSmsConfigured(),
    payments: isPaymentConfigured(),
    // Détail utile à l'UI : n'afficher que les moyens réellement disponibles.
    paymentProviders: availableProviders(),
    video: !!process.env.DAILY_API_KEY,
  };
}

export type IntegrationStatus = ReturnType<typeof getIntegrationStatus>;
