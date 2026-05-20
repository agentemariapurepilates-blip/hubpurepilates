import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, ScrollText } from 'lucide-react';

type SyncLog = {
  id: string;
  kind: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  summary: Record<string, unknown>;
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'success')
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        success
      </Badge>
    );
  if (status === 'partial')
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
        partial
      </Badge>
    );
  if (status === 'error')
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">error</Badge>
    );
  return <Badge variant="outline">{status}</Badge>;
}

export default function MidiaAdicionalSyncLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['dpp_sync_logs'],
    queryFn: async (): Promise<SyncLog[]> => {
      const { data, error } = await supabase
        .from('dpp_sync_logs' as never)
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as SyncLog[];
    },
  });

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/minha-area/midia-adicional">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" />
            Sync logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico dos cron jobs diários e backfills manuais. Limite de 100
            entradas mais recentes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas execuções</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Quando</TableHead>
                      <TableHead className="w-40">Tipo</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead>Resumo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(logs ?? []).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(l.started_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-sm font-mono">{l.kind}</TableCell>
                        <TableCell>
                          <StatusBadge status={l.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono truncate max-w-md">
                          {JSON.stringify(l.summary)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(logs ?? []).length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-8"
                        >
                          Nenhum log ainda.
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
