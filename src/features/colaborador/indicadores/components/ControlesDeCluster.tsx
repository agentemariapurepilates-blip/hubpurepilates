import { BarChart3, GitCompareArrows, Layers, LineChart, Mail, Percent } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { rotuloDoMes } from '../lib/clusters-matriculados';

/** Formatos da visão da rede (todas as unidades). */
export type FormatoDaRede = 'empilhado' | 'percentual' | 'linhas';

/** Formatos da visão de uma unidade. */
export type FormatoDaUnidade = 'linha' | 'barras' | 'faixa';

interface Opcao<T> {
  valor: T;
  rotulo: string;
  icone: typeof BarChart3;
  dica: string;
}

export const FORMATOS_DA_REDE: Array<Opcao<FormatoDaRede>> = [
  { valor: 'empilhado', rotulo: 'Empilhado', icone: BarChart3, dica: 'Quantas unidades em cada cluster' },
  { valor: 'percentual', rotulo: 'Percentual', icone: Percent, dica: 'Participação de cada cluster no total' },
  { valor: 'linhas', rotulo: 'Linhas', icone: LineChart, dica: 'Cada cluster como uma linha no tempo' },
];

/**
 * Os formatos da unidade são OUTROS, e não os mesmos da rede.
 *
 * "Empilhado" e "Percentual" não existem aqui: com uma unidade só não há
 * distribuição para empilhar nem participação para calcular — daria sempre 100%
 * num cluster. O que muda de verdade é olhar o VALOR (quantos alunos) ou a
 * FAIXA (em que cluster ela está), que respondem perguntas diferentes.
 */
export const FORMATOS_DA_UNIDADE: Array<Opcao<FormatoDaUnidade>> = [
  { valor: 'linha', rotulo: 'Linha', icone: LineChart, dica: 'Matriculados mês a mês' },
  { valor: 'barras', rotulo: 'Barras', icone: BarChart3, dica: 'O mesmo valor em barras, coloridas pelo cluster' },
  { valor: 'faixa', rotulo: 'Faixa', icone: Layers, dica: 'Em que cluster a unidade esteve, mês a mês' },
];

interface ControlesProps<T extends string> {
  opcoes: Array<Opcao<T>>;
  formato: T;
  onFormatoChange: (f: T) => void;
  /** Comparação de meses. Omitir esconde o botão — só a visão da rede tem. */
  comparacao?: {
    ativa: boolean;
    onAtivaChange: (v: boolean) => void;
    meses: string[];
    mesA: string;
    mesB: string;
    onMesesChange: (a: string, b: string) => void;
  };
  /**
   * Aba do relatório por e-mail. Omitir esconde o botão — só admin tem.
   *
   * Quando ativa, os controles de gráfico somem: nenhum deles se aplica à
   * lista de destinatários, e deixá-los visíveis criaria botões que não fazem
   * nada — foi por isso que o seletor "Por dia / Por mês" saiu desta tela.
   */
  relatorio?: {
    ativa: boolean;
    onAtivaChange: (v: boolean) => void;
  };
}

/**
 * Seletor de formato do gráfico, e — quando aplicável — a comparação entre dois
 * meses.
 *
 * O formato muda o DESENHO e a INFORMAÇÃO ao mesmo tempo. Na rede, "Percentual"
 * não é só outro jeito de desenhar a mesma coisa: entre março e agosto ela foi
 * de 418 para 475 unidades, então um cluster pode ganhar unidades e perder
 * participação. As duas leituras são verdadeiras.
 */
export function ControlesDeCluster<T extends string>({
  opcoes,
  formato,
  onFormatoChange,
  comparacao,
  relatorio,
}: ControlesProps<T>) {
  const poucosMeses = (comparacao?.meses.length ?? 0) < 2;
  const noRelatorio = relatorio?.ativa ?? false;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {!noRelatorio && (
        <Tabs value={formato} onValueChange={(v) => onFormatoChange(v as T)}>
          <TabsList>
            {opcoes.map((o) => (
              <TabsTrigger key={o.valor} value={o.valor} className="gap-2" title={o.dica}>
                <o.icone className="h-4 w-4" />
                {o.rotulo}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {comparacao && !noRelatorio && (
        <>
          <Button
            type="button"
            variant={comparacao.ativa ? 'default' : 'outline'}
            size="sm"
            onClick={() => comparacao.onAtivaChange(!comparacao.ativa)}
            disabled={poucosMeses}
            // Um período de um mês só não tem o que comparar; sem o title o
            // botão desabilitado não explicaria o motivo.
            title={poucosMeses ? 'Escolha um período com pelo menos dois meses' : undefined}
          >
            <GitCompareArrows className="mr-2 h-4 w-4" />
            Comparar meses
          </Button>

          {comparacao.ativa && !poucosMeses && (
            <div className="flex items-center gap-2">
              <SeletorDeMes
                valor={comparacao.mesA}
                meses={comparacao.meses}
                onChange={(v) => comparacao.onMesesChange(v, comparacao.mesB)}
                rotulo="Mês base"
              />
              <span className="text-sm text-muted-foreground">com</span>
              <SeletorDeMes
                valor={comparacao.mesB}
                meses={comparacao.meses}
                onChange={(v) => comparacao.onMesesChange(comparacao.mesA, v)}
                rotulo="Mês comparado"
              />
            </div>
          )}
        </>
      )}

      {relatorio && (
        <Button
          type="button"
          variant={noRelatorio ? 'default' : 'outline'}
          size="sm"
          onClick={() => relatorio.onAtivaChange(!noRelatorio)}
        >
          <Mail className="mr-2 h-4 w-4" />
          {noRelatorio ? 'Voltar aos gráficos' : 'Relatório por e-mail'}
        </Button>
      )}
    </div>
  );
}

function SeletorDeMes({
  valor,
  meses,
  onChange,
  rotulo,
}: {
  valor: string;
  meses: string[];
  onChange: (v: string) => void;
  rotulo: string;
}) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className="w-[110px]" aria-label={rotulo}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {meses.map((m) => (
          <SelectItem key={m} value={m}>
            {rotuloDoMes(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
