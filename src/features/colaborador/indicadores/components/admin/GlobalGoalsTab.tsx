import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useGlobalGoals } from '../../hooks/useGlobalGoals';
import { useMesesComMeta } from '../../hooks/useMesesComMeta';
import { useIndicatorMappings } from '../../hooks/useIndicatorMapping';
import { useSalvarMetasGlobais } from '../../hooks/useSalvarMetasGlobais';
import { mensagemDoErro } from '../../lib/indicadoresProxy';
import {
  alteracoesDaGrade,
  chaveDaCelula,
  limparDigitacao,
  mesesParaEdicao,
  totalDaColuna,
} from '../../lib/metasGlobais';
import { AlertTriangle, Loader2, Save, Target, Undo2 } from 'lucide-react';

// Metas globais diárias (daily_goals com unit_id nulo), mês a mês.
//
// EDITÁVEL SÓ NO SERVIDOR LOCAL. A gravação passa pelo proxy do `npm run dev`
// (vite.config.ts → dev-proxy/metasGlobais.ts), que usa a chave de serviço do
// banco de indicadores. No build de produção esse proxy não existe, então lá a
// aba continua somente consulta — um botão "Salvar" que não salva seria pior
// que não ter botão.
//
// A gravação vai para o banco de PRODUÇÃO do Painel, o mesmo do Cloudflare. Por
// isso o aviso fixo na tela e a confirmação ao trocar de mês com alteração
// pendente.

const NOMES_DOS_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function rotuloDoMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return `${NOMES_DOS_MESES[m - 1]} ${ano}`;
}

const METRICAS_COM_META = ['experimentais', 'experimentais_presenca', 'matriculas_total', 'matriculas_purepass'];

interface GlobalGoalsTabProps {
  /** Liga a edição. Por padrão, só no servidor de desenvolvimento. */
  editavel?: boolean;
}

export function GlobalGoalsTab({ editavel = import.meta.env.DEV }: GlobalGoalsTabProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  // O que foi digitado, por célula. Célula ausente = não mexida.
  const [rascunho, setRascunho] = useState<Record<string, string>>({});

  const { data: existingGoals, isLoading: isLoadingGoals, error: erroDasMetas } = useGlobalGoals(selectedMonth);
  const { data: mesesDisponiveis } = useMesesComMeta();
  const { data: indicators } = useIndicatorMappings();
  const salvar = useSalvarMetasGlobais();

  const goalIndicators = useMemo(() => {
    if (!indicators) return [];
    return indicators
      .filter(i => i.active && METRICAS_COM_META.includes(i.metric_key))
      .sort((a, b) => (a.dashboard_order ?? 0) - (b.dashboard_order ?? 0));
  }, [indicators]);
  const metricas = useMemo(() => goalIndicators.map(i => i.metric_key), [goalIndicators]);

  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  // Metas vindas do banco, indexadas por "dia-metrica".
  const original = useMemo(() => {
    const mapa: Record<string, number> = {};
    existingGoals?.forEach(goal => {
      const day = parseInt(goal.date.split('-')[2]);
      mapa[chaveDaCelula(day, goal.metric_key)] = Number(goal.daily_target);
    });
    return mapa;
  }, [existingGoals]);

  const alteracoes = useMemo(
    () => alteracoesDaGrade(selectedMonth, daysInMonth, metricas, original, rascunho),
    [selectedMonth, daysInMonth, metricas, original, rascunho],
  );
  const temAlteracoes = alteracoes.length > 0;

  // Fechar ou recarregar a aba com alteração pendente perde a digitação.
  useEffect(() => {
    if (!temAlteracoes) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [temAlteracoes]);

  // Na consulta, os meses que TÊM meta mais o corrente e o seguinte (ver
  // useMesesComMeta). Na edição, também os 12 meses seguintes — é neles que se
  // cadastra meta nova.
  const monthOptions = useMemo(() => {
    const lista = editavel
      ? mesesParaEdicao(mesesDisponiveis, new Date())
      : (mesesDisponiveis?.length ? mesesDisponiveis : [selectedMonth]);
    return lista.map(value => ({ value, label: rotuloDoMes(value) }));
  }, [editavel, mesesDisponiveis, selectedMonth]);

  const trocarDeMes = (mes: string) => {
    if (temAlteracoes && !window.confirm(
      `Há ${alteracoes.length} alteração(ões) não salvas em ${rotuloDoMes(selectedMonth)}. Trocar de mês e descartar?`,
    )) return;
    setRascunho({});
    setSelectedMonth(mes);
  };

  const valorNaCelula = (chave: string): string => {
    if (rascunho[chave] !== undefined) return rascunho[chave];
    return original[chave] === undefined ? '' : String(original[chave]);
  };

  const handleSalvar = () => {
    const mes = selectedMonth;
    salvar.mutate(
      { mes, metas: alteracoes },
      {
        onSuccess: (r) => {
          setRascunho({});
          const partes = [
            r.criadas > 0 && `${r.criadas} nova(s)`,
            r.atualizadas > 0 && `${r.atualizadas} atualizada(s)`,
          ].filter(Boolean);
          toast({
            title: `Metas de ${rotuloDoMes(mes)} salvas`,
            description: partes.length ? partes.join(', ') + '.' : 'Nada mudou no banco.',
          });
        },
        onError: (erro) => {
          toast({
            title: 'As metas não foram salvas',
            description: mensagemDoErro(erro),
            variant: 'destructive',
          });
        },
      },
    );
  };

  const temMetasCadastradas = (existingGoals?.length ?? 0) > 0;
  const mostrarGrade = editavel ? !erroDasMetas : temMetasCadastradas;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas Globais Diárias
          </CardTitle>
          <CardDescription>
            {editavel
              ? 'Defina as metas diárias de cada indicador. Essas metas são globais e refletem em D-1, MTW e MTD.'
              : 'Metas diárias cadastradas para cada indicador. Essas metas são globais e refletem em D-1, MTW e MTD.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {editavel && (
            <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-sm text-muted-foreground">
                <strong>Salvar grava direto no banco do Painel de Indicadores.</strong> A meta passa a valer na hora
                para todo mundo, inclusive no painel do Cloudflare.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-xs">
              <Select value={selectedMonth} onValueChange={trocarDeMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editavel && (
              <div className="flex gap-2 sm:ml-auto">
                <Button
                  variant="outline"
                  onClick={() => setRascunho({})}
                  disabled={!temAlteracoes || salvar.isPending}
                  className="gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  Descartar
                </Button>
                <Button onClick={handleSalvar} disabled={!temAlteracoes || salvar.isPending} className="gap-2">
                  {salvar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {temAlteracoes ? `Salvar ${alteracoes.length} alteração(ões)` : 'Salvar alterações'}
                </Button>
              </div>
            )}
          </div>

          {isLoadingGoals ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : erroDasMetas ? (
            <div className="text-center py-12 text-destructive">
              Não foi possível ler as metas deste mês: {mensagemDoErro(erroDasMetas)}
            </div>
          ) : goalIndicators.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum indicador configurado para metas.
            </div>
          ) : !mostrarGrade ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma meta cadastrada para este mês.
            </div>
          ) : (
            <>
              {editavel && !temMetasCadastradas && (
                <p className="text-sm text-muted-foreground">
                  {rotuloDoMes(selectedMonth)} ainda não tem meta cadastrada. Preencha os dias e salve.
                </p>
              )}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-16 text-center">Dia</TableHead>
                        {goalIndicators.map(indicator => (
                          <TableHead key={indicator.metric_key} className="text-center min-w-[120px]">
                            {indicator.display_name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                        <TableRow key={day}>
                          <TableCell className="text-center font-medium">
                            {day.toString().padStart(2, '0')}
                          </TableCell>
                          {goalIndicators.map(indicator => {
                            const chave = chaveDaCelula(day, indicator.metric_key);

                            if (!editavel) {
                              const valor = original[chave];
                              return (
                                <TableCell key={chave} className="text-center tabular-nums">
                                  {valor === undefined ? (
                                    <span className="text-muted-foreground">—</span>
                                  ) : (
                                    valor.toLocaleString('pt-BR')
                                  )}
                                </TableCell>
                              );
                            }

                            const texto = valorNaCelula(chave);
                            const antes = original[chave];
                            const mudou = rascunho[chave] !== undefined
                              && (texto === '' ? (antes !== undefined && antes !== 0) : Number(texto) !== antes);
                            return (
                              <TableCell key={chave} className="p-1">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  aria-label={`${indicator.display_name}, dia ${day}`}
                                  className={cn(
                                    'h-8 text-center tabular-nums',
                                    mudou && 'border-primary bg-primary/5 font-semibold',
                                  )}
                                  value={texto}
                                  placeholder="—"
                                  disabled={salvar.isPending}
                                  onChange={(e) => {
                                    const limpo = limparDigitacao(e.target.value);
                                    setRascunho(prev => ({ ...prev, [chave]: limpo }));
                                  }}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="sticky bottom-0 bg-muted">
                      <TableRow>
                        <TableCell className="text-center font-bold">TOTAL</TableCell>
                        {goalIndicators.map(indicator => (
                          <TableCell key={`total-${indicator.metric_key}`} className="text-center font-bold">
                            {totalDaColuna(daysInMonth, indicator.metric_key, original, rascunho).toLocaleString('pt-BR')}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
