import 'server-only';

// Expose uniquement des booléens (jamais les valeurs des clés) pour que
// l'UI puisse afficher un badge "Mode démo" sans jamais voir de secret.
export function getIntegrationStatus() {
  return {
    whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    sms: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
    payments: !!process.env.CINETPAY_API_KEY && !!process.env.CINETPAY_SITE_ID,
    video: !!process.env.DAILY_API_KEY,
  };
}

export type IntegrationStatus = ReturnType<typeof getIntegrationStatus>;
