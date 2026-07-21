import { Client } from 'pg';
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const res = await client.query(`
  select a.id, a.scheduled_at, a.type, a.status, p.full_name
  from appointments a join patients p on p.id = a.patient_id
  where p.full_name = 'Moussa Diop'
  order by a.created_at desc limit 3
`);
console.log(JSON.stringify(res.rows, null, 2));
await client.end();
