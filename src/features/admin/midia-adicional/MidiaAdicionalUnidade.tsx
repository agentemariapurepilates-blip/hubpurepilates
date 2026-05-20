import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  MapPin,
  Power,
  Link as LinkIcon,
  Unlink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdSetPickerModal } from './AdSetPickerModal';

type UnitDetail = {
  id: string;
  external_id: string;
  nome: string;
  cidade: string | null;
  bairro: string | null;
  uf: string | null;
  latitude: number | null;
  longitude: number | null;
  ativa_dashboard: boolean;
  dpp_unit_ad_set_link:
    | {
        ad_set_id: string;
        dpp_ad_sets: {
          id: string;
          meta_ad_set_id: string;
          nome: string;
          status: string | null;
          dpp_campaigns: { nome: string } | null;
        } | null;
      }[]
    | null;
};

export default function MidiaAdicionalUnidade() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: unit, isLoading } = useQuery({
    queryKey: ['dpp_units', slug],
    queryFn: async (): Promise<UnitDetail | null> => {
      const { data, error } = await supabase
        .from('dpp_units' as never)
        .select(
          `id, external_id, nome, cidade, bairro, uf, latitude, longitude, ativa_dashboard,
           dpp_unit_ad_set_link (ad_set_id, dpp_ad_sets (id, meta_ad_set_id, nome, status, dpp_campaigns (nome)))`,
        )
        .eq('external_id', slug!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as UnitDetail) ?? null;
    },
    enabled: !!slug,
  });

  const link = unit?.dpp_unit_ad_set_link?.[0];
  const adSet = link?.dpp_ad_sets;

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('dpp_unit_ad_set_link' as never)
        .delete()
        .eq('unit_id', unit!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vínculo removido');
      queryClient.invalidateQueries({ queryKey: ['dpp_units'] });
    },
    onError: (e: Error) => toast.error(`Erro ao desvincular: ${e.message}`),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('dpp_units' as never)
        .update({ ativa_dashboard: !unit!.ativa_dashboard })
        .eq('id', unit!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(unit!.ativa_dashboard ? 'Unidade desativada' : 'Unidade ativada');
      queryClient.invalidateQueries({ queryKey: ['dpp_units'] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!unit) {
    return (
      <MainLayout>
        <div className="p-4 lg:p-8 max-w-3xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Unidade não encontrada.</p>
              <Button
                variant="link"
                onClick={() => navigate('/minha-area/midia-adicional')}
              >
                Voltar pra lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/minha-area/midia-adicional">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar pra lista
          </Link>
        </Button>

        <div>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
                Editar unidade
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold mt-1">{unit.nome}</h1>
              {(unit.bairro || unit.cidade) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[unit.bairro, unit.cidade, unit.uf].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            {unit.ativa_dashboard ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                Ativa no dashboard
              </Badge>
            ) : (
              <Badge variant="outline">Desativada</Badge>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Conjunto de anúncio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {adSet ? (
              <>
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="font-semibold">{adSet.nome}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Campanha: {adSet.dpp_campaigns?.nome ?? '—'} · Status:{' '}
                    {adSet.status ?? '—'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                    Trocar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Unlink className="h-4 w-4 mr-1" /> Desvincular
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Desvincular ad set?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A unidade vai parar de receber novas métricas. Os dados
                          históricos ficam preservados. Você pode vincular outro
                          (ou o mesmo) ad set depois.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => unlinkMutation.mutate()}>
                          Desvincular
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Sem ad set vinculado. Escolha um pra começar a receber métricas.
                </p>
                <Button onClick={() => setPickerOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-1" /> Vincular conjunto
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Power className="h-4 w-4" />
              Status no dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Desativar esconde a unidade do dashboard sem apagar dados. Útil
              quando uma unidade está temporariamente fora do ar.
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={toggleActiveMutation.isPending}
              onClick={() => toggleActiveMutation.mutate()}
            >
              {toggleActiveMutation.isPending && (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              )}
              {unit.ativa_dashboard ? 'Desativar unidade' : 'Ativar unidade'}
            </Button>
          </CardContent>
        </Card>

        <Separator />
        <p className="text-xs text-muted-foreground">
          ID externo: <code className="font-mono">{unit.external_id}</code>
        </p>

        <AdSetPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          unitId={unit.id}
          currentAdSetId={adSet?.id}
        />
      </div>
    </MainLayout>
  );
}
