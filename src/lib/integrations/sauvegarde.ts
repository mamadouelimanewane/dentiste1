import 'server-only';
import { put, list, del } from '@vercel/blob';
import { sql } from '@/lib/db';

// Sauvegarde automatique de la base.
//
// Il n'y en avait aucune. Un script existait (scripts/sauvegarde-donnees.mjs)
// mais il fallait le lancer à la main, depuis un poste ayant l'URL de la base
// — autant dire jamais, une fois le cabinet en service. Pour une base qui va
// contenir des dossiers médicaux, c'était le trou le plus sérieux qui restait.
//
// Ce que ceci protège : la suppression ou l'écrasement accidentel de données
// (une purge lancée par erreur, un enregistrement qui remplace ce qu'il ne
// devait pas), et la perte de la base elle-même — le fichier part chez un
// autre hébergeur que la base.
//
// Ce que ceci ne protège pas : la restauration n'est pas automatique. Le
// fichier est un JSON complet, table par table ; le remonter demande une
// intervention. C'est une sauvegarde, pas une haute disponibilité.
//
// Le fichier est déposé en accès **privé** : il n'est lisible qu'avec le jeton
// du magasin, jamais par son URL. C'est la moindre des choses pour un dossier
// qui contient l'intégralité des patients du cabinet.

const PREFIXE = 'sauvegardes/';

// Un mois de sauvegardes quotidiennes. Au-delà, une erreur ancienne aurait de
// toute façon déjà été recopiée dans toutes les copies conservées.
export const RETENTION_JOURS = 30;

export interface Sauvegarde {
  chemin: string;
  taille: number;
  creele: string;
}

export interface ResultatSauvegarde {
  chemin: string;
  taille: number;
  tables: number;
  lignes: number;
  supprimees: string[];
}

function estConfiguree() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// Le nom porte la date en tête pour que le tri alphabétique soit le tri
// chronologique — la liste du magasin ne garantit pas d'autre ordre.
function nomFichier(date: Date) {
  return `${PREFIXE}${date.toISOString().replace(/[:.]/g, '-')}.json`;
}

export async function executerSauvegarde(): Promise<ResultatSauvegarde> {
  if (!estConfiguree()) {
    throw new Error("Le magasin de fichiers n'est pas configuré (BLOB_READ_WRITE_TOKEN).");
  }

  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `;

  const contenu: Record<string, unknown[]> = {};
  let lignes = 0;

  for (const { table_name } of tables as { table_name: string }[]) {
    // Les noms de tables viennent d'information_schema, pas d'une saisie :
    // aucune valeur externe n'entre dans cette requête.
    const rows = await sql.query(`select * from "${table_name}"`);
    contenu[table_name] = rows;
    lignes += rows.length;
  }

  const maintenant = new Date();
  const dump = {
    genere_le: maintenant.toISOString(),
    // Ce que contient la sauvegarde doit se lire sans avoir à ouvrir le
    // fichier : une sauvegarde dont on ignore la portée ne rassure personne.
    portee: 'Toutes les tables du schéma public.',
    tables: contenu,
  };

  const corps = JSON.stringify(dump);
  const chemin = nomFichier(maintenant);

  const blob = await put(chemin, corps, {
    access: 'private',
    addRandomSuffix: false,
    contentType: 'application/json',
  });

  const supprimees = await purgerAnciennes(maintenant);

  return {
    chemin: blob.pathname,
    taille: corps.length,
    tables: Object.keys(contenu).length,
    lignes,
    supprimees,
  };
}

export async function listerSauvegardes(): Promise<Sauvegarde[]> {
  if (!estConfiguree()) return [];

  const { blobs } = await list({ prefix: PREFIXE, limit: 200 });
  return blobs
    .map((b) => ({
      chemin: b.pathname,
      taille: b.size,
      creele: typeof b.uploadedAt === 'string' ? b.uploadedAt : b.uploadedAt.toISOString(),
    }))
    .sort((a, b) => b.creele.localeCompare(a.creele));
}

async function purgerAnciennes(maintenant: Date): Promise<string[]> {
  const limite = new Date(maintenant.getTime() - RETENTION_JOURS * 24 * 3600 * 1000);
  const anciennes = (await listerSauvegardes()).filter((s) => new Date(s.creele) < limite);

  if (anciennes.length === 0) return [];

  // Une suppression qui échoue ne doit pas faire échouer la sauvegarde : le
  // fichier du jour est déjà déposé, c'est lui qui compte.
  try {
    await del(anciennes.map((s) => s.chemin));
  } catch {
    return [];
  }

  return anciennes.map((s) => s.chemin);
}
