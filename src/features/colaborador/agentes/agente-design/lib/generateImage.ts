import { supabase } from '@/integrations/supabase/client';

export type GenerateModel = 'flash' | 'pro';
export type AspectRatio = 'auto' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9';
export type Resolution = 'auto' | '1K' | '2K' | '4K';

export type ReferenceImage = {
  mime_type: string;
  data: string; // base64 sem prefixo data URI
};

export type GenerateParams = {
  prompt: string;
  references: ReferenceImage[];
  model: GenerateModel;
  temperature?: number;
  aspect_ratio?: Exclude<AspectRatio, 'auto'>;
  resolution?: Exclude<Resolution, 'auto'>;
  system_instructions?: string;
  grounding?: boolean;
  avatar_name?: string;
};

export type GenerateResult = {
  success: true;
  image: {
    mime_type: string;
    data: string; // base64
  };
  model: string;
  elapsed_ms: number;
};

export type GenerateError = {
  error: string;
  details?: string;
  finish_reason?: string;
  text_response?: string | null;
};

// Pega a URL base das Edge Functions. Permite override via VITE_FUNCTIONS_URL (.env.local).
const FUNCTIONS_URL =
  (import.meta.env.VITE_FUNCTIONS_URL as string | undefined) ||
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export async function urlToBase64(url: string): Promise<ReferenceImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao carregar imagem ${url}: ${response.status}`);
  }
  const blob = await response.blob();
  const mime_type = blob.type || 'image/jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ mime_type, data: base64 });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function generateImage(params: GenerateParams): Promise<GenerateResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Não autenticado');
  }

  const response = await fetch(`${FUNCTIONS_URL}/generate-design-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const err = json as GenerateError;
    throw new Error(
      err.error +
        (err.details ? ` — ${err.details}` : '') +
        (err.finish_reason ? ` (finish_reason: ${err.finish_reason})` : '') +
        (err.text_response ? ` [resposta texto: ${err.text_response}]` : '')
    );
  }

  return json as GenerateResult;
}
