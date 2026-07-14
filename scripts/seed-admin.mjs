import crypto from 'node:crypto';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const email = process.argv[2];
const fullName = process.argv[3] || 'Admin';
// Génère un mot de passe aléatoire si aucun n'est fourni en 4e argument —
// jamais de valeur par défaut fixe pour un compte admin.
const password = process.argv[4] || crypto.randomBytes(9).toString('base64url');

if (!email) {
  console.error('Usage: npm run db:seed-admin -- <email> [fullName] [password]');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  const hash = await bcrypt.hash(password, 10);

  await client.query(
    `insert into users (full_name, email, password_hash, role)
     values ($1, $2, $3, 'admin')
     on conflict (email) do update set password_hash = excluded.password_hash`,
    [fullName, email.toLowerCase(), hash]
  );

  console.log(`Admin créé/mis à jour : ${email} / ${password}`);
  await client.end();
}

main();
