import { Client } from 'pg';
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const expected = [
  'patients','appointments','invoices','executed_acts','insurance_claims','audit_logs',
  'patient_messages','patient_portal_tokens','patient_documents','scheduled_messages',
  'roles','users','login_attempts','clinic_settings','prescriptions','quotes',
  'inventory_items','lab_orders','document_templates','clinical_notes',
  'patient_images','staff_messages','public_booking_attempts','neural_logs'
];

const res = await client.query(
  `select table_name from information_schema.tables where table_schema='public'`
);
const present = res.rows.map(r => r.table_name);
const missing = expected.filter(t => !present.includes(t));

console.log('TABLES MANQUANTES:', missing.length ? missing : 'aucune');

// Colonnes ajoutees par 0018
const cols = await client.query(
  `select column_name from information_schema.columns where table_name='patients'`
);
const pcols = cols.rows.map(r => r.column_name);
console.log("patients.allergies present ?", pcols.includes('allergies'));
console.log("patients.mutuelle present ?", pcols.includes('mutuelle'));

await client.end();
