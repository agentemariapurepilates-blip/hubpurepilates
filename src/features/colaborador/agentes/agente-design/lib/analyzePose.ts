import { supabase } from '@/integrations/supabase/client';

export type PoseImage = {
  mime_type: string;
  data: string; // base64 sem prefixo data URI
};

export type AnalyzePoseResult = {
  success: true;
  description: string;
  model: string;
  elapsed_ms: number;
};

type AnalyzePoseError = {
  error: string;
  details?: string;
  finish_reason?: string;
};

const FUNCTIONS_URL =
  (import.meta.env.VITE_FUNCTIONS_URL as string | undefined) ||
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export async function analyzePose(image: PoseImage): Promise<AnalyzePoseResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Não autenticado');
  }

  const response = await fetch(`${FUNCTIONS_URL}/analyze-pose-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const err = json as AnalyzePoseError;
    throw new Error(
      err.error +
        (err.details ? ` — ${err.details}` : '') +
        (err.finish_reason ? ` (finish_reason: ${err.finish_reason})` : '')
    );
  }

  return json as AnalyzePoseResult;
}
