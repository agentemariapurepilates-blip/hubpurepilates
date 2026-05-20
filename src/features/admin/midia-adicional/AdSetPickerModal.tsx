import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type AdSetRow = {
  id: string;
  meta_ad_set_id: string;
  nome: string;
  status: string | null;
  dpp_campaigns: { nome: string } | null;
  dpp_unit_ad_set_link:
    | { unit_id: string; dpp_units: { nome: string } | null }[]
    | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  currentAdSetId?: string;
};

export function AdSetPickerModal({ open, onOpenChange, unitId, currentAdSetId }: Props) {
  const [q, setQ] = useState('');
  const queryClient = useQueryClient();

  const { data: rows, isLoading } = useQuery({
    queryKey: ['dpp_ad_sets_picker'],
    queryFn: async (): Promise<AdSetRow[]> => {
      const { data, error } = await supabase
        .from('dpp_ad_sets' as never)
        .select(
          `id, meta_ad_set_id, nome, status, dpp_campaigns (nome),
           dpp_unit_ad_set_link (unit_id, dpp_units (nome))`,
        )
        .order('nome');
      if (error) throw error;
      return (data ?? []) as unknown as AdSetRow[];
    },
    enabled: open,
  });

  const filtered = useMemo(() => {
    if (!rows) return [];
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.nome.toLowerCase().includes(term) ||
        (r.dpp_campaigns?.nome ?? '').toLowerCase().includes(term),
    );
  }, [rows, q]);

  const linkMutation = useMutation({
    mutationFn: async ({ adSetId }: { adSetId: string }) => {
      // Pega user atual pra passar como p_actor na RPC
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sessão expirada');

      const { error: rpcErr } = await supabase.rpc('dpp_relink_ad_set' as never, {
        p_unit_id: unitId,
        p_ad_set_id: adSetId,
        p_actor: user.id,
      });
      if (rpcErr) throw rpcErr;

      // Dispara backfill 180d em background via Edge Function (fire-and-forget)
      void supabase.functions
        .invoke('dpp-admin-backfill', { body: { ad_set_id: adSetId, days: 180 } })
        .catch((e) => console.error('backfill falhou', e));
    },
    onSuccess: () => {
      toast.success('Ad set vinculado. Backfill de 180 dias iniciado em background.');
      queryClient.invalidateQueries({ queryKey: ['dpp_units'] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(`Erro ao vincular: ${e.message}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Escolher conjunto de anúncio</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar ad set ou campanha..."
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="border rounded-md max-h-96 overflow-auto divide-y">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Carregando...
            </div>
          )}
          {!isLoading &&
            filtered.map((row) => {
              const link = row.dpp_unit_ad_set_link?.[0];
              const linkedUnitName = link?.dpp_units?.nome;
              const linkedToOther = !!linkedUnitName && link?.unit_id !== unitId;
              const isCurrent = row.id === currentAdSetId;

              const handleClick = () => {
                if (linkedToOther) {
                  const ok = confirm(
                    `Esse ad set já está vinculado a "${linkedUnitName}". Mover para esta unidade?`,
                  );
                  if (!ok) return;
                }
                linkMutation.mutate({ adSetId: row.id });
              };

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={handleClick}
                  disabled={isCurrent || linkMutation.isPending}
                  className={`w-full text-left px-3 py-2 transition-colors ${
                    isCurrent
                      ? 'bg-primary/5 cursor-default'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                    {row.nome}
                    {row.status && (
                      <Badge variant="outline" className="text-[10px]">
                        {row.status}
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="text-[10px] bg-primary/10 text-primary hover:bg-primary/10">
                        Atual
                      </Badge>
                    )}
                    {linkedToOther && (
                      <Badge variant="outline" className="text-[10px] bg-orange-100 text-orange-700 border-orange-200">
                        Já em {linkedUnitName}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {row.dpp_campaigns?.nome ?? 'Sem campanha'}
                  </div>
                </button>
              );
            })}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum ad set encontrado.
            </div>
          )}
        </div>
        {linkMutation.isPending && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Vinculando e disparando backfill...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
