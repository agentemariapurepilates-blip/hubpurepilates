import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Megaphone, Search, ScrollText } from 'lucide-react';
import { normalizeLink } from '@/lib/dpp-link';

type LinkRow = { dpp_ad_sets: { nome: string; status: string | null } | null };

type UnitRow = {
  id: string;
  external_id: string;
  nome: string;
  cidade: string | null;
  bairro: string | null;
  uf: string | null;
  ativa_dashboard: boolean;
  // PostgREST retorna como objeto único OU array, dependendo da versão.
  // Use normalizeLink() pra acessar.
  dpp_unit_ad_set_link: LinkRow | LinkRow[] | null;
};

function StatusBadge({ hasLink, ativa }: { hasLink: boolean; ativa: boolean }) {
  if (!ativa)
    return (
      <Badge variant="outline" className="bg-gray-100 text-muted-foreground">
        Desativada
      </Badge>
    );
  if (!hasLink) return <Badge variant="outline">Sem vínculo</Badge>;
  return (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
      Vinculada
    </Badge>
  );
}

export default function MidiaAdicional() {
  const [q, setQ] = useState('');

  const { data: units, isLoading } = useQuery({
    queryKey: ['dpp_units'],
    queryFn: async (): Promise<UnitRow[]> => {
      const { data, error } = await supabase
        .from('dpp_units' as never)
        .select(
          `id, external_id, nome, cidade, bairro, uf, ativa_dashboard,
           dpp_unit_ad_set_link (dpp_ad_sets (nome, status))`,
        )
        .order('nome');
      if (error) throw error;
      return (data ?? []) as unknown as UnitRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!units) return [];
    const term = q.trim().toLowerCase();
    if (!term) return units;
    return units.filter(
      (u) =>
        u.nome.toLowerCase().includes(term) ||
        (u.cidade ?? '').toLowerCase().includes(term) ||
        (u.bairro ?? '').toLowerCase().includes(term),
    );
  }, [units, q]);

  const total = units?.length ?? 0;
  const vinculadas = (units ?? []).filter(
    (u) => normalizeLink(u.dpp_unit_ad_set_link).length > 0,
  ).length;

  return (
    <MainLayout>
      <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              Mídia Adicional
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Métricas das campanhas de Mídia Adicional por unidade.
              Atualizadas diariamente às 03h (BRT).
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/minha-area/midia-adicional/sync-logs">
              <ScrollText className="h-4 w-4 mr-2" />
              Sync logs
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Total de unidades
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{isLoading ? '—' : total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Vinculadas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-700">
                {isLoading ? '—' : vinculadas}
              </div>
            </CardContent>
          </Card>
          <Card className="hidden md:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                Sem vínculo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-muted-foreground">
                {isLoading ? '—' : total - vinculadas}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por unidade, cidade ou bairro..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 max-w-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="w-16">UF</TableHead>
                      <TableHead>Conjunto de anúncio</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => {
                      const ad = normalizeLink(u.dpp_unit_ad_set_link)[0]?.dpp_ad_sets;
                      return (
                        <TableRow
                          key={u.id}
                          className="cursor-pointer hover:bg-muted/50"
                          asChild
                        >
                          <Link
                            to={`/minha-area/midia-adicional/${encodeURIComponent(u.external_id)}`}
                          >
                            <TableCell className="font-medium">
                              <div>{u.nome}</div>
                              {u.bairro && (
                                <div className="text-xs text-muted-foreground">
                                  {u.bairro}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{u.uf ?? '—'}</TableCell>
                            <TableCell className="text-sm">
                              {ad?.nome ? (
                                <span className="text-primary">{ad.nome}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusBadge
                                hasLink={!!ad}
                                ativa={u.ativa_dashboard}
                              />
                            </TableCell>
                          </Link>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhuma unidade encontrada.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
