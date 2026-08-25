import { ArtigoShell, Capa, Cartao, Destaque, FeatRow, Lista, Passo, SecHead, Secao } from './artigoUI';
import { CalendarDays, Clock, Info, RefreshCw } from 'lucide-react';

/**
 * PurePedia — Wellhub (Gympass): guia rápido para o aluno · Agendamento de aulas.
 *
 * TRANSCRIÇÃO FIEL do material original, que no Drive é uma ARTE (imagem):
 * "agendamento wellhub.jpeg" (Purepedia - Artigos/Manuais). Só o texto foi
 * aproveitado; o layout é o padrão dos artigos da PurePedia.
 *
 * Texto, títulos e ordem são os da peça. Não resumir, não reordenar, não
 * acrescentar. É material voltado ao ALUNO — o colaborador usa como referência
 * do que informar.
 */

const PASSOS = [
  <>
    Acesse o app <strong>Wellhub</strong> com sua conta.
  </>,
  <>Selecione a unidade Pure Pilates onde deseja realizar a aula.</>,
  <>Escolha o dia, o horário e a aula disponível.</>,
  <>
    Confirme o agendamento da <strong>aula</strong>.
  </>,
  <>Pronto! Sua aula está agendada com sucesso.</>,
];

const AgendamentoWellhubAluno = () => (
  <ArtigoShell>
    <Capa
      eyebrow="Wellhub (Gympass)"
      titulo="Guia rápido para o aluno — Agendamento de aulas"
      resumo="Confira como agendar suas aulas no Pure Pilates pelo Wellhub e as regras de cancelamento e check-in."
    />

    <Secao>
      <SecHead titulo="Como agendar sua aula" />
      <div className="pl-1">
        {PASSOS.map((texto, i) => (
          <Passo key={i} numero={i + 1} titulo={texto} />
        ))}
      </div>
      <Destaque titulo="Confirmação do agendamento">
        O agendamento será confirmado após o aluno receber a{' '}
        <strong>confirmação no app Wellhub</strong>.
      </Destaque>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="Regras de agendamento e cancelamento" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Cartao>
          <FeatRow icon={CalendarDays} titulo="Agendamento — até 3 horas antes" />
          <div className="my-4 h-px" style={{ background: 'rgba(31,35,40,.12)' }} />
          <FeatRow icon={Clock} titulo="Prazo">
            Você pode agendar sua aula com <strong>até 3 horas</strong> de antecedência do início.
          </FeatRow>
        </Cartao>

        <Cartao>
          <FeatRow icon={RefreshCw} titulo="Cancelamento e check-in" />
          <div className="my-4 h-px" style={{ background: 'rgba(31,35,40,.12)' }} />
          <FeatRow icon={Clock} titulo="Cancelou a tempo">
            Cancele sua aula com <strong>até 6 horas</strong> de antecedência do início e o check-in
            será <strong>devolvido automaticamente</strong>.
          </FeatRow>
          <div className="my-4 h-px" style={{ background: 'rgba(31,35,40,.12)' }} />
          <FeatRow icon={Info} titulo="Fora do prazo">
            Cancelamentos com menos de 6 horas ou no-show (não comparecimento){' '}
            <strong>não devolvem</strong> o check-in.
          </FeatRow>
        </Cartao>
      </div>
    </Secao>

    <Secao tom="rosa">
      <SecHead titulo="Informações importantes" />
      <Cartao>
        <Lista
          itens={[
            'O check-in só será consumido após o início da aula.',
            'Chegue com antecedência e faça o check-in no app da unidade (se disponível).',
            <>
              <strong>As políticas de cancelamento são definidas pelo Wellhub</strong> e podem ser
              alteradas sem aviso prévio.
            </>,
          ]}
        />
      </Cartao>
    </Secao>
  </ArtigoShell>
);

export default AgendamentoWellhubAluno;
