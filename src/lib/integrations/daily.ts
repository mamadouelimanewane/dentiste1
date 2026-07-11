import 'server-only';
import { sql } from '@/lib/db';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

export function isVideoConfigured() {
  return !!DAILY_API_KEY;
}

interface RoomResult {
  simulated: boolean;
  url?: string;
  error?: string;
}

// Crée (ou réutilise) une room Daily.co pour un rendez-vous. Sans clé
// configurée, retourne simulated:true sans appeler le réseau — l'UI garde
// alors l'affichage vidéo simulé déjà existant.
export async function createOrGetDailyRoom(appointmentId: string): Promise<RoomResult> {
  const existing = await sql`
    select daily_room_url from appointments where id = ${appointmentId} limit 1
  `;
  if (existing.length === 0) {
    return { simulated: false, error: 'Rendez-vous introuvable.' };
  }
  if (existing[0].daily_room_url) {
    return { simulated: false, url: existing[0].daily_room_url };
  }

  if (!isVideoConfigured()) {
    return { simulated: true };
  }

  try {
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 4; // room valide 4h
    const res = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          exp: expiresAt,
          enable_chat: true,
          enable_screenshare: true,
        },
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { simulated: false, error: data?.info || data?.error || 'Échec de création de la salle vidéo.' };
    }

    await sql`
      update appointments set daily_room_name = ${data.name}, daily_room_url = ${data.url}
      where id = ${appointmentId}
    `;

    return { simulated: false, url: data.url };
  } catch (e) {
    return { simulated: false, error: e instanceof Error ? e.message : 'Erreur réseau (Daily.co).' };
  }
}
