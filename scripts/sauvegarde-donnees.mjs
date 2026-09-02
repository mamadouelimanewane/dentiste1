#!/usr/bin/env node
/**
 * Sauvegarde complète du contenu de la base dans un fichier JSON horodaté.
 *
 * Écrit systématiquement avant toute purge : une suppression de données de
 * production doit rester réversible, et le jeu de démonstration garde une
 * valeur pour les présentations commerciales.
 *
 * Usage : node scripts/sauvegarde-donnees.mjs [dossier]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync('.env.local', 'utf8');
  const m = env.match(/^DATABASE_URL=(.*)$/m);
  if (!m) throw new Error('DATABASE_URL introuvable (ni en variable, ni dans .env.local).');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const sql = neon(getDatabaseUrl());
const dossier = process.argv[2] || 'sauvegardes';

async function main() {
  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name
  `;

  const dump = { genere_le: new Date().toISOString(), tables: {} };
  let total = 0;

  for (const { table_name } of tables) {
    const rows = await sql.query(`select * from ${table_name}`);
    dump.tables[table_name] = rows;
    total += rows.length;
    console.log(`  ${table_name.padEnd(26)} ${String(rows.length).padStart(5)} ligne(s)`);
  }

  mkdirSync(dossier, { recursive: true });
  const nom = `sauvegarde-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const chemin = join(dossier, nom);
  writeFileSync(chemin, JSON.stringify(dump, null, 2), 'utf8');

  console.log('');
  console.log(`${total} ligne(s) sauvegardées dans ${chemin}`);
}

main().catch((e) => {
  console.error('Échec :', e.message);
  process.exit(1);
});
