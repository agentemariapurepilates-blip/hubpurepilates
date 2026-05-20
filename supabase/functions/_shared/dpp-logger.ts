// Wrappers em volta de dpp_sync_logs.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

type Kind = 'units' | 'ad_sets_catalog' | 'meta' | 'backfill';
type Status = 'success' | 'partial' | 'error';

export async function startSyncLog(sb: SupabaseClient, kind: Kind): Promise<string> {
  const { data, error } = await sb
    .from('dpp_sync_logs')
    .insert({ kind, status: 'running' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function finishSyncLog(
  sb: SupabaseClient,
  id: string,
  status: Status,
  summary: Record<string, unknown>,
): Promise<void> {
  await sb
    .from('dpp_sync_logs')
    .update({ status, summary, finished_at: new Date().toISOString() })
    .eq('id', id);
}
