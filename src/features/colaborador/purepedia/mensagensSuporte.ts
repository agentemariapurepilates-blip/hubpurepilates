/**
 * Mensagens padrão do suporte operacional — fonte única.
 *
 * O mesmo texto aparece em dois materiais do Drive: dentro do "PLAYBOOK INTERNO
 * WELLHUB" (seção MENSAGENS PADRÃO, com os três temas) e no documento avulso
 * "Mensagens Padrão - Suporte Operacional" (só os dois últimos temas). Conferido:
 * são idênticos palavra por palavra. Ficam aqui pra não existirem duas cópias
 * que possam divergir — cada artigo escolhe os grupos que o SEU documento tem.
 *
 * Texto transcrito literalmente. A única limpeza foi remover os escapes de
 * markdown vindos da conversão do .docx (\! \[ \] \-).
 */

export interface MensagemPadrao {
  rotulo: string;
  texto: string;
}

export interface GrupoMensagens {
  tema: string;
  itens: MensagemPadrao[];
}

/** Só no Playbook Interno Wellhub. */
export const MSG_DIVERGENCIA: GrupoMensagens = {
  tema: 'Divergência de valores e royalties',
  itens: [
    {
      rotulo: 'Mensagem WhatsApp para unidade',
      texto: `Olá, tudo bem?

Para conseguirmos validar a divergência informada, preciso que seja enviado o relatório do sistema e do portal de parceiros para análise.

Peço também que sinalize quais valores apresentam divergência, informando aluno, data e, se possível, o plano relacionado. Assim conseguimos seguir com a validação interna e acionamento do suporte, caso necessário.`,
    },
    {
      rotulo: 'Mensagem para suporte',
      texto: `Olá!

Precisamos de apoio na análise de divergência de valores/royalties da unidade [NOME DA UNIDADE].

Detalhes identificados:
- Aluno:
- Data:
- Plano:
- Valor divergente:
- Evidência anexada:

A unidade informou divergência entre sistema e portal de parceiros. Conseguem validar, por gentileza?`,
    },
    {
      rotulo: 'Mensagem de acompanhamento',
      texto: `Olá! Passando para informar que o caso segue em análise junto ao suporte responsável.

Ainda estamos aguardando retorno da validação das divergências apontadas, mas seguimos acompanhando internamente e qualquer atualização eu te posiciono por aqui.`,
    },
  ],
};

/** Nos dois documentos. */
export const MSG_WELLHUB_NAO_LIBERADO: GrupoMensagens = {
  tema: 'Wellhub não liberado',
  itens: [
    {
      rotulo: 'Mensagem WhatsApp para unidade',
      texto: `Olá, tudo bem?

Conseguimos identificar que a integração do Wellhub não foi finalizada corretamente, por isso o serviço permanece indisponível no momento.

Já estamos seguindo com a validação interna, mas preciso que envie prints do erro apresentado e informe desde quando o problema começou.`,
    },
    {
      rotulo: 'Mensagem para suporte',
      texto: `Olá!

Precisamos de apoio na validação de integração Wellhub não finalizada da unidade [NOME DA UNIDADE].

Detalhes do caso:
- Data do início do problema:
- Erro apresentado:
- Impacto operacional:
- Evidências anexadas:

A unidade informa que o Wellhub permanece indisponível devido à integração não concluída. Conseguem verificar, por gentileza?`,
    },
    {
      rotulo: 'Mensagem de acompanhamento',
      texto: `Olá!

O caso segue em acompanhamento junto ao suporte responsável pela integração do Wellhub.

Ainda aguardamos a finalização da validação técnica, mas continuo acompanhando internamente e te atualizo assim que tivermos novidades.`,
    },
  ],
};

/** Nos dois documentos. */
export const MSG_INSTABILIDADE: GrupoMensagens = {
  tema: 'Instabilidade sistêmica',
  itens: [
    {
      rotulo: 'Mensagem WhatsApp para unidade',
      texto: `Olá, tudo bem?

Recebi a sinalização sobre a instabilidade no sistema. Para seguirmos com a validação, preciso que informe qual funcionalidade foi impactada, horário aproximado do ocorrido e, se possível, envie prints ou vídeos do erro apresentado.`,
    },
    {
      rotulo: 'Mensagem para suporte',
      texto: `Olá!

Precisamos de apoio na análise de uma instabilidade sistêmica reportada pela unidade [NOME DA UNIDADE].

Informações do caso:
- Horário aproximado:
- Funcionalidade impactada:
- Mensagem de erro:
- Impacto operacional:
- Evidências anexadas:

Conseguem validar se existe ocorrência identificada ou previsão de normalização?`,
    },
    {
      rotulo: 'Mensagem de acompanhamento',
      texto: `Olá!

A instabilidade já foi direcionada para o time responsável e seguimos acompanhando a normalização internamente.

Assim que tivermos novas informações ou previsão de estabilização eu te atualizo por aqui.`,
    },
  ],
};
