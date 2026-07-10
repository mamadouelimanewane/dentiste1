// Ré-export pour compatibilité avec les imports existants (`@/lib/supabase`).
// Nouveau code : préférer src/lib/supabase/client.ts (browser),
// src/lib/supabase/server.ts (server components/route handlers), ou
// src/lib/supabase/admin.ts (service role, server-only).
export { supabase } from './supabase/client';
