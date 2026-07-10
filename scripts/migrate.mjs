import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL_UNPOOLED (ou DATABASE_URL) est requis dans .env.local');
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), 'db', 'migrations');

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), 'utf-8');
    console.log(`-> ${file}`);
    try {
      await client.query(sql);
      console.log(`   ok`);
    } catch (err) {
      console.error(`   ERREUR: ${err.message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log('Toutes les migrations ont été appliquées.');
  await client.end();
}

main();
