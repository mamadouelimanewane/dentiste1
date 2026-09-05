/** @type {import('next').NextConfig} */

// En-têtes de sécurité HTTP.
//
// Aucun n'était posé. Sur une application qui manipule des dossiers de santé,
// trois d'entre eux comblent des trous concrets :
//
//   * Referrer-Policy — le lien magique du portail transporte un jeton dans
//     l'URL. Sans cette politique, ce jeton part dans l'en-tête Referer vers
//     tout domaine tiers que la page contacte. La redirection immédiate limite
//     déjà le risque ; l'en-tête le ferme.
//   * X-Content-Type-Options — les fichiers déposés par les patients sont
//     servis depuis un stockage public. Interdire au navigateur de deviner le
//     type empêche qu'un fichier annoncé comme image soit interprété
//     autrement.
//   * X-Frame-Options — un cabinet dont l'interface peut être encadrée par un
//     site tiers est exposé au détournement de clic : un praticien croit
//     cliquer ailleurs et valide une action réelle.
//
// PAS DE CSP ici, et c'est délibéré : l'application charge react-pdf (workers
// et blobs), l'iframe de téléconsultation Daily.co et les fichiers du stockage
// Vercel. Une politique écrite au jugé casserait ces fonctions en production
// sans que personne ne s'en aperçoive avant l'usage réel. Elle demande d'être
// construite en observant le trafic, pas devinée.
const enTetesSecurite = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    // La caméra et le micro restent autorisés pour l'origine : la
    // téléconsultation et la dictée vocale en dépendent. Tout le reste est
    // refusé, y compris aux iframes.
    key: 'Permissions-Policy',
    value: 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()',
  },
];

const nextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: enTetesSecurite }];
  },
};

export default nextConfig;
