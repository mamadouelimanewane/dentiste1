import { Client } from 'pg';
import bcrypt from 'bcryptjs';

const client = new Client({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL });
await client.connect();
const hash = await bcrypt.hash('TestPrac2026!', 10);
const roleRows = await client.query(`select id from roles where slug = 'praticien' limit 1`);
const roleId = roleRows.rows[0]?.id;
if (!roleId) {
  throw new Error("Rôle 'praticien' introuvable — les migrations (db/migrations) ont-elles été appliquées ?");
}
const rows = await client.query(
  `insert into users (full_name, email, password_hash, role_id) values ($1,$2,$3,$4)
   on conflict (email) do update set password_hash = excluded.password_hash returning id, full_name`,
  ['Dr. Test Praticien', 'praticien.test@capvert.com', hash, roleId]
);
console.log(JSON.stringify(rows.rows[0]));
await client.end();
