import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { SocialNetworkConfig } from '@/data/social-networks';
import type { ConnectionStatus } from '@/lib/social-status';
import { getStatusLabel, getStatusBadgeColor } from '@/lib/social-status';

export interface ConnectionInfo {
  status: ConnectionStatus;
  account_handle: string;
}

interface ConnectionCardProps {
  config: SocialNetworkConfig;
  connection: ConnectionInfo | null;
  followers: number | null;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionCard({
  config,
  connection,
  followers,
  loading,
  onConnect,
  onDisconnect,
}: ConnectionCardProps) {
  const Icon = config.icon;
  const statusLabel = getStatusLabel(connection?.status ?? null);
  const badgeColor = getStatusBadgeColor(connection?.status ?? null);
  const isConnected = connection?.status === 'active';
  const borderClass = config.brandColor.split(' ').filter((c) => c.startsWith('border-')).join(' ');
  const textClass = config.brandColor.split(' ').filter((c) => c.startsWith('text-')).join(' ');

  return (
    <Card className={`border-t-4 ${borderClass}`}>
      <CardHeader className="flex flex-row items-center gap-3">
        <Icon className={`h-6 w-6 ${textClass}`} />
        <div>
          <h3 className="font-semibold">{config.label}</h3>
          {connection?.account_handle ? (
            <p className="text-xs text-muted-foreground">{connection.account_handle}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{config.handle}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>
          {statusLabel}
        </span>

        {isConnected && (
          <div>
            <p className="text-xs text-muted-foreground">Seguidores</p>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">
                {followers !== null ? followers.toLocaleString('pt-BR') : '--'}
              </p>
            )}
          </div>
        )}

        {!isConnected ? (
          <Button onClick={onConnect} className="w-full" size="sm">
            Conectar
          </Button>
        ) : (
          <Button onClick={onDisconnect} variant="outline" className="w-full" size="sm">
            Desconectar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
