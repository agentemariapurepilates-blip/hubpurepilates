import { AlertTriangle, CalendarX, RotateCcw, Server, Wallet } from 'lucide-react';
import {
  ArtigoShell,
  Capa,
  Cartao,
  Faq,
  FeatRow,
  ItemCheck,
  Lista,
  MensagemCopiavel,
  P,
  Passo,
  SecHead,
  Secao,
} from './artigoUI';
import { MSG_DIVERGENCIA, MSG_INSTABILIDADE, MSG_WELLHUB_NAO_LIBERADO } from './mensagensSuporte';

// Os tres temas de MENSAGENS PADRAO deste documento, na ordem do original.
const MENSAGENS = [MSG_DIVERGENCIA, MSG_WELLHUB_NAO_LIBERADO, MSG_INSTABILIDADE];

/**
 * PurePedia — PLAYBOOK INTERNO WELLHUB (Manual operacional completo).
 *
 * TRANSCRIÇÃO FIEL do documento original (Drive: Purepedia - Artigos/Manuais).
 * O texto, os títulos e a ordem das seções são os do documento — só a
 * apresentação é nova (visual das LPs do Pure Station). Não resumir, não
 * reordenar e não acrescentar texto ao editar este arquivo: o conteúdo é
 * normativo para a operação. A única limpeza aplicada foi a remoção dos escapes
 * de markdown vindos da conversão do .docx (\! \[ \] \-).
 */

const FLUXO = [
  {
    titulo: 'Divergência de valores e royalties:',
    icon: Wallet,
    passos: [
      {
        titulo: 'Validar dados',
        conteudo: (
          <>
            <p className="mb-2">
              Peça que o franqueado extraia os relatórios do sistema e do portal de parceiros, análise
              por dia ou nome do aluno e informe quais as divergências
            </p>
            <p className="mb-2">
              Verifique em sistema se a reclamação está correta, como por exemplo: Se está seguindo o
              processo de agendamento padrão.
            </p>
            <p className="m-0">Caso esteja tudo correto seguimos para outra parte</p>
          </>
        ),
      },
      {
        titulo: 'Acionar suporte',
        conteudo: (
          <p className="m-0">
            Passamos as divergências completas, com nome do aluno, data, unidade e plano dele se possível
          </p>
        ),
      },
      {
        titulo: 'Retornar prazo',
        conteudo: (
          <>
            <p className="mb-2">
              Perguntar sempre se temos prazo, caso não seguir o padrão de 15 dias para parceiros e ir
              atualizando o franqueado enquanto isso
            </p>
            <p className="m-0">
              Caso passe dos 15 dias, confirme com o suporte e informe ao franqueado que não tivemos
              retorno, mas estamos acompanhando
            </p>
          </>
        ),
      },
      {
        titulo: 'Acompanhar resolução',
        conteudo: (
          <p className="m-0">
            Acompanhar os próximos meses para garantir que está tudo correto e sem divergências
          </p>
        ),
      },
    ],
  },
  {
    titulo: 'Check-in retroativo:',
    icon: RotateCcw,
    passos: [
      {
        titulo: 'Validar informações',
        conteudo: (
          <>
            <p className="mb-2">
              Peça ao franqueado que confira os dados completos do caso, como: nome do aluno, data da
              aula, horário, professor.
            </p>
            <p className="mb-2">Confirme em sistema:</p>
            <Lista
              itens={[
                'Se o aluno realmente compareceu na aula',
                'Se havia vaga disponível no horário',
                'Se a aula estava corretamente agendada',
                'Se o check-in não foi realizado por falha operacional, atraso ou fechamento de agenda',
              ]}
            />
            <p className="mt-2 mb-2">
              Verifique também se o pedido está dentro das possibilidades aceitas pelo parceiro.
            </p>
            <p className="m-0">Caso esteja tudo correto seguimos para outra parte</p>
          </>
        ),
      },
      {
        titulo: 'Acionar suporte',
        conteudo: (
          <>
            <p className="mb-2">
              Ir diretamente ao portal de parceiros para solicitar, indicar o franqueado a abrir um
              chamado com todas as informações completas do caso, incluindo prints se necessário.
            </p>
            <p className="mb-2">Informar:</p>
            <Lista
              itens={[
                'Nome do aluno',
                'Data da aula',
                'Unidade',
                'Horário',
                'Motivo do pedido retroativo',
              ]}
            />
          </>
        ),
      },
      {
        titulo: 'Alinhamento importante',
        conteudo: (
          <p className="m-0">
            Orientar o franqueado que check-ins retroativos passam por análise do parceiro e não possuem
            garantia de aprovação, pois dependem das regras e validações da plataforma.
          </p>
        ),
      },
      {
        titulo: 'Acompanhar resolução',
        conteudo: (
          <>
            <p className="mb-2">
              Seguir acompanhando o chamado até conclusão e retornar o franqueado assim que houver
              atualização.
            </p>
            <p className="m-0">
              Após finalização, acompanhar os próximos agendamentos da unidade para garantir que o fluxo
              de check-in esteja sendo realizado corretamente e evitar novas divergências.
            </p>
          </>
        ),
      },
    ],
  },
  {
    titulo: 'Wellhub não liberado / integração não finalizada:',
    icon: Server,
    passos: [
      {
        titulo: 'Validar informações',
        conteudo: (
          <>
            <p className="mb-2">
              Peça ao franqueado os dados completos do caso, como: unidade, data da solicitação e prints
              do erro apresentado.
            </p>
            <p className="mb-2">Confirme em sistema:</p>
            <Lista
              itens={[
                'Se a integração do Wellhub foi concluída corretamente',
                'Se existe alguma etapa pendente de ativação',
                'Se houve falha no vínculo entre sistema e parceiro',
                'Se os serviços estão ativos corretamente na unidade',
                'Se o processo padrão de integração foi seguido',
              ]}
            />
            <p className="mt-2 mb-2">
              Verifique também se o problema impacta apenas um usuário ou toda a operação da unidade.
            </p>
            <p className="m-0">Caso esteja tudo correto seguimos para outra parte</p>
          </>
        ),
      },
      {
        titulo: 'Acionar suporte',
        conteudo: (
          <>
            <p className="mb-2">
              Abrir chamado com todas as informações completas do caso, incluindo prints e detalhes do
              erro apresentado.
            </p>
            <p className="mb-2">Informar:</p>
            <Lista
              itens={[
                'Unidade',
                'Data em que o problema começou',
                'Mensagem de erro',
                'Impacto operacional causado',
                'Confirmação de que a integração não foi concluída corretamente',
              ]}
            />
          </>
        ),
      },
      {
        titulo: 'Retornar prazo',
        conteudo: (
          <>
            <p className="mb-2">
              Validar com o suporte o prazo estimado para análise e resolução. Caso não exista um prazo
              específico, manter o franqueado atualizado durante o acompanhamento.
            </p>
            <p className="m-0">
              Caso o prazo ultrapasse o esperado, reforçar internamente a urgência e informar ao
              franqueado que seguimos acompanhando a resolução junto ao suporte responsável.
            </p>
          </>
        ),
      },
      {
        titulo: 'Alinhamento importante',
        conteudo: (
          <>
            <p className="mb-2">
              Orientar o franqueado que, enquanto a integração não estiver totalmente concluída, o
              funcionamento do Wellhub pode permanecer indisponível parcial ou totalmente.
            </p>
            <p className="m-0">
              Reforçar também que a normalização depende da finalização correta da integração entre os
              sistemas.
            </p>
          </>
        ),
      },
      {
        titulo: 'Acompanhar resolução',
        conteudo: (
          <>
            <p className="mb-2">
              Seguir acompanhando o chamado até a conclusão e retornar o franqueado sempre que houver
              atualização.
            </p>
            <p className="m-0">
              Após resolução, validar se os agendamentos, check-ins e funcionamento do Wellhub foram
              normalizados corretamente na unidade.
            </p>
          </>
        ),
      },
    ],
  },
  {
    titulo: 'Instabilidade sistêmica:',
    icon: AlertTriangle,
    passos: [
      {
        titulo: 'Validar informações',
        conteudo: (
          <>
            <p className="mb-2">
              Peça aos franqueados detalhes completos do ocorrido, como: horário aproximado,
              funcionalidade impactada e prints ou vídeos do erro, se possível.
            </p>
            <p className="mb-2">Confirme em sistema:</p>
            <Lista
              itens={[
                'Se a instabilidade ocorre apenas na unidade ou em outras também',
                'Quais funcionalidades foram impactadas (agenda, login, check-in, financeiro, app, Wellhub etc.)',
                'Se existe manutenção ou ocorrência já identificada internamente',
                'Se o erro é contínuo ou intermitente',
              ]}
            />
            <p className="mt-2 mb-2">
              Verifique também se foram realizados os testes básicos, como atualização da página, troca de
              navegador ou novo acesso ao sistema.
            </p>
            <p className="m-0">Caso esteja tudo correto seguimos para outra parte</p>
          </>
        ),
      },
      {
        titulo: 'Acionar suporte',
        conteudo: (
          <>
            <p className="mb-2">
              Abrir chamado com todas as informações completas do caso, incluindo evidências do erro
              apresentado.
            </p>
            <p className="mb-2">Informar:</p>
            <Lista
              itens={[
                'Unidade',
                'Horário aproximado da instabilidade',
                'Funcionalidade afetada',
                'Mensagem de erro apresentada',
                'Impacto operacional causado',
                'Quantidade de usuários afetados, se possível',
              ]}
            />
          </>
        ),
      },
      {
        titulo: 'Retornar prazo',
        conteudo: (
          <>
            <p className="mb-2">
              Validar com o suporte se já existe previsão de normalização. Caso não exista, seguir
              acompanhando e manter o franqueado atualizado durante todo o processo.
            </p>
            <p className="m-0">
              Caso a instabilidade permaneça por período prolongado, reforçar internamente a urgência e
              continuar posicionando o franqueado sobre o andamento da tratativa.
            </p>
          </>
        ),
      },
      {
        titulo: 'Alinhamento importante',
        conteudo: (
          <>
            <p className="mb-2">
              Orientar o franqueado que instabilidades sistêmicas podem ocorrer de forma temporária e que
              a equipe responsável atua na identificação e normalização o mais rápido possível.
            </p>
            <p className="m-0">
              Quando necessário, orientar alternativas operacionais temporárias para reduzir impacto na
              unidade até a estabilização do sistema.
            </p>
          </>
        ),
      },
      {
        titulo: 'Acompanhar resolução',
        conteudo: (
          <>
            <p className="mb-2">Seguir acompanhando o caso até confirmação da normalização.</p>
            <p className="m-0">
              Após resolução, validar com o franqueado se o sistema voltou a funcionar corretamente e se
              todas as funcionalidades impactadas foram restabelecidas.
            </p>
          </>
        ),
      },
    ],
  },
  {
    titulo: 'Cancelamento de horários pela unidade',
    icon: CalendarX,
    passos: [
      {
        titulo: 'Validar informações',
        conteudo: (
          <>
            <p className="mb-2">
              Peça ao franqueado os dados completos do cancelamento, como: data da aula, horário,
              professor responsável e motivo do cancelamento.
            </p>
            <p className="mb-2">Confirme em sistema:</p>
            <Lista
              itens={[
                'Se a aula realmente foi cancelada pela unidade',
                'Quantos alunos estavam agendados',
                'Se os alunos foram avisados previamente',
                'Se houve tentativa de remanejamento para outros horários',
              ]}
            />
            <p className="mt-2 mb-0">
              Verifique também se existem impactos em parceiros como Wellhub/Gympass ou cobranças
              relacionadas à aula cancelada.
            </p>
          </>
        ),
      },
      {
        titulo: 'Acionar suporte',
        conteudo: (
          <>
            <p className="mb-2">
              Quando necessário, abrir chamado no portal de parceiros com todas as informações completas
              do caso, incluindo evidências e impacto operacional gerado.
            </p>
            <p className="mb-2">Informar:</p>
            <Lista
              itens={[
                'Unidade',
                'Data e horário cancelado',
                'Quantidade de alunos impactados',
                'Motivo do cancelamento',
                'Possíveis impactos financeiros ou operacionais',
              ]}
            />
          </>
        ),
      },
      {
        titulo: 'Retornar prazo',
        conteudo: (
          <>
            <p className="mb-2">
              Caso exista necessidade de análise interna, validar o prazo com o suporte responsável e
              manter o franqueado atualizado durante o acompanhamento.
            </p>
            <p className="m-0">
              Se houver impacto em parceiros ou ajustes sistêmicos, reforçar que o prazo pode variar
              conforme a validação necessária.
            </p>
          </>
        ),
      },
      {
        titulo: 'Alinhamento importante',
        conteudo: (
          <>
            <p className="mb-2">
              Orientar o franqueado sobre a importância de comunicar os alunos com antecedência sempre que
              possível, minimizando impactos operacionais e experiências negativas.
            </p>
            <p className="m-0">
              Reforçar também que cancelamentos recorrentes podem gerar impacto na experiência dos alunos
              e em validações de parceiros.
            </p>
          </>
        ),
      },
      {
        titulo: 'Acompanhar resolução',
        conteudo: (
          <>
            <p className="mb-2">
              Seguir acompanhando o caso até confirmação de que os alunos foram posicionados corretamente
              e que não existem pendências operacionais relacionadas ao cancelamento.
            </p>
            <p className="m-0">Após finalização, validar se a agenda da unidade foi normalizada corretamente.</p>
          </>
        ),
      },
    ],
  },
];

const PlaybookWellhub = () => (
  <ArtigoShell>
    <Capa eyebrow="Playbook interno" titulo="PLAYBOOK INTERNO WELLHUB — MANUAL OPERACIONAL COMPLETO" />

    <Secao>
      <SecHead titulo="REGRAS GERAIS" />
      <div className="space-y-3">
        <ItemCheck>Toda divergência deve ser validada no relatório, sistema e no portal.</ItemCheck>
        <ItemCheck>Retroativos devem ser solicitados no portal de parceiros quando aplicável.</ItemCheck>
        <ItemCheck>Casos financeiros devem ser acompanhados até a correção.</ItemCheck>
      </div>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="CENÁRIOS DETALHADOS/ FLUXO DE TRATATIVA" />
      <div className="space-y-9">
        {FLUXO.map((cenario) => (
          <div key={cenario.titulo}>
            <div className="mb-5">
              <FeatRow icon={cenario.icon} titulo={cenario.titulo} />
            </div>
            <div className="pl-1">
              {cenario.passos.map((passo, i) => (
                <Passo key={passo.titulo} numero={i + 1} titulo={passo.titulo}>
                  {passo.conteudo}
                </Passo>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Secao>

    <Secao tom="rosa">
      <SecHead titulo="MENSAGENS PADRÃO" />
      <div className="space-y-8">
        {MENSAGENS.map((grupo) => (
          <div key={grupo.tema}>
            <h3 className="mb-3 text-[1.1rem] font-extrabold" style={{ color: '#1F2328' }}>
              {grupo.tema}
            </h3>
            <div className="space-y-3">
              {grupo.itens.map((m) => (
                <MensagemCopiavel key={m.rotulo} rotulo={m.rotulo} texto={m.texto} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Secao>

    <Secao>
      <SecHead titulo="Regras:" />

      <Cartao className="mb-5">
        <h3 className="mb-3 text-[1.1rem] font-extrabold" style={{ color: '#1F2328' }}>
          Cancelamento
        </h3>
        <P>
          Se o aluno cancelar com mais de 6h, ele sai da agenda e recebe o check in dele de volta.
          Cancelamento a tempo
        </P>
        <h4 className="mb-2 mt-5 text-[1.02rem] font-extrabold" style={{ color: '#1F2328' }}>
          Cancelamento tardio:
        </h4>
        <P>
          De 6h a 3h: O aluno sai da agenda mas a unidade recebe como cancelamento tardio e o professor
          não recebe
        </P>
        <P>
          Menos de 3h: O aluno permanece na agenda ( o que inclui falta pelo aluno ou pela
          unidade/professor) e a unidade e o professor recebe por cancelamento tardio
        </P>
      </Cartao>

      <Cartao className="mb-5">
        <h3 className="mb-3 text-[1.1rem] font-extrabold" style={{ color: '#1F2328' }}>
          Agendamento:
        </h3>
        <P>
          Agendamento padrão sempre pelo aplicativo do wellhub, em casos de check ins sem esse padrão a
          unidade se coloca a possibilidade de não receber o valor ou receber um valor menor e pagar
          royalties em um valor a mais.
        </P>
      </Cartao>

      <Cartao>
        <h3 className="mb-3 text-[1.1rem] font-extrabold" style={{ color: '#1F2328' }}>
          Check In retroativo
        </h3>
        <P>
          Sempre solicitar o retroativo até o dia 2 do mês subsequente, após isso o wellhub recusa todos
          automaticamente e é necessário abrir chamado com eles
        </P>
      </Cartao>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="Check-in do Wellhub não retornou após cancelamento" />

      <h4 className="mb-1.5 text-[1.02rem] font-extrabold" style={{ color: '#1F2328' }}>
        Objetivo
      </h4>
      <P>
        Orientar a equipe sobre como agir quando um aluno informa que o check-in do Wellhub/Gympass não
        foi devolvido após o cancelamento da aula.
      </P>

      <h4 className="mb-1.5 mt-5 text-[1.02rem] font-extrabold" style={{ color: '#1F2328' }}>
        Contexto do problema
      </h4>
      <P>
        Esse é um dos chamados mais recorrentes da operação, principalmente em horários de pico e aulas
        experimentais.
      </P>
      <P>O aluno normalmente relata que cancelou a aula, mas o check-in não retornou para utilização.</P>
      <P>A primeira análise deve sempre considerar o horário em que o cancelamento foi realizado.</P>

      <h4 className="mb-1.5 mt-5 text-[1.02rem] font-extrabold" style={{ color: '#1F2328' }}>
        Regra operacional oficial
      </h4>
      <P>O Wellhub possui regra sistêmica para devolução automática de check-in:</P>
      <Lista
        itens={[
          'Cancelamento realizado com mais de 3 horas de antecedência → check-in retorna automaticamente',
          'Cancelamento realizado com menos de 3 horas antes da aula → check-in não retorna automaticamente quando cancelado pelo aluno',
        ]}
      />
      <div className="mt-3">
        <P>
          Essa devolução ocorre diretamente pela plataforma e não depende de ação manual da unidade.
        </P>
      </div>

      <h4 className="mb-1.5 mt-5 text-[1.02rem] font-extrabold" style={{ color: '#1F2328' }}>
        Causa raiz mais comum
      </h4>
      <P>
        Na maior parte dos casos, o aluno cancela próximo ao horário da aula e entende que o crédito
        deveria retornar normalmente.
      </P>
      <P>
        Nesses cenários, o comportamento está relacionado à política do parceiro e não necessariamente a
        falha operacional da unidade.
      </P>

      <h4 className="mb-1.5 mt-5 text-[1.02rem] font-extrabold" style={{ color: '#1F2328' }}>
        Exceções operacionais
      </h4>
      <P>Existem situações em que a aula não ocorreu por motivos internos da unidade, como:</P>
      <Lista
        itens={[
          'Falta de energia',
          'Problema estrutural',
          'Professor indisponível',
          'Interrupção emergencial da operação',
        ]}
      />
      <div className="mt-3">
        <P>Nesses casos, o aluno não deve ser penalizado.</P>
      </div>

      <h4 className="mb-1.5 mt-5 text-[1.02rem] font-extrabold" style={{ color: '#1F2328' }}>
        Procedimento da unidade
      </h4>
      <P>
        Se o cancelamento ocorreu fora do prazo: Orientar o aluno sobre a política oficial do parceiro.
      </P>
      <P>Se houve falha operacional da unidade:</P>
      <Lista
        itens={[
          'Registrar ocorrência',
          'Validar internamente com coordenação',
          'Orientar o aluno a acionar o suporte do Wellhub',
          'Documentar o caso na Purepedia/histórico da unidade',
        ]}
      />

      <h4 className="mb-1.5 mt-5 text-[1.02rem] font-extrabold" style={{ color: '#1F2328' }}>
        Orientação preventiva
      </h4>
      <P>
        Esse alinhamento deve ser informado no momento do agendamento da aula para reduzir atritos
        futuros e evitar divergências de expectativa do aluno.
      </P>
    </Secao>

    <Secao>
      <SecHead titulo="Situações recorrentes" />
      <div className="space-y-3">
        <Faq pergunta="Excesso de aulas experimentais no mesmo horário">
          <p className="mb-1.5 font-bold">Objetivo</p>
          <P>
            Padronizar a gestão da agenda para preservar experiência, conversão e qualidade operacional.
          </P>
          <p className="mb-1.5 mt-4 font-bold">Contexto do problema</p>
          <P>
            Um dos principais gargalos operacionais é a concentração excessiva de alunos experimentais em
            horários específicos.
          </P>
          <P>Já foram identificados cenários com:</P>
          <Lista
            itens={[
              '3 ou mais experimentais simultâneos',
              'Professor sozinho em turma cheia',
              'Sobrecarga operacional durante a condução da aula',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Impacto operacional</p>
          <P>O excesso de experimentais no mesmo horário impacta diretamente:</P>
          <Lista
            itens={[
              'Experiência do lead',
              'Percepção de exclusividade',
              'Taxa de conversão',
              'Qualidade da aula',
              'Atenção do professor aos alunos ativos',
            ]}
          />
          <div className="mt-3">
            <P>
              O professor acaba dividindo atenção entre explicação do método, acolhimento inicial,
              correções técnicas e condução da turma regular.
            </P>
          </div>
          <p className="mb-1.5 mt-4 font-bold">Regra operacional recomendada</p>
          <P>Manter o limite máximo de até 2 experimentais por horário.</P>
          <P>Essa prática ajuda a preservar:</P>
          <Lista
            itens={[
              'Conversão comercial',
              'Experiência premium',
              'Qualidade operacional',
              'Padrão da marca',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Sinais de alerta</p>
          <P>A agenda deve ser revisada quando houver:</P>
          <Lista
            itens={[
              'Alta taxa de no-show',
              'Queda na conversão',
              'Reclamações do professor',
              'Sensação de turma lotada',
              'Dificuldade operacional durante a aula',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Procedimento da unidade</p>
          <P>Antes de confirmar experimentais, a equipe deve validar:</P>
          <Lista
            itens={[
              'Quantidade de leads já agendados no horário',
              'Capacidade operacional do professor',
              'Ocupação da turma',
              'Perfil dos alunos presentes',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Orientação preventiva</p>
          <P>
            Organizar experimentais de forma distribuída reduz desgaste operacional e melhora
            significativamente a experiência do lead durante a primeira aula.
          </P>
        </Faq>

        <Faq pergunta="Lead fez aula experimental e recebeu promoção automática">
          <p className="mb-1.5 font-bold">Objetivo</p>
          <P>
            Orientar a condução comercial quando leads recebem campanhas automáticas após realizarem aula
            experimental.
          </P>
          <p className="mb-1.5 mt-4 font-bold">Contexto do problema</p>
          <P>Situação recorrente entre marketing e operação.</P>
          <P>
            Após realizar a aula experimental, o lead recebe campanhas automáticas contendo descontos
            promocionais, como:
          </P>
          <Lista
            itens={[
              '50% OFF',
              'Condições especiais',
              'Campanhas de recuperação',
              'Aulas avulsas promocionais',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Impacto operacional</p>
          <P>
            Esse cenário pode gerar conflito comercial porque a unidade muitas vezes já está em negociação
            ativa com o lead.
          </P>
          <P>O aluno passa a comparar:</P>
          <Lista
            itens={['Oferta apresentada pela consultora', 'Oferta recebida automaticamente por e-mail']}
          />
          <div className="mt-3">
            <P>Isso pode gerar:</P>
          </div>
          <Lista
            itens={[
              'Quebra de autoridade comercial',
              'Redução da conversão manual',
              'Perda de margem',
              'Atrito operacional com franqueados',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Procedimento da unidade</p>
          <P>Confirmar campanha ativa — validar junto ao time de marketing:</P>
          <Lista
            itens={['Nome da campanha', 'Público elegível', 'Período de validade', 'Regras aplicáveis']}
          />
          <div className="mt-3">
            <P>Ajustar discurso comercial</P>
            <P>A unidade não deve invalidar a campanha recebida pelo lead.</P>
            <P>
              O ideal é conduzir a negociação integrando a oferta promocional ao atendimento consultivo da
              unidade.
            </P>
          </div>
          <p className="mb-1.5 mt-4 font-bold">Orientação preventiva</p>
          <P>
            Sempre alinhar campanhas ativas com a operação para reduzir conflitos comerciais e garantir
            maior previsibilidade no fechamento das vendas.
          </P>
        </Faq>

        <Faq pergunta="Professor sobrecarregado por excesso de leads">
          <p className="mb-1.5 font-bold">Objetivo</p>
          <P>
            Orientar a redistribuição operacional da agenda para preservar qualidade das aulas e
            experiência dos alunos.
          </P>
          <p className="mb-1.5 mt-4 font-bold">Diagnóstico</p>
          <P>Quando o professor sinaliza desgaste operacional, normalmente existem fatores como:</P>
          <Lista
            itens={[
              'Muitos experimentais simultâneos',
              'Alunos em níveis muito diferentes',
              'Agenda desbalanceada',
              'Excesso de demandas no mesmo horário',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Impacto operacional</p>
          <P>Esse cenário pode gerar:</P>
          <Lista
            itens={[
              'Queda na qualidade da aula',
              'Experiência negativa do aluno',
              'Menor retenção',
              'Sobrecarga do professor',
              'Desgaste operacional da equipe',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Procedimento da unidade</p>
          <P>A gestão da agenda deve considerar:</P>
          <Lista
            itens={[
              'Distribuição equilibrada por professor',
              'Perfil técnico dos alunos',
              'Quantidade de experimentais',
              'Nível das turmas',
              'Capacidade operacional do horário',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Solução estrutural</p>
          <P>
            Reorganizar os agendamentos de forma estratégica reduz desgaste da equipe e melhora a
            qualidade percebida pelos alunos.
          </P>
          <p className="mb-1.5 mt-4 font-bold">Orientação preventiva</p>
          <P>
            Acompanhar sinais de sobrecarga operacional ajuda a evitar impactos em conversão, retenção e
            satisfação dos alunos.
          </P>
        </Faq>

        <Faq pergunta="Aluno não compareceu à experimental">
          <p className="mb-1.5 font-bold">Objetivo</p>
          <P>Padronizar o fluxo preventivo para redução de no-show em aulas experimentais.</P>
          <p className="mb-1.5 mt-4 font-bold">Contexto do problema</p>
          <P>
            O não comparecimento em aulas experimentais representa uma das maiores perdas de conversão da
            operação.
          </P>
          <p className="mb-1.5 mt-4 font-bold">Causa principal</p>
          <P>
            Na maioria dos casos, o problema está relacionado à ausência de confirmação ativa do
            agendamento.
          </P>
          <p className="mb-1.5 mt-4 font-bold">Fluxo operacional ideal</p>
          <div className="mb-4 space-y-2.5">
            <ItemCheck>D-1 — Enviar mensagem de confirmação da aula.</ItemCheck>
            <ItemCheck>D0, período da manhã — Realizar reconfirmação do comparecimento.</ItemCheck>
            <ItemCheck>2 horas antes da aula — Enviar o lembrete final do agendamento.</ItemCheck>
          </div>
          <p className="mb-1.5 mt-4 font-bold">Impacto operacional</p>
          <P>A ausência de confirmação pode gerar:</P>
          <Lista
            itens={[
              'Perda de conversão',
              'Horários ociosos',
              'Desorganização operacional',
              'Redução de aproveitamento da agenda',
            ]}
          />
          <p className="mb-1.5 mt-4 font-bold">Procedimento da unidade</p>
          <P>
            A equipe deve manter contato ativo com o lead antes da aula experimental e acompanhar
            possíveis sinais de desistência ou ausência.
          </P>
          <p className="mb-1.5 mt-4 font-bold">Orientação preventiva</p>
          <P>
            Fluxos simples de confirmação aumentam significativamente a presença em aulas experimentais e
            ajudam na conversão comercial da unidade.
          </P>
        </Faq>
      </div>
    </Secao>
  </ArtigoShell>
);

export default PlaybookWellhub;
