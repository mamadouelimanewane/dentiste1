import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions';
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
import { sendSms } from '@/lib/integrations/sms';

interface NotifyBody {
  patientId?: string;
  patientName?: string;
  phone?: string;
  appointmentDate?: string; // ISO string
  appointmentType?: string;
  channel?: 'whatsapp' | 'sms' | 'both';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Envoie une notification de confirmation de rendez-vous par WhatsApp et/ou SMS.
// En mode démo (clés non configurées), journalise en base avec statut "simulated"
// et retourne { simulated: true } pour affichage UI.
export async function POST(request: Request) {
  const { session, error, status } = await requirePermission(18, 'manage');
  if (error) return NextResponse.json({ error }, { status });

  const body = await request.json() as NotifyBody;
  const { patientId, patientName, phone, appointmentDate, appointmentType, channel = 'both' } = body;

  if (!phone || !appointmentDate) {
    return NextResponse.json(
      { error: 'phone et appointmentDate sont requis.' },
      { status: 400 }
    );
  }

  const dateLabel = formatDate(appointmentDate);
  const typeLabel = appointmentType || 'Consultation';
  const name = patientName || 'cher(e) patient(e)';

  const messageBody =
    `🦷 Bonjour ${name},\n\n` +
    `Votre rendez-vous au Cabinet Dentaire du Cap Vert est confirmé :\n\n` +
    `📅 ${dateLabel}\n` +
    `🔧 ${typeLabel}\n\n` +
    `Pour modifier ou annuler, répondez à ce message ou contactez-nous.\n` +
    `À bientôt !`;

  const sentBy = session!.userId;
  const pid = patientId || null;

  const results: { channel: string; simulated: boolean; error?: string }[] = [];

  if (channel === 'whatsapp' || channel === 'both') {
    const r = await sendWhatsAppMessage({ patientId: pid, phone, body: messageBody, sentBy });
    results.push({ channel: 'whatsapp', simulated: r.simulated, error: r.error });
  }

  if (channel === 'sms' || channel === 'both') {
    const r = await sendSms({ patientId: pid, phone, body: messageBody, sentBy });
    results.push({ channel: 'sms', simulated: r.simulated, error: r.error });
  }

  const allSimulated = results.every(r => r.simulated);
  const hasError = results.find(r => r.error);

  return NextResponse.json({
    results,
    simulated: allSimulated,
    messageBody,
    error: hasError?.error,
  });
}
