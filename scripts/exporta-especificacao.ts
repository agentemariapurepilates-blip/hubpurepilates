/**
 * Exporta a especificação COMPLETA da mídia paga, para quem for reconstruí-la
 * no SmartAds.
 *
 * Uso:
 *   npx tsx scripts/exporta-especificacao.ts
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE É GERADO, E NÃO ESCRITO À MÃO
 * ────────────────────────────────────────────────────────────────────────────
 * A taxonomia, os formatos de nome, as fontes e as regras saem de
 * `dados/cerebro.ts`, que é a fonte única do módulo. Um documento digitado à
 * mão começaria correto e envelheceria em silêncio — e quem estivesse do outro
 * lado implementaria a versão errada sem ter como saber.
 *
 * O que NÃO sai do código são as armadilhas: elas foram descobertas rodando
 * contra a conta real, e estão escritas aqui embaixo porque não existem como
 * dado em lugar nenhum. São a parte mais cara de reconstruir do zero.
 */

import { writeFileSync } from 'node:fs';
import { montarManual } from '../src/features/colaborador/midia-paga/lib/prompt-da-ia';
import { EIXOS, FONTES, FORMATOS, REGRAS } from '../src/features/colaborador/midia-paga/dados/cerebro';

const DESTINO = 'ESPECIFICACAO-MIDIA-PAGA.md';

/** O algoritmo de classificação, que é o coração do módulo. */
const CLASSIFICACAO = `
## Como decidir de que frente é uma campanha

Este é o algoritmo mais importante da especificação. Ele foi reescrito três
vezes contra a conta real, e cada regra abaixo existe porque a versão anterior
errou de um jeito específico.

\`\`\`
classificarFrente(nomeDaCampanha, nomeDoConjunto):

  1. Detectar a plataforma PELO FORMATO DO NOME:
       tem "|" ou começa com "["  →  Meta
       caso contrário             →  Google

  2. Ler o PÚBLICO do nome da campanha.
       É SEMPRE O ÚLTIMO SEGMENTO, tenha o nome 2, 3 ou 5 partes.
       Meta:   "[Rise] dco | always-on | apartadas"      → apartadas
               "[Rise] always-on | apartadas"            → apartadas
       Google: "rise_ao_search_cpa_institucional"        → institucional

  3. Se o público está no mapa PÚBLICO → FRENTE, devolver essa frente.

  4. Se o público é "todas" e o tipo está no mapa TIPO → FRENTE
     (só "dco" hoje), devolver essa frente.

  5. Se a campanha DECLAROU um público e ele NÃO está no mapa,
     PARAR AQUI e devolver null. Não continuar para o passo 6.

  6. Só quando o nome da campanha não diz nada: procurar os marcadores
     da frente no nome do conjunto, na ordem em que as frentes aparecem
     no manual (mais específica antes da mais genérica).
\`\`\`

### As quatro armadilhas

**1. A frente vem da CAMPANHA, nunca do conjunto.**
Um conjunto chamado \`dco | interesses | leads | sacoma\` dentro da campanha
\`[Rise] always-on | apartadas\` é **Apartadas**, não DCO. O "dco" ali é o
formato de compra; a frente é para onde a verba foi. Ler pelo conjunto
classificaria toda a verba das unidades como DCO genérico.

**2. O passo 5 não pode ser pulado.**
A campanha \`[Rise] venda | always-on | store\` tem o conjunto
\`always-on | store | rmkt\`. Sem a parada, o marcador "rmkt" a jogaria em
Remarketing — que no manual é uma frente de **aula experimental**. A verba da
loja entraria no eixo errado, com aparência de número certo. Público declarado
e não mapeado é uma decisão pendente, não um caso a adivinhar.

**3. "advantage" NÃO identifica aula experimental.**
É a segmentação automática do Meta e aparece em qualquer frente, inclusive nos
conjuntos da Academy (\`belenzinho | sao-paulo | advantage | aberto-21-a-40-anos\`).
Usá-la como marcador migraria a verba da Academy para o eixo de aula
experimental.

**4. O público é o último segmento, e não a terceira posição.**
Em agosto/2026 a agência renomeou \`[Rise] dco | always-on | apartadas\` para
\`[Rise] always-on | apartadas\`. Um leitor que esperasse exatamente três partes
devolveria \`null\` e faria **as apartadas inteiras sumirem do manual** — R$ 4.400
classificados como "fora do manual" sem nada ter mudado na operação, só no nome.
O nome de duas partes continua sendo sinalizado como fora da convenção; o que
não pode é a verba sumir do eixo por causa disso.
`;

/** O que a operação real ensinou sobre os dados. Nada disto está no código. */
const REALIDADE_DOS_DADOS = `
## O estado real das fontes (25/08/2026)

Esta seção é o que mais economiza tempo de quem for reconstruir. Cada linha
custou uma investigação.

### Meta Ads — funciona, mas cuidado com o grão e com os eventos

- A Graph API entrega no nível de **conjunto** (\`level=adset\`), que é o grão
  em que o manual classifica. O SmartAds guarda só **campanha**.
- \`/{adset_id}/leads\` **não existe**. Os caminhos válidos são
  \`/{form_id}/leads\` e \`/{ad_id}/leads\`.
- \`/{form_id}/leads\` **exige Page Access Token**. Com token de usuário a
  resposta vem \`{"data":[]}\` — sem erro, sem aviso, apenas vazia. É o pior
  tipo de falha, porque parece "não há leads".
- O Meta devolve **o mesmo evento sob mais de vinte \`action_type\`**, um por
  janela de atribuição e origem. Somar todos multiplica o resultado por dez.
  Os três que valem:
  - \`complete_registration\` → agendamento de aula experimental
  - \`onsite_conversion.lead_grouped\` → lead de formulário (RH, Academy, franquias)
  - \`purchase\` → compra (Pure Pass)
- **\`lead\` NÃO serve**: soma o lead de formulário com o lead de pixel do site
  e conta a mesma pessoa duas vezes.
- O texto do anúncio mora em **três lugares diferentes**, e ler só um perde a
  maior parte: \`creative.body\`/\`title\`, \`object_story_spec.link_data\` (ou
  \`video_data\`), e \`asset_feed_spec\` (DCO, onde os textos são listas de
  variações).

### Google Ads — só via SmartAds, e só campanha

- Não há acesso à API do Google Ads. A única fonte é a tabela \`insights\` do
  SmartAds (projeto \`tobdedvnqaukpmnedabt\`), com \`platform='google'\`.
- O grão é **campanha**. Não há grupo de anúncios.
- \`conversions\` vem como **um inteiro só**, sem quebra por tipo. Não dá para
  separar agendamento de lead. A tela precisa dizer isso, em vez de deixar
  parecer que a quebra existe e foi omitida.
- **A carga estava parada desde 12/08/2026** (último dia: 11/08), enquanto a do
  Meta seguia atualizando. Cargas independentes param de forma independente.

### Google Analytics 4 — existe e está QUEBRADO

A tabela \`ga4_metrics\` do SmartAds tem as colunas certas (sessões, canal,
bounce, duração, conversões), mas a coleta colapsou depois de abril/2026:

| mês | sessões | conversões |
|---|---|---|
| abr/26 | 3.116 (em 12 dias) | 989 |
| mai/26 | 130 | 4 |
| jun/26 | 108 | 0 |
| jul/26 | 96 | 0 |
| ago/26 | 93 | 2 |

Um site com R$ 250 mil/mês de mídia não tem 93 sessões no mês. O \`bounce_rate\`
vem 100% em quase toda linha, o que indica evento não disparando.

**Não ligar o GA4 ao relatório enquanto isso não for consertado.** Ele
colocaria "93 sessões" ao lado de "5 milhões de impressões" e chamaria as duas
de dado. Isso é medição para consertar, não integração para fazer.

### A armadilha que quase passou

O relatório do Hub lia \`dpp_ad_set_daily_metrics\`, tabela do próprio Hub. Ela
tinha métrica de **6 dos 112 conjuntos**, todos de uma campanha só, e somava
**R$ 1.437 em agosto contra R$ 65.315 de gasto real**.

O relatório não quebrava. Analisava 2% da conta e mostrava o resultado com a
mesma cara de quem viu tudo — nada na tela denunciava. Qualquer reconstrução
precisa de uma conferência que compare o total lido com o total da plataforma,
e que **falhe alto** quando divergirem.
`;

/** A avaliação contra o PDM, que hoje vive no Dashboard do Hub. */
const AVALIACAO = `
## Avaliação contra o PDM (plano de mídia)

O PDM é a planilha que a agência entrega todo mês
(\`RISE_PURE-PILATES_PDM_BRANDPERFORMANCE_Q425Q126_11319\`), com verba, alcance,
impressões, cliques, agendamentos e leads planejados por campanha.

### Como ler a planilha

- Cada mês é uma aba. A **ordem das abas** é o que dá o mês: a aba de junho tem
  "MAIO" escrito no cabeçalho da verba, resquício de quem copiou o mês anterior.
  Confiar nesse rótulo colocaria junho inteiro em maio.
- A linha logo **abaixo** do cabeçalho é o total declarado.
- Depois das campanhas vem a tabela de pagamento, que também tem nome de
  veículo e valores. O corte limpo é a **ETAPA 4S**: toda campanha tem uma das
  quatro (Searching, Scrolling, Shopping, Streaming) e nenhuma linha de
  pagamento tem. Com esse filtro os cinco meses fecham exatamente com o total
  declarado.
- **\`bruto\` = \`líquido\` + comissão da agência (20%)**. O líquido é o que vira
  mídia na plataforma; é ele que compara com o gasto que o Meta reporta. Usar o
  bruto faria toda campanha parecer 20% abaixo do plano.

### Regras da avaliação

1. **Comparar plataforma com plataforma.** A fatia Meta do plano contra o
   realizado do Meta; a fatia Google contra o Google. Comparar o plano inteiro
   com um realizado de uma plataforma só faz todo mês parecer 40% abaixo da
   meta — e o erro é invisível, porque a divisão dá um número plausível.
2. **Mês em curso compara com a fatia dos dias corridos**, não com o mês cheio.
   Senão todo dia 5 pareceria catástrofe.
3. **Cada plataforma para no seu próprio último dia.** O TOTAL usa o horizonte
   comum (o menor último-dia). Somar 23 dias de Meta com 11 de Google daria um
   "mês" que não é de mês nenhum.
4. **A semana é derivada, o mês é planejado.** O PDM não planeja semana: a meta
   de cada uma é a fatia proporcional aos dias dela que caem dentro do mês. A
   semana que atravessa a virada entra só pelos dias do mês avaliado.
5. **Gastar acima do plano é desvio, não acerto.** 130% do planejado está tão
   fora do plano quanto 70%. Pintar o excesso de verde ensina a ler estouro de
   verba como sucesso.
6. **Faixa larga para o alarme.** Até 10% de diferença é ruído de veiculação.
   Vermelho só abaixo de 70%.

### O achado que a avaliação produziu

Nos cinco meses medidos (abr–ago/2026), o padrão é constante e vale como teste
de sanidade para qualquer reconstrução:

| mês | Meta | Google | total |
|---|---|---|---|
| ago (até 11/08) | 55% | 118% | 88% |
| jul | 67% | 122% | 91% |
| jun | 85% | 106% | 94% |
| mai | 81% | 106% | 90% |
| abr | 72% | 130% | 92% |

**O Meta gasta abaixo do planejado e o Google acima, e os dois se compensam.**
Olhando só o Meta, o plano parece rodar a 54–85%; com as duas plataformas, roda
a 88–94%. A conclusão inverte. É por isso que a regra 1 existe.
`;

/** O relatório: quatro seções que respondem quatro perguntas. */
const RELATORIO = `
## Estrutura do relatório

Quatro seções, nesta ordem, cada uma respondendo **uma** pergunta. Escritas
deterministicamente a partir dos achados — a IA redige em cima delas, não as
descobre.

1. **Onde foi o dinheiro** — a verba por eixo e por frente, com a fatia de cada
   um. Responde "para onde foi".
2. **O que está fora do manual** — campanhas e conjuntos que não caem em
   nenhuma frente. Responde "o que ninguém está olhando".
3. **O que precisa de decisão** — os achados das regras automáticas, ordenados
   por dinheiro envolvido. Responde "o que fazer agora".
4. **O que não deu para saber** — as fontes ausentes e o que fica sem resposta
   sem elas. Responde "de quanto disto eu posso confiar".

### A regra que não pode ser perdida

**As fontes aparecem ANTES dos números.** Quem abre um relatório de mídia começa
lendo o total; se a informação de que uma fonte não está conectada vier depois,
ela chega tarde demais para mudar a leitura do total.

O mesmo vale para o PDF: as ressalvas vão na **primeira página**, não em rodapé.
Um PDF viaja — vai para o WhatsApp, para o e-mail da diretoria, para a reunião
com a agência — e chega lá sem a tela por perto. O que não estiver impresso some
no caminho.
`;

function principal() {
  const hoje = new Date().toISOString().slice(0, 10);

  const documento = `# Especificação — Mídia paga Pure Pilates

> Documento de transferência. A mídia paga saiu do Hub em ${hoje} e passa a ser
> responsabilidade do SmartAds. Tudo o que o módulo do Hub sabia está aqui.
>
> **Gerado por \`scripts/exporta-especificacao.ts\`** a partir de
> \`src/features/colaborador/midia-paga/dados/cerebro.ts\`, que era a fonte única
> do módulo. As seções sobre armadilhas e estado dos dados foram escritas à mão,
> porque descrevem o que a operação real ensinou e não existem como dado.

## Sumário

- **O manual** — os ${EIXOS.length} eixos e as ${EIXOS.flatMap((e) => e.frentes).length} frentes, com objetivo, KPI, regras de operação e erros comuns de cada uma.
- **Classificação** — o algoritmo que decide a frente de uma campanha, e as quatro armadilhas.
- **Estado real das fontes** — o que funciona, o que está quebrado, e o que parece funcionar e não funciona.
- **Avaliação contra o PDM** — como comparar plano e realizado, mês a mês e semana a semana.
- **Estrutura do relatório** — as quatro seções e a regra das fontes antes dos números.

Números de referência: ${FORMATOS.length} formatos de nome, ${FONTES.length} fontes previstas, ${REGRAS.length} regras conferidas automaticamente.

---

${montarManual()}

---

${CLASSIFICACAO}

---

${REALIDADE_DOS_DADOS}

---

${AVALIACAO}

---

${RELATORIO}

---

## Scripts que acompanham

Estes scripts ficaram no Hub e podem ser portados. Todos leem credenciais de
\`.env.local\` (nunca versionado).

| script | o que faz |
|---|---|
| \`atualiza-desempenho.mjs\` | Meta por conjunto (Graph API) + Google por campanha (SmartAds) |
| \`atualiza-realizado.mjs\` | Meta e Google, dia a dia, para a avaliação contra o PDM |
| \`atualiza-criativos.mjs\` | os textos de todos os anúncios, com detecção de defeitos |
| \`gera-pdm.mjs\` | lê a planilha da Rise e gera os meses planejados |
| \`exporta-especificacao.ts\` | gera este documento |

## O que fica pendente do outro lado

1. **Religar a carga do Google no SmartAds** — parada desde 12/08/2026.
2. **Consertar a coleta do GA4** — sem isso, um terço da especificação
   (comportamento pós-clique) continua sem resposta.
3. **Definir as faixas de referência.** Hoje quase toda frente diz "a sede ainda
   não definiu meta". Sem faixa, o relatório compara com a mediana do próprio
   período e avisa que a meta não existe — o que é honesto, mas não substitui
   uma meta.
4. **Decidir sobre "franquias" e o vídeo de awareness do Google.** As duas rodam
   na conta (R$ 3.700 e R$ 8.377 em agosto) e não estão em nenhum dos três
   eixos. Ficam como "fora do manual" até alguém decidir.
`;

  writeFileSync(DESTINO, documento, 'utf8');
  console.log(`✓ ${DESTINO} — ${Math.round(documento.length / 1024)} KB`);
  console.log(`  ${EIXOS.length} eixos, ${EIXOS.flatMap((e) => e.frentes).length} frentes, ${REGRAS.length} regras`);
}

principal();
