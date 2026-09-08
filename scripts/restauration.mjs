#!/usr/bin/env node
/**
 * Restauration d'une sauvegarde dans une base de données.
 *
 * Les sauvegardes se créaient, se téléchargeaient et se déchiffraient — c'était
 * vérifié. Mais rien ne savait les remonter. Une sauvegarde qu'on n'a jamais
 * restaurée est une sauvegarde dont on suppose qu'elle marche, et on l'apprend
 * le jour où l'on est le plus pressé.
 *
 * Ce script remonte un fichier de sauvegarde dans une base VIDE dont le schéma
 * a déjà été créé par les migrations.
 *
 * PROCÉDURE COMPLÈTE, dans l'ordre :
 *
 *   1. Créer la base cible (ou vider celle qui doit être écrasée).
 *   2. Y appliquer les migrations :
 *        DATABASE_URL="<url cible>" node scripts/migrate.mjs
 *   3. Simuler la restauration — n'écrit rien, montre ce qui serait fait :
 *        node scripts/restauration.mjs <fichier> --cible "<url cible>"
 *   4. Restaurer pour de bon. --vider est nécessaire : les migrations sèment
 *      déjà les rôles et les paramètres du cabinet, une base fraîchement
 *      migrée n'est donc jamais vide.
 *        node scripts/restauration.mjs <fichier> --cible "<url cible>" --confirmer --vider
 *
 * Le fichier accepté est soit le JSON téléchargé depuis l'écran
 * Administration → Sauvegardes, soit le fichier chiffré tel qu'il est stocké
 * (extension .sauvegarde) — dans ce cas SAUVEGARDE_SECRET, ou à défaut
 * SESSION_SECRET, doit être présent dans l'environnement.
 *
 * Options :
 *   --cible <url>   base de destination (sinon RESTORE_DATABASE_URL)
 *   --confirmer     écrit réellement (sans cette option, rien n'est modifié)
 *   --vider         vide les tables de la cible avant d'insérer
 */

import { readFileSync } from 'node:fs';
import { createDecipheriv, createHash } from 'node:crypto';
import pg from 'pg';

const { Client } = pg;

const args = process.argv.slice(2);
const CONFIRME = args.includes('--confirmer');
const VIDER = args.includes('--vider');
const fichier = args.find((a) => !a.startsWith('--'));
const cible =
  (args.includes('--cible') ? args[args.indexOf('--cible') + 1] : null) ||
  process.env.RESTORE_DATABASE_URL;

if (!fichier || !cible) {
  console.error(
    'Usage : node scripts/restauration.mjs <fichier> --cible "<url>" [--confirmer] [--vider]'
  );
  process.exit(1);
}

// ---------------------------------------------------------------- lecture

const MAGIE = Buffer.from('CVS1', 'latin1');

function dechiffrer(fichierBrut) {
  const secret = process.env.SAUVEGARDE_SECRET || process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'Fichier chiffré : SAUVEGARDE_SECRET (ou SESSION_SECRET) est requis pour le lire.'
    );
  }
  const cle = createHash('sha256').update(`sauvegarde-v1|${secret}`).digest();
  const dechiffreur = createDecipheriv('aes-256-gcm', cle, fichierBrut.subarray(4, 16));
  dechiffreur.setAuthTag(fichierBrut.subarray(16, 32));
  return Buffer.concat([
    dechiffreur.update(fichierBrut.subarray(32)),
    dechiffreur.final(),
  ]).toString('utf8');
}

function lireSauvegarde(chemin) {
  const brut = readFileSync(chemin);
  const texte = brut.subarray(0, 4).equals(MAGIE) ? dechiffrer(brut) : brut.toString('utf8');
  const dump = JSON.parse(texte);
  if (!dump.tables) throw new Error("Ce fichier ne contient pas de section « tables ».");
  return dump;
}

// ------------------------------------------------------- ordre d'insertion

// Une table qui référence une autre doit être insérée après elle, sinon la
// clé étrangère rejette la ligne. L'ordre est déduit du schéma réel de la
// cible, pas d'une liste écrite à la main qui vieillirait mal.
async function ordreDInsertion(client, tables) {
  const { rows: liens } = await client.query(`
    select
      src.relname as enfant,
      tgt.relname as parent
    from pg_constraint c
    join pg_class src on src.oid = c.conrelid
    join pg_class tgt on tgt.oid = c.confrelid
    join pg_namespace n on n.oid = src.relnamespace
    where c.contype = 'f' and n.nspname = 'public'
  `);

  const restant = new Set(tables);
  const parents = new Map(tables.map((t) => [t, new Set()]));
  for (const { enfant, parent } of liens) {
    // Une table qui se référence elle-même ne crée pas de dépendance entre
    // tables : elle est traitée à part, ligne par ligne (voir
    // colonnesAutoReferentes).
    if (enfant !== parent && parents.has(enfant) && restant.has(parent)) {
      parents.get(enfant).add(parent);
    }
  }

  const ordre = [];
  while (restant.size > 0) {
    const prets = [...restant].filter((t) =>
      [...parents.get(t)].every((p) => !restant.has(p))
    );
    if (prets.length === 0) {
      // Cycle de clés étrangères : on prend le reste tel quel et on laisse
      // Postgres trancher, plutôt que de boucler en silence.
      ordre.push(...restant);
      break;
    }
    prets.sort();
    for (const t of prets) {
      ordre.push(t);
      restant.delete(t);
    }
  }
  return ordre;
}

// Une colonne qui pointe vers la même table — « ce message est le repli de
// celui-là » — ne se laisse pas ordonner au niveau des tables : dans un même
// lot, une ligne peut désigner une ligne insérée plus loin.
//
// C'est ce qui a fait échouer la première répétition de restauration
// (patient_messages.fallback_of). Ces colonnes sont donc posées à NULL à
// l'insertion, puis renseignées une fois toutes les lignes présentes, dans la
// même transaction : à la fin, l'état est exactement celui de la sauvegarde.
async function colonnesAutoReferentes(client) {
  const { rows } = await client.query(`
    select c.relname as table_name, a.attname as column_name, a.attnotnull as obligatoire
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join unnest(k.conkey) as col(num) on true
    join pg_attribute a on a.attrelid = k.conrelid and a.attnum = col.num
    where k.contype = 'f' and k.conrelid = k.confrelid and n.nspname = 'public'
  `);

  const parTable = new Map();
  for (const r of rows) {
    if (r.obligatoire) {
      throw new Error(
        `La colonne ${r.table_name}.${r.column_name} pointe vers sa propre table et n'accepte pas NULL : ` +
          'la restauration ne sait pas ordonner ces lignes.'
      );
    }
    if (!parTable.has(r.table_name)) parTable.set(r.table_name, new Set());
    parTable.get(r.table_name).add(r.column_name);
  }
  return parTable;
}

async function clesPrimaires(client) {
  const { rows } = await client.query(`
    select c.relname as table_name, a.attname as column_name
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    join unnest(k.conkey) as col(num) on true
    join pg_attribute a on a.attrelid = k.conrelid and a.attnum = col.num
    where k.contype = 'p' and n.nspname = 'public'
  `);
  const parTable = new Map();
  for (const r of rows) {
    if (!parTable.has(r.table_name)) parTable.set(r.table_name, []);
    parTable.get(r.table_name).push(r.column_name);
  }
  return parTable;
}

// ---------------------------------------------------------------- exécution

async function main() {
  const dump = lireSauvegarde(fichier);
  const client = new Client({ connectionString: cible });
  await client.connect();

  const { rows: infoBase } = await client.query('select current_database() as base');
  const { rows: tablesCible } = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);
  const nomsCible = tablesCible.map((r) => r.table_name);

  console.log(`Sauvegarde : ${fichier}`);
  console.log(`  générée le ${dump.genere_le}`);
  console.log(`Cible      : base « ${infoBase[0].base} », ${nomsCible.length} table(s)`);
  console.log(CONFIRME ? 'Mode       : ÉCRITURE' : 'Mode       : simulation (rien ne sera écrit)');
  console.log('');

  // Une table présente dans la sauvegarde mais absente de la cible signale un
  // schéma plus ancien ou plus récent : on le dit, on ne l'invente pas.
  const absentes = Object.keys(dump.tables).filter((t) => !nomsCible.includes(t));
  if (absentes.length > 0) {
    console.log(`⚠ Tables du fichier absentes de la cible (ignorées) : ${absentes.join(', ')}`);
    console.log('');
  }

  const aTraiter = nomsCible.filter((t) => Array.isArray(dump.tables[t]));
  const ordre = await ordreDInsertion(client, aTraiter);

  // Refus d'écrire par-dessus des données : une restauration se fait dans une
  // base vide. Le contraire — mélanger une sauvegarde à des données vivantes —
  // produirait un état que personne ne saurait décrire.
  if (CONFIRME && !VIDER) {
    for (const table of ordre) {
      const { rows } = await client.query(`select count(*)::int as n from "${table}"`);
      if (rows[0].n > 0) {
        console.error(
          `La table « ${table} » de la cible contient déjà ${rows[0].n} ligne(s).\n` +
            'Restaurez dans une base vide, ou relancez avec --vider pour écraser.'
        );
        await client.end();
        process.exit(1);
      }
    }
  }

  const colonnes = new Map();
  for (const table of ordre) {
    const { rows } = await client.query(
      `select column_name, data_type from information_schema.columns
       where table_schema = 'public' and table_name = $1`,
      [table]
    );
    colonnes.set(table, new Map(rows.map((r) => [r.column_name, r.data_type])));
  }

  const autoRef = await colonnesAutoReferentes(client);
  const pks = await clesPrimaires(client);

  let total = 0;
  const rapport = [];
  // Renvois à la même table, à reposer une fois toutes les lignes présentes.
  const reprises = [];

  if (CONFIRME) await client.query('begin');

  try {
    if (CONFIRME && VIDER) {
      // Un seul TRUNCATE pour toutes les tables : CASCADE et ordre des clés
      // étrangères sont alors gérés par Postgres.
      await client.query(
        `truncate ${ordre.map((t) => `"${t}"`).join(', ')} restart identity cascade`
      );
    }

    for (const table of ordre) {
      const lignes = dump.tables[table];
      const cols = colonnes.get(table);
      const retenues = Object.keys(lignes[0] || {}).filter((c) => cols.has(c));

      if (lignes.length > 0 && CONFIRME) {
        const listeCols = retenues.map((c) => `"${c}"`).join(', ');
        const auto = autoRef.get(table) || new Set();
        const pk = pks.get(table) || [];

        for (const ligne of lignes) {
          const valeurs = retenues.map((c) => {
            // Colonne pointant vers la même table : posée à NULL ici, reprise
            // dans la seconde passe.
            if (auto.has(c) && ligne[c] !== null && ligne[c] !== undefined) return null;
            const v = ligne[c];
            const type = cols.get(c);
            // Le pilote envoie un objet JavaScript tel quel : pour une colonne
            // json/jsonb, il faut lui repasser du texte.
            if ((type === 'json' || type === 'jsonb') && v !== null && typeof v === 'object') {
              return JSON.stringify(v);
            }
            return v === undefined ? null : v;
          });
          const params = retenues.map((_, i) => `$${i + 1}`).join(', ');
          await client.query(
            `insert into "${table}" (${listeCols}) values (${params})`,
            valeurs
          );

          for (const c of auto) {
            if (ligne[c] !== null && ligne[c] !== undefined && pk.length > 0) {
              reprises.push({ table, colonne: c, valeur: ligne[c], pk, ligne });
            }
          }
        }
      }

      total += lignes.length;
      rapport.push({ table, lignes: lignes.length, colonnes: retenues.length });
    }

    // Seconde passe : les renvois internes, maintenant que toutes les lignes
    // de leur table existent.
    if (CONFIRME) {
      for (const r of reprises) {
        const cible = r.pk.map((c, i) => `"${c}" = $${i + 2}`).join(' and ');
        await client.query(
          `update "${r.table}" set "${r.colonne}" = $1 where ${cible}`,
          [r.valeur, ...r.pk.map((c) => r.ligne[c])]
        );
      }
    }

    // Les compteurs des colonnes séquentielles restent à zéro après une
    // insertion d'identifiants explicites : la première écriture suivante
    // entrerait alors en collision.
    if (CONFIRME) {
      const { rows: sequences } = await client.query(`
        select table_name, column_name
        from information_schema.columns
        where table_schema = 'public' and column_default like 'nextval%'
      `);
      for (const { table_name, column_name } of sequences) {
        await client.query(
          `select setval(pg_get_serial_sequence($1, $2),
                         coalesce((select max("${column_name}") from "${table_name}"), 1))`,
          [table_name, column_name]
        );
      }
    }

    if (CONFIRME) await client.query('commit');
  } catch (e) {
    if (CONFIRME) await client.query('rollback');
    console.error('\nÉchec : rien n’a été écrit.');
    console.error(e.message);
    await client.end();
    process.exit(1);
  }

  for (const r of rapport) {
    if (r.lignes > 0) {
      console.log(`  ${r.table.padEnd(26)} ${String(r.lignes).padStart(5)} ligne(s)`);
    }
  }

  console.log('');
  console.log(`${total} ligne(s) ${CONFIRME ? 'restaurées' : 'à restaurer'} dans ${ordre.length} table(s).`);
  if (CONFIRME && reprises.length > 0) {
    console.log(`${reprises.length} renvoi(s) interne(s) rétabli(s) en seconde passe.`);
  }

  // Vérification finale : on recompte dans la base, on ne se fie pas au
  // nombre de lignes qu'on croit avoir envoyées.
  if (CONFIRME) {
    let ecarts = 0;
    for (const r of rapport) {
      const { rows } = await client.query(`select count(*)::int as n from "${r.table}"`);
      if (rows[0].n !== r.lignes) {
        console.error(`  ÉCART ${r.table} : ${rows[0].n} en base, ${r.lignes} attendues`);
        ecarts++;
      }
    }
    console.log(
      ecarts === 0
        ? 'Vérification : chaque table contient exactement le nombre de lignes attendu.'
        : `Vérification : ${ecarts} écart(s) — la restauration est incomplète.`
    );
    if (ecarts > 0) {
      await client.end();
      process.exit(1);
    }
  } else {
    console.log('Aucune écriture. Relancez avec --confirmer pour restaurer.');
  }

  await client.end();
}

main().catch((e) => {
  console.error('Échec :', e.message);
  process.exit(1);
});
