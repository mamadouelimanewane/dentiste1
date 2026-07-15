import 'server-only';
import { sql } from '@/lib/db';

// Écrit une ligne dans audit_logs (table créée par la migration 0005, jusqu'ici
// jamais alimentée). Best-effort : un échec d'écriture d'audit ne doit jamais
// faire échouer la mutation métier qu'il accompagne.
export async function recordAudit(entry: {
  actorId?: string | null;
  action: string;
  entityTable: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}) {
  try {
    await sql`
      insert into audit_logs (actor_id, action, entity_table, entity_id, meta)
      values (
        ${entry.actorId ?? null},
        ${entry.action},
        ${entry.entityTable},
        ${entry.entityId ?? null},
        ${JSON.stringify(entry.meta ?? {})}::jsonb
      )
    `;
  } catch (err) {
    console.error('recordAudit a échoué:', err);
  }
}
