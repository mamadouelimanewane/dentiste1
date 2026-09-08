import 'server-only';

// Service des fichiers patients.
//
// Les clichés, documents et notes vocales sont déposés dans le magasin de
// fichiers du cabinet, qui est un magasin **public** : l'URL d'un fichier
// suffit à l'ouvrir, sans session, sans rôle, sans trace. Ces URL étaient
// rendues telles quelles par les API et posées dans le HTML (`<img src>`,
// `<a href>`). Il suffisait donc d'un lien recopié, d'un historique de
// navigateur ou d'une capture d'écran partagée pour qu'une radiographie
// devienne accessible à n'importe qui, indéfiniment.
//
// Désormais l'URL du magasin ne quitte plus le serveur. Le navigateur ne
// connaît qu'un identifiant, et c'est une route authentifiée qui va chercher
// le fichier et le renvoie. Le contrôle d'accès redevient celui du dossier :
// le même que pour le reste du dossier médical.
//
// Ce que cela ne change pas : les fichiers déjà déposés avant ce changement
// gardent leur URL publique. Il n'y en avait aucun au moment de la bascule
// (0 document, 0 cliché en base) ; si le cas se représentait, il faudrait les
// redéposer sous un nouveau chemin et supprimer l'ancien.

export async function servirFichier(
  blobUrl: string,
  options: { mime?: string | null; nomFichier?: string | null; telecharger?: boolean }
): Promise<Response> {
  const amont = await fetch(blobUrl, { cache: 'no-store' });

  if (!amont.ok || !amont.body) {
    return new Response(JSON.stringify({ error: 'Fichier introuvable dans le magasin.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const type = options.mime || amont.headers.get('content-type') || 'application/octet-stream';
  const nom = (options.nomFichier || 'fichier').replace(/["\r\n]/g, '');

  return new Response(amont.body, {
    headers: {
      'Content-Type': type,
      // `inline` pour ce qui s'affiche dans l'écran (clichés, audio),
      // `attachment` pour ce que l'on enregistre.
      'Content-Disposition': `${options.telecharger ? 'attachment' : 'inline'}; filename="${nom}"`,
      // Un fichier de santé n'a rien à faire dans le cache d'un proxy
      // partagé : `private` limite au navigateur de celui qui l'a demandé.
      'Cache-Control': 'private, max-age=300',
    },
  });
}
