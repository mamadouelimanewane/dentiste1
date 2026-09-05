'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { verifyPassword, createStaffSessionToken, STAFF_COOKIE_NAME, STAFF_COOKIE_OPTIONS } from '@/lib/auth';

// Hash bcrypt d'une valeur fixe non utilisée ailleurs — sert uniquement à
// exécuter un bcrypt.compare de durée comparable quand le compte n'existe
// pas, pour ne pas révéler par le timing de réponse qu'un email est inconnu.
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8kn3.SIiF3rBpN9zfp1z/Ehk4xUuMS';

// Limitation des tentatives de connexion.
//
// Le réglage précédent — 5 échecs par compte sur 15 minutes — réunissait les
// deux inconvénients. Trop strict d'abord : au fauteuil, la tablette est
// partagée et une assistante qui se trompe cinq fois se retrouve bloquée un
// quart d'heure en pleine consultation, sans aucun moyen de se débloquer. Et
// inefficace ensuite, car le compteur ne portait que sur l'adresse saisie :
// un balayage de mots de passe sur plusieurs comptes n'était jamais freiné,
// il suffisait de changer d'email tous les quatre essais.
//
// On desserre donc la contrainte sur le compte légitime et on ajoute un
// plafond par poste, qui est ce qui arrête réellement un balayage.
const MAX_ATTEMPTS = 10;
const MAX_ATTEMPTS_IP = 30;
const WINDOW_MINUTES = 15;

async function getClientIp() {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

async function getUserAgent() {
  const h = await headers();
  return h.get('user-agent')?.slice(0, 300) || null;
}

// L'historique ne retenait que l'email saisi : impossible de savoir depuis
// quel poste un compte s'était connecté, ni de rattacher une tentative à un
// utilisateur si son adresse changeait.
async function recordAttempt(
  email: string,
  ip: string,
  success: boolean,
  userId: string | null
) {
  const userAgent = await getUserAgent();
  await sql`
    insert into login_attempts (email, ip, success, user_id, user_agent)
    values (${email}, ${ip}, ${success}, ${userId}, ${userAgent})
  `;
}

export async function signIn(_prevState: { error: string | null }, formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' };
  }

  const ip = await getClientIp();

  // Seuls les échecs POSTÉRIEURS à la dernière connexion réussie comptent.
  // Sans cela, quatre erreurs de frappe suivies d'une connexion réussie
  // laissaient le compteur chargé un quart d'heure : la connexion suivante
  // pouvait être refusée alors qu'on venait de prouver qu'on avait le bon
  // mot de passe.
  const echecsCompte = await sql`
    select count(*) as count,
           max(created_at) as dernier
    from login_attempts
    where email = ${email} and success = false
      and created_at > now() - make_interval(mins => ${WINDOW_MINUTES})
      and created_at > coalesce(
        (select max(created_at) from login_attempts
          where email = ${email} and success = true),
        'epoch'::timestamptz
      )
  `;

  const echecsPoste = await sql`
    select count(*) as count, max(created_at) as dernier
    from login_attempts
    where ip = ${ip} and success = false
      and created_at > now() - make_interval(mins => ${WINDOW_MINUTES})
  `;

  const bloque =
    Number(echecsCompte[0]?.count || 0) >= MAX_ATTEMPTS
      ? echecsCompte[0]?.dernier
      : Number(echecsPoste[0]?.count || 0) >= MAX_ATTEMPTS_IP && ip !== 'unknown'
        ? echecsPoste[0]?.dernier
        : null;

  if (bloque) {
    // Dire l'attente restante : « réessayez dans quelques minutes » laissait
    // le comptoir recliquer en boucle sans savoir quand cela rouvrirait.
    const finBlocage = new Date(new Date(bloque as string).getTime() + WINDOW_MINUTES * 60_000);
    const minutes = Math.max(1, Math.ceil((finBlocage.getTime() - Date.now()) / 60_000));
    return {
      error: `Trop de tentatives infructueuses. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}, ou demandez à un administrateur de réinitialiser ce mot de passe.`,
    };
  }

  const rows = await sql`
    select u.id, u.full_name, u.password_hash, u.is_active, r.id as role_id, r.slug as role_slug, r.label as role_label
    from users u
    join roles r on r.id = u.role_id
    where u.email = ${email}
    limit 1
  `;
  const user = rows[0] as
    | { id: string; full_name: string; password_hash: string; is_active: boolean; role_id: string; role_slug: string; role_label: string }
    | undefined;

  if (!user || !user.is_active) {
    await verifyPassword(password, DUMMY_HASH);
    await recordAttempt(email, ip, false, null);
    return { error: 'Identifiants incorrects.' };
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    await recordAttempt(email, ip, false, user.id);
    return { error: 'Identifiants incorrects.' };
  }

  await recordAttempt(email, ip, true, user.id);

  const token = await createStaffSessionToken({
    userId: user.id,
    roleId: user.role_id,
    role: user.role_slug,
    roleLabel: user.role_label,
    fullName: user.full_name,
  });

  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE_NAME, token, STAFF_COOKIE_OPTIONS);

  redirect('/dashboard/apps');
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE_NAME);
  redirect('/login');
}
