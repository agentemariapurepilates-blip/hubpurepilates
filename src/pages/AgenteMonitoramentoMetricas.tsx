import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { ConnectionCard, type ConnectionInfo } from '@/components/monitoring/ConnectionCard';
import { SOCIAL_NETWORKS, type SocialNetworkId } from '@/data/social-networks';
import { buildOAuthUrl, generateState } from '@/lib/oauth-url-builder';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3 } from 'lucide-react';

interface FollowersResult {
  network: string;
  followers: number;
}

export default function AgenteMonitoramentoMetricas() {
  const [connections, setConnections] = useState<Record<SocialNetworkId, ConnectionInfo | null>>({
    instagram: null,
    facebook: null,
    tiktok: null,
  });
  const [followers, setFollowers] = useState<Record<SocialNetworkId, number | null>>({
    instagram: null,
    facebook: null,
    tiktok: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadConnections();
  }, []);

  async function loadConnections() {
    setLoading(true);

    const { data: rows } = await supabase
      .from('social_connections')
      .select('network, status, account_handle');

    const next: Record<SocialNetworkId, ConnectionInfo | null> = {
      instagram: null,
      facebook: null,
      tiktok: null,
    };

    rows?.forEach((row: { network: string; status: string; account_handle: string }) => {
      next[row.network as SocialNetworkId] = {
        status: row.status as ConnectionInfo['status'],
        account_handle: row.account_handle,
      };
    });

    setConnections(next);

    const hasActive = rows?.some((r: { status: string }) => r.status === 'active');
    if (hasActive) {
      const { data: followersData } = await supabase.functions.invoke('fetch-followers-live');
      const map: Record<SocialNetworkId, number | null> = {
        instagram: null,
        facebook: null,
        tiktok: null,
      };
      (followersData?.results as FollowersResult[] | undefined)?.forEach((r) => {
        map[r.network as SocialNetworkId] = r.followers;
      });
      setFollowers(map);
    }

    setLoading(false);
  }

  function handleConnect(networkId: SocialNetworkId) {
    const config = SOCIAL_NETWORKS.find((n) => n.id === networkId);
    if (!config) return;

    const appId = import.meta.env[config.appIdEnv] as string | undefined;
    if (!appId) {
      alert(`Variável ${config.appIdEnv} não configurada no .env.local`);
      return;
    }

    const state = generateState();
    const isMeta = networkId === 'instagram' || networkId === 'facebook';
    const callbackPath = isMeta ? '/auth/callback/meta' : '/auth/callback/tiktok';
    const redirectUri = `${window.location.origin}${callbackPath}`;

    if (isMeta) {
      sessionStorage.setItem('oauth_state_meta', state);
      sessionStorage.setItem('oauth_network_meta', networkId);
    } else {
      sessionStorage.setItem('oauth_state_tiktok', state);
    }

    const url = buildOAuthUrl({
      authorizeUrl: config.oauthAuthorizeUrl,
      clientId: appId,
      redirectUri,
      scopes: config.scopes,
      state,
    });

    window.location.href = url;
  }

  async function handleDisconnect(networkId: SocialNetworkId) {
    if (!confirm(`Desconectar ${networkId}?`)) return;

    await supabase
      .from('social_connections')
      .delete()
      .eq('network', networkId);

    void loadConnections();
  }

  const anyConnected = Object.values(connections).some((c) => c?.status === 'active');

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Métricas</h1>
            <p className="text-muted-foreground">Monitoramento de redes sociais · @purepilatesbr</p>
          </div>
        </div>

        {!anyConnected && !loading && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            ⚠ Conecte ao menos uma conta para começar a ver métricas.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {SOCIAL_NETWORKS.map((config) => (
            <ConnectionCard
              key={config.id}
              config={config}
              connection={connections[config.id]}
              followers={followers[config.id]}
              loading={loading}
              onConnect={() => handleConnect(config.id)}
              onDisconnect={() => handleDisconnect(config.id)}
            />
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
