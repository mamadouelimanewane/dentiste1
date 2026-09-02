#!/usr/bin/env node
/**
 * Attribue un mot de passe fort et unique à chaque compte du cabinet.
 *
 * Le jeu de comptes partageait `membre1234` (5 comptes sur 8 avec la même
 * empreinte, dont plusieurs administrateurs). Acceptable pour une
 * démonstration, mais pas dans un cabinet manipulant de vraies données de
 * santé : un seul mot de passe connu de tous ouvre l'intégralité des dossiers.
 *
 * Les identifiants générés sont écrits dans un fichier local — jamais affichés
 * en clair dans un terminal partagé, jamais versionnés (voir .gitignore).
 *
 * Usage :
 *   node scripts/rotation-mots-de-passe.mjs             → simulation
 *   node scripts/rotation-mots-de-passe.mjs --confirmer → application
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const CONFIRME = process.argv.includes('--confirmer');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = readFileSync('.env.local', 'utf8');
  const m = env.match(/^DATABASE_URL=(.*)$/m);
  if (!m) throw new Error('DATABASE_URL introuvable (ni en variable, ni dans .env.local).');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const sql = neon(getDatabaseUrl());

// Alphabet sans caractères ambigus (0/O, 1/l/I) : ces mots de passe sont
// recopiés à la main par le personnel du cabinet.
const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function motDePasse(longueur = 16) {
  let out = '';
  for (let i = 0; i < longueur; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

async function main() {
  const users = await sql`
    select u.id, u.email, r.label as role
    from users u left join roles r on r.id = u.role_id
    order by u.created_at
  `;

  console.log(CONFIRME ? '=== APPLICATION ===' : '=== SIMULATION (aucune écriture) ===');
  console.log('');

  const lignes = [];
  for (const u of users) {
    const mdp = motDePasse();
    lignes.push({ email: u.email, role: u.role || '?', mdp });
    if (CONFIRME) {
      const hash = await bcrypt.hash(mdp, 10);
      await sql`update users set password_hash = ${hash} where id = ${u.id}`;
    }
    console.log(`  ${u.email.padEnd(32)} ${(u.role || '?').padEnd(16)} ${CONFIRME ? 'mis à jour' : 'serait mis à jour'}`);
  }

  if (!CONFIRME) {
    console.log('');
    console.log("Rien n'a été modifié. Relancez avec --confirmer pour appliquer.");
    return;
  }

  const nom = `identifiants-${new Date().toISOString().slice(0, 10)}.txt`;
  const contenu = [
    'IDENTIFIANTS DU CABINET — DOCUMENT CONFIDENTIEL',
    `Généré le ${new Date().toLocaleString('fr-FR')}`,
    '',
    'À remettre en main propre à chaque utilisateur, puis à détruire.',
    'Chaque personne doit disposer de son propre compte : ne pas partager.',
    '',
    ...lignes.map((l) => `${l.email.padEnd(32)} ${l.role.padEnd(16)} ${l.mdp}`),
    '',
  ].join('\n');
  writeFileSync(nom, contenu, 'utf8');

  console.log('');
  console.log(`Identifiants écrits dans ${nom} (non versionné).`);
}

main().catch((e) => {
  console.error('Échec :', e.message);
  process.exit(1);
});
