import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { patientName, phone, reason, scheduledAt } = data;

    if (!patientName || !phone || !scheduledAt) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    }

    // 1. Chercher si le patient existe via son téléphone, sinon le créer avec un statut "web"
    let patientId = null;
    const existingPatient = await sql`SELECT id FROM patients WHERE phone = ${phone} LIMIT 1`;
    
    if (existingPatient.length > 0) {
      patientId = existingPatient[0].id;
    } else {
      const newPatient = await sql`
        INSERT INTO patients (full_name, phone, status, last_visit)
        VALUES (${patientName}, ${phone}, 'new', NOW())
        RETURNING id
      `;
      patientId = newPatient[0].id;
    }

    // 2. Créer le RDV
    // On l'affecte au premier praticien dispo ou sans praticien (practitioner_id = null)
    await sql`
      INSERT INTO appointments (patient_id, scheduled_at, duration_minutes, reason, status, type)
      VALUES (${patientId}, ${scheduledAt}, 30, ${reason}, 'scheduled', 'web')
    `;

    return NextResponse.json({ success: true, message: 'Rendez-vous confirmé' });
  } catch (error: any) {
    console.error('Erreur API public appointment:', error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
