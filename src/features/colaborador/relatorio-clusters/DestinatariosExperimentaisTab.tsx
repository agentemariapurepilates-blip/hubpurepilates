import { Info } from 'lucide-react';
import { PainelDestinatarios } from '@/components/destinatarios/PainelDestinatarios';
import {
  useAlternarDestinatarioExperimentais,
  useCriarDestinatarioExperimentais,
  useDestinatariosExperimentais,
  useExcluirDestinatarioExperimentais,
} from './hooks/useDestinatariosExperimentais';

/**
 * Quem recebe o relatório de clusters de aulas experimentais — no penúltimo dia
 * de cada mês, às 3h.
 *
 * O relatório lista as unidades com nome, ID e a MÉDIA de aulas experimentais
 * dos 3 últimos meses (o vigente e os dois anteriores), divididas em Bom
 * (30 ou mais), Regular (20 a 29) e Ruim (0 a 19). As faixas são fixas, e não
 * relativas à rede: uma unidade só muda de bloco se o número dela mudar.
 */
export function DestinatariosExperimentaisTab() {
  return (
    <PainelDestinatarios
      hooks={{
        usarLista: useDestinatariosExperimentais,
        usarCriar: useCriarDestinatarioExperimentais,
        usarAlternar: useAlternarDestinatarioExperimentais,
        usarExcluir: useExcluirDestinatarioExperimentais,
      }}
      textos={{
        tituloCadastro: 'Novo destinatário do relatório de aulas experimentais',
        descricaoCadastro:
          'Quem estiver aqui e ativo recebe, no penúltimo dia de cada mês às 3h, a lista de unidades com a média de aulas experimentais dos 3 últimos meses, divididas em Bom (30+), Regular (20 a 29) e Ruim (0 a 19).',
        exemploEmail: 'comercial@purepilates.com.br',
        nomeDoEnvio: 'o relatório de aulas experimentais',
        idPrefixo: 'experimentais',
        avisoDeTopo: (
          <div className="metric-card flex items-start gap-3 border-info/40 bg-info/5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-info" />
            <p className="text-sm text-muted-foreground">
              <strong>O envio ainda não está ativo.</strong> A lista já pode ser montada, mas o
              relatório só começa a sair quando o disparo automático for publicado. Nada é enviado
              até lá.
            </p>
          </div>
        ),
      }}
    />
  );
}
