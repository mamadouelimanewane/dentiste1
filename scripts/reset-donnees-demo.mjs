#!/usr/bin/env node
/**
 * Remise à zéro des données de démonstration avant mise en service réelle.
 *
 * La base de production contient les patients, rendez-vous, factures et actes
 * créés pendant le développement. Laissés en place dans un vrai cabinet, ils
 * mélangent des dossiers fictifs aux dossiers réels et — plus grave — font
 * apparaître un chiffre d'affaires inventé dans la Comptabilité et les
 * Statistiques.
 *
 * CE QUI EST SUPPRIMÉ : tout ce qui concerne les patients (dossiers,
 * rendez-vous, actes, factures, devis, ordonnances, images, documents, notes
 * cliniques, messages, jetons de portail, demandes de RDV en ligne).
 *
 * CE QUI EST CONSERVÉ : les comptes utilisateurs et les rôles, les paramètres
 * du cabinet, le catalogue d'actes, les modèles de documents et le stock
 * (inventory_items) — ce sont des données de paramétrage, pas de démonstration.
 *
 * Usage :
 *   node scripts/reset-donnees-demo.mjs            → simulation (n'écrit rien)
 *   node scripts/reset-donnees-demo.mjs --confirmer → suppression effective
 */

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const CONFIRME = process.argv.includes('--confirmer');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync('.env.local', 'utf8');
  const m = env.match(/^DATABASE_URL=(.*)$/m);
  if (!m) throw new Error('DATABASE_URL introuvable (ni en variable, ni dans .env.local).');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const sql = neon(getDatabaseUrl());

// Ordre imposé par les clés étrangères : les tables qui référencent un patient
// sont vidées avant la table patients elle-même.
const TABLES = [
  'patient_messages',
  'scheduled_messages',
  'patient_portal_tokens',
  'patient_images',
  'patient_documents',
  'clinical_notes',
  'insurance_claims',
  'executed_acts',
  'invoices',
  'quotes',
  'prescriptions',
  'lab_orders',
  'appointments',
  'patients',
  // Traces techniques sans valeur pour un nouveau cabinet
  'public_booking_attempts',
  'login_attempts',
  'neural_logs',
  'staff_messages',
  'audit_logs',
];

const CONSERVEES = ['users', 'roles', 'clinic_settings', 'inventory_items', 'document_templates'];

async function main() {
  console.log(CONFIRME ? '=== SUPPRESSION EFFECTIVE ===' : '=== SIMULATION (aucune écriture) ===');
  console.log('');

  let total = 0;
  for (const table of TABLES) {
    let n = 0;
    try {
      const rows = await sql.query(`select count(*)::int as n from ${table}`);
      n = rows[0].n;
    } catch {
      console.log(`  ${table.padEnd(26)} (table absente, ignorée)`);
      continue;
    }
    total += n;
    if (n === 0) {
      console.log(`  ${table.padEnd(26)} déjà vide`);
      continue;
    }
    if (CONFIRME) {
      await sql.query(`delete from ${table}`);
      console.log(`  ${table.padEnd(26)} ${String(n).padStart(5)} ligne(s) supprimée(s)`);
    } else {
      console.log(`  ${table.padEnd(26)} ${String(n).padStart(5)} ligne(s) seraient supprimées`);
    }
  }

  console.log('');
  console.log(`Total : ${total} ligne(s).`);
  console.log(`Conservé : ${CONSERVEES.join(', ')}.`);

  if (!CONFIRME) {
    console.log('');
    console.log('Rien n\'a été modifié. Relancez avec --confirmer pour appliquer.');
  } else {
    const p = await sql`select count(*)::int as n from patients`;
    const u = await sql`select count(*)::int as n from users`;
    const s = await sql`select count(*)::int as n from inventory_items`;
    console.log('');
    console.log(`Vérification — patients : ${p[0].n}, comptes : ${u[0].n}, articles en stock : ${s[0].n}.`);
  }
}

main().catch((e) => {
  console.error('Échec :', e.message);
  process.exit(1);
});
