import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackTikTok() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(`TikTok retornou erro: ${errorParam}`);
      return;
    }

    if (!code || !state) {
      setError('Parâmetros inválidos no callback');
      return;
    }

    const expectedState = sessionStorage.getItem('oauth_state_tiktok');
    sessionStorage.removeItem('oauth_state_tiktok');

    if (!expectedState || expectedState !== state) {
      setError('State inválido');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback/tiktok`;

    supabase.functions
      .invoke('oauth-exchange-tiktok', {
        body: { code, redirectUri },
      })
      .then(({ data, error: invokeError }) => {
        if (invokeError || data?.error) {
          setError(invokeError?.message || data?.error || 'Falha na troca de token');
          return;
        }
        navigate('/agente-monitoramento/metricas');
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold text-red-600">Falha na conexão</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => navigate('/agente-monitoramento/metricas')}
            className="text-sm underline"
          >
            Voltar para Métricas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p>Conectando…</p>
      </div>
    </div>
  );
}
