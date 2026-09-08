import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
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
// LE FICHIER EST CHIFFRÉ. Le magasin de fichiers du cabinet est un magasin
// public : tout ce qui y est déposé est lisible par quiconque en connaît
// l'URL. Y déposer en clair l'intégralité des dossiers patients aurait été
// indéfendable. Le contenu est donc chiffré en AES-256-GCM avant l'envoi et
// déchiffré côté serveur, à la demande d'un administrateur authentifié. Sans
// la clé, le fichier n'est qu'un bloc d'octets.

const PREFIXE = 'sauvegardes/';

// Un mois de sauvegardes quotidiennes. Au-delà, une erreur ancienne aurait de
// toute façon déjà été recopiée dans toutes les copies conservées.
export const RETENTION_JOURS = 30;

// En-tête du fichier chiffré : quatre octets qui permettent de reconnaître le
// format sans se fier au nom, et de le faire évoluer sans casser l'ancien.
const MAGIE = Buffer.from('CVS1', 'latin1');

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

// La clé dédiée est préférable : elle se change sans toucher aux sessions.
// À défaut, on dérive du secret de session — mieux que rien, mais une rotation
// de ce secret rendrait les anciennes sauvegardes illisibles. C'est écrit ici
// pour que personne ne l'apprenne le jour où il en a besoin.
function cle(): Buffer {
  const secret = process.env.SAUVEGARDE_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Aucun secret de chiffrement (SAUVEGARDE_SECRET ou SESSION_SECRET) : sauvegarde refusée plutôt que déposée en clair."
    );
  }
  return createHash('sha256').update(`sauvegarde-v1|${secret}`).digest();
}

function chiffrer(clair: string): Buffer {
  const iv = randomBytes(12);
  const chiffreur = createCipheriv('aes-256-gcm', cle(), iv);
  const corps = Buffer.concat([chiffreur.update(clair, 'utf8'), chiffreur.final()]);
  return Buffer.concat([MAGIE, iv, chiffreur.getAuthTag(), corps]);
}

export function dechiffrer(fichier: Buffer): string {
  if (!fichier.subarray(0, 4).equals(MAGIE)) {
    throw new Error("Ce fichier n'est pas une sauvegarde chiffrée de ce cabinet.");
  }
  const iv = fichier.subarray(4, 16);
  const tag = fichier.subarray(16, 32);
  const dechiffreur = createDecipheriv('aes-256-gcm', cle(), iv);
  dechiffreur.setAuthTag(tag);
  return Buffer.concat([dechiffreur.update(fichier.subarray(32)), dechiffreur.final()]).toString('utf8');
}

function estConfiguree() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// Le nom porte la date en tête pour que le tri alphabétique soit le tri
// chronologique — la liste du magasin ne garantit pas d'autre ordre.
function nomFichier(date: Date) {
  return `${PREFIXE}${date.toISOString().replace(/[:.]/g, '-')}.sauvegarde`;
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

  const corps = chiffrer(JSON.stringify(dump));

  const blob = await put(nomFichier(maintenant), corps, {
    access: 'public',
    // Le magasin est public : un nom prévisible suffirait à retrouver le
    // fichier. Le suffixe aléatoire ajoute une barrière — la vraie protection
    // restant le chiffrement.
    addRandomSuffix: true,
    contentType: 'application/octet-stream',
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

// Rend le contenu déchiffré d'une sauvegarde. Le magasin étant public, l'URL
// n'est jamais rendue à l'appelant : elle ouvrirait le fichier chiffré sans
// contrôle, et laisserait fuiter un chemin permanent.
export async function lireSauvegarde(chemin: string): Promise<string | null> {
  const { blobs } = await list({ prefix: chemin, limit: 1 });
  const cible = blobs.find((b) => b.pathname === chemin);
  if (!cible) return null;

  const reponse = await fetch(cible.url, { cache: 'no-store' });
  if (!reponse.ok) throw new Error('Sauvegarde illisible dans le magasin.');

  return dechiffrer(Buffer.from(await reponse.arrayBuffer()));
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
