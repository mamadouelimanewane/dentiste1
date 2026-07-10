import 'server-only';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('DATABASE_URL est manquant. Ajoutez-le à .env.local pour activer la base Neon.');
}

// Client SQL serveur uniquement (tagged template). Ex: sql`select * from users where id = ${id}`.
// Jamais importé depuis un composant "use client".
export const sql = neon(databaseUrl || 'postgresql://user:password@placeholder.invalid/db');

export function isDatabaseConfigured() {
  return !!databaseUrl;
}
