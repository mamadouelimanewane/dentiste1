import { readFile } from 'node:fs/promises';
import { Client } from 'pg';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/apply-one.mjs <chemin-vers-migration.sql>');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const client = new Client({ connectionString });
await client.connect();
const sql = await readFile(file, 'utf-8');
await client.query(sql);
console.log(`${file} appliquée avec succès.`);
await client.end();
