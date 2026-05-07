export type ConnectionStatus = 'active' | 'expired' | 'revoked';

export function getStatusLabel(status: ConnectionStatus | null | undefined): string {
  if (!status) return 'Não conectado';
  switch (status) {
    case 'active': return 'Conectado';
    case 'expired': return 'Token expirado';
    case 'revoked': return 'Acesso revogado';
  }
}

export function getStatusBadgeColor(status: ConnectionStatus | null | undefined): string {
  if (!status) return 'bg-slate-200 text-slate-700';
  switch (status) {
    case 'active': return 'bg-emerald-500 text-white';
    case 'expired': return 'bg-amber-400 text-slate-900';
    case 'revoked': return 'bg-red-500 text-white';
  }
}
