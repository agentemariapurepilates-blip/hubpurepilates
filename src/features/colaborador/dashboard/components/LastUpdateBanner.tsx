// Port de "Dashboard Ads - Unidades"/src/app/dashboard/_components/last-update-banner.tsx.
// Substituição: pure-dark → pure-black.

export function LastUpdateBanner({ lastSyncAt, status }: { lastSyncAt?: string; status?: string }) {
  if (!lastSyncAt)
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-2">
        Ainda não há dados sincronizados para esta unidade. O próximo sync roda às 03h.
      </div>
    );
  const dt = new Date(lastSyncAt);
  const fmt = dt.toLocaleString('pt-BR');
  const todayYmd = new Date().toISOString().slice(0, 10);
  const syncedToday = dt.toISOString().slice(0, 10) === todayYmd;

  if (status === 'error')
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-2">
        Sync de hoje falhou. Dados mostrados são do último sync bem-sucedido em {fmt}.
      </div>
    );
  if (!syncedToday)
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-2">
        Sync de hoje ainda não rodou. Dados mostrados são do último sync em {fmt}.
      </div>
    );
  return <div className="text-xs text-pure-gray mt-1">Atualizado em {fmt} (sync diário)</div>;
}
