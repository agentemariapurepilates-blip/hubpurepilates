# Especificação — Mídia paga Pure Pilates

> Documento de transferência. A mídia paga saiu do Hub em 2026-08-25 e passa a ser
> responsabilidade do SmartAds. Tudo o que o módulo do Hub sabia está aqui.
>
> **Gerado a partir de `midia-paga/dados/cerebro.ts`**, a fonte única do
> módulo, no commit imediatamente anterior à remoção — o gerador e a fonte
> saíram do Hub junto com o resto. Para ver o código que produziu isto,
> `git show caf4dca:scripts/exporta-especificacao.ts`.
>
> As seções sobre armadilhas e estado dos dados foram escritas à mão, porque
> descrevem o que a operação real ensinou e não existem como dado em lugar
> nenhum. São a parte mais cara de reconstruir do zero.

## Sumário

- **O manual** — os 3 eixos e as 7 frentes, com objetivo, KPI, regras de operação e erros comuns de cada uma.
- **Classificação** — o algoritmo que decide a frente de uma campanha, e as quatro armadilhas.
- **Estado real das fontes** — o que funciona, o que está quebrado, e o que parece funcionar e não funciona.
- **Avaliação contra o PDM** — como comparar plano e realizado, mês a mês e semana a semana.
- **Estrutura do relatório** — as quatro seções e a regra das fontes antes dos números.

Números de referência: 5 formatos de nome, 3 fontes previstas, 7 regras conferidas automaticamente.

---

# Como a mídia paga da Pure Pilates deveria funcionar

Este é o manual da operação. Ele descreve a intenção de cada campanha. Use-o para julgar os números: um custo alto numa frente pode ser normal e numa outra pode ser o problema principal.

## Eixo: Aula experimental
Encher a agenda de aula experimental das unidades. É o topo do funil da rede: quem faz a experimental é quem vira matrícula.

### Agendamento de aula
- Objetivo: Levar quem mora perto de uma unidade a marcar a primeira aula, com dia e hora.
- Plataformas: meta, google-ads
- Público: Aberto por região da unidade, faixa de idade definida no conjunto.
- O que conta como resultado: Agendamento concluído (lead com data de aula escolhida).
- KPI principal: CPL
- Faixa de referência: a sede ainda não definiu meta. Compare com a mediana da própria frente no período e diga que a meta não existe.
- Responsável pelo número: agencia
- Precisa estar amarrada a uma unidade: sim
- Regras de operação:
  - Em 17/08/2026 esta frente não tinha nenhuma campanha própria na conta. Quando for criada, o público no nome é "agendamento" — é assim que o relatório vai reconhecê-la.
  - Cada conjunto atende UMA unidade e o nome traz a unidade e a região.
  - A faixa de idade fica explícita no nome do conjunto (ex.: aberto-21-a-40-anos).
  - Unidade sem agenda aberta não deve ter conjunto ativo — o lead chega e não tem onde marcar.
- Erros comuns:
  - Conjunto continua ativo depois da unidade lotar a agenda.
  - Duas versões do mesmo conjunto rodando ao mesmo tempo, dividindo o aprendizado.

### DCO
- Objetivo: Deixar o Meta montar a peça combinando criativos, para cobrir muitas unidades sem precisar de uma arte por unidade.
- Plataformas: meta
- Público: Interesses, recortado por unidade (leads) ou por estado (venda).
- O que conta como resultado: Lead de aula experimental.
- KPI principal: CPL
- Faixa de referência: a sede ainda não definiu meta. Compare com a mediana da própria frente no período e diga que a meta não existe.
- Responsável pelo número: agencia
- Precisa estar amarrada a uma unidade: sim
- Regras de operação:
  - Todo conjunto de DCO precisa estar vinculado a uma unidade no Hub — sem o vínculo, o gasto não aparece no painel da unidade e ninguém cobra o resultado.
  - O nome do conjunto termina com a unidade (leads) ou com o estado (venda).
  - DCO é o formato padrão da rede: quando existir DCO e conjunto manual para a mesma unidade, o manual é a exceção e precisa de justificativa.
- Erros comuns:
  - Conjunto de DCO sem vínculo com unidade: gasta e não é medido.
  - Criativos de unidades diferentes no mesmo conjunto.

### Remarketing
- Objetivo: Voltar em quem já demonstrou interesse — visitou o site, viu o vídeo, começou o formulário — e não terminou.
- Plataformas: meta, google-ads
- Público: Públicos de origem: tráfego do site, engajamento, base de leads.
- O que conta como resultado: Lead ou agendamento recuperado.
- KPI principal: CPL
- Faixa de referência: a sede ainda não definiu meta. Compare com a mediana da própria frente no período e diga que a meta não existe.
- Responsável pelo número: agencia
- Precisa estar amarrada a uma unidade: não
- Regras de operação:
  - Só faz sentido rodar com público de origem sendo alimentado — se a campanha de topo parar, o remarketing seca em poucos dias.
  - O custo por lead do remarketing tem que ser MENOR que o da prospecção. Se estiver maior, o público está pequeno demais ou saturado.
  - Frequência acima de 4 no período é sinal de saturação.
- Erros comuns:
  - Remarketing rodando sozinho, sem campanha de topo alimentando o público.
  - Mesma peça da prospecção — quem já viu vê de novo e ignora.

### Apartadas
- Objetivo: Verba separada por unidade, fora do bolo da rede, para unidade que precisa de reforço (inauguração, agenda vazia, praça nova).
- Plataformas: meta
- Público: Interesses no raio da unidade.
- O que conta como resultado: Lead de aula experimental da unidade que pagou.
- KPI principal: CPL
- Faixa de referência: a sede ainda não definiu meta. Compare com a mediana da própria frente no período e diga que a meta não existe.
- Responsável pelo número: sede
- Precisa estar amarrada a uma unidade: sim
- Regras de operação:
  - Uma unidade por conjunto, sempre. É verba da unidade, então o resultado é dela.
  - Tem começo e fim: apartada que roda meses seguidos virou verba fixa e deveria estar no orçamento da rede.
  - O custo por lead é comparado com o das outras unidades do mesmo período, não com o histórico da própria unidade — praça nova sempre começa cara.
- Erros comuns:
  - Conjunto apartado esquecido ligado depois do período contratado.
  - Unidade sem vínculo no Hub: o franqueado paga e não vê o número.

## Eixo: Leads
Captar gente que não é aluno: instrutor para as vagas das unidades e aluno para os cursos da Academy.

### Campanhas de RH
- Objetivo: Preencher vaga de instrutor de pilates numa unidade específica.
- Plataformas: meta
- Público: Cargo e formação, no raio da unidade.
- O que conta como resultado: Candidatura (lead com currículo ou contato).
- KPI principal: CPL
- Faixa de referência: a sede ainda não definiu meta. Compare com a mediana da própria frente no período e diga que a meta não existe.
- Responsável pelo número: sede
- Precisa estar amarrada a uma unidade: sim
- Regras de operação:
  - A campanha existe enquanto a vaga existe. Vaga preenchida, conjunto desligado — é o erro mais caro e mais comum desta frente.
  - O nome do conjunto traz unidade, região e o cargo.
  - Volume importa mais que custo: é melhor 40 candidatos a R$ 12 que 8 a R$ 6.
- Erros comuns:
  - Conjunto ativo semanas depois da vaga fechada.
  - Conjunto duplicado por causa de cópia manual (nomes com "— Cópia").

### Academy
- Objetivo: Vender curso e workshop da Pure Pilates Academy.
- Plataformas: meta, google-ads
- Público: Instrutores e estudantes de pilates, nacional.
- O que conta como resultado: Lead de curso (formulário) ou inscrição no workshop.
- KPI principal: CPL
- Faixa de referência: a sede ainda não definiu meta. Compare com a mediana da própria frente no período e diga que a meta não existe.
- Responsável pelo número: sede
- Precisa estar amarrada a uma unidade: não
- Regras de operação:
  - Workshop tem data: a campanha sobe com antecedência combinada e desce no dia do evento.
  - Curso contínuo (lead-ad e lead-site) roda always-on e é avaliado por mês.
  - lead-ad (formulário dentro do Meta) e lead-site (formulário no site) são comparados entre si: o formulário nativo costuma ser mais barato e converter menos.
- Erros comuns:
  - Campanha de workshop rodando depois do evento.
  - Comparar o custo de lead-ad com o de lead-site sem olhar a conversão em matrícula.

## Eixo: Venda
Vender produto digital e físico direto, sem passar pela unidade.

### Pilates Play
- Objetivo: Vender assinatura do Pilates Play.
- Plataformas: meta, google-ads
- Público: Interesses, nacional, e remarketing de visitantes.
- O que conta como resultado: Assinatura paga.
- KPI principal: CPA
- Faixa de referência: a sede ainda não definiu meta. Compare com a mediana da própria frente no período e diga que a meta não existe.
- Responsável pelo número: sede
- Precisa estar amarrada a uma unidade: não
- Regras de operação:
  - Custo por aquisição é comparado com o ticket da assinatura, não com o CPL das outras frentes — é venda, não lead.
  - Precisa de conversão rastreada de ponta a ponta: sem o evento de compra chegando ao Meta e ao GA4, o número do painel é chute.
  - Prospecção e remarketing são lidos juntos: o remarketing rouba crédito da prospecção.
- Erros comuns:
  - Ler resultado do Meta e do GA4 como se fossem a mesma conta — as janelas de atribuição são diferentes e nunca vão bater.
  - Otimizar por clique em vez de compra.

## Como os nomes são construídos
- campanha — `[marca] tipo | contexto | público` (ex.: [Rise] dco | always-on | apartadas). Tipo é o formato de compra (dco, lead-ad, lead-site, venda, pure-pass, black-friday). Contexto diz se é always-on, de vendas ou de unidades. Público é a frente atendida.
- campanha-google — `marca_período_formato_modelo_público` (ex.: rise_ao_search_cpa_institucional). O Google não usa colchetes nem barras: os segmentos vêm com underscore. Período é ao (always-on) ou flight (tem data para acabar). Formato é search ou video. Modelo é cpa ou cpm. Como no Meta, o PÚBLICO é o último segmento, e é ele que decide a frente — "institucional" é a busca por marca e "pilates", o termo genérico; as duas levam ao agendamento da aula.
- conjunto — `dco | interesses | objetivo | destino` (ex.: dco | interesses | leads | sacoma). Objetivo é leads ou venda. Destino é a unidade (quando leads) ou o estado (quando venda).
- conjunto — `unidade | região | segmento | público` (ex.: penha | sao-paulo | cargos | instrutor-pilates). Segmento separa RH (cargos) de aula experimental (advantage). O público detalha o recorte.
- conjunto — `contexto | produto | público` (ex.: always-on | pilates play | interesses). Usado nas frentes que vendem produto e não têm unidade.

## O que cada fonte de dados responde
- Meta Ads: responde "Quanto custou cada lead, por conjunto e por unidade, e quanto foi gasto por dia." e NÃO responde "Se o lead virou matrícula. O Meta só sabe o que aconteceu dentro do anúncio e do pixel.".
- Google Ads: responde "Quanto custou a busca por marca e por termo genérico, e quantas conversões trouxe." e NÃO responde "A quebra por grupo de anúncios, e o que é agendamento dentro do total de conversões — o Google devolve um número só. Comportamento depois do clique também não: isso é o GA4.".
- Google Analytics 4: responde "O que a pessoa fez depois do clique: página, tempo, caminho até o agendamento, e por qual canal ela chegou." e NÃO responde "Custo. GA4 não sabe quanto foi pago pelo clique.".

## Regras que já foram conferidas automaticamente
As verificações abaixo rodam antes de você. Os achados chegam prontos — não refaça a conta, use-a.
- Conjunto com gasto e sem unidade vinculada (alta): O gasto não aparece no painel de nenhuma unidade. O franqueado não vê, e ninguém cobra o resultado.
- Conjunto gastando sem gerar resultado (alta): Depois de impressão suficiente para o Meta aprender, zero resultado não é azar: é público, oferta ou formulário quebrado.
- Custo por resultado muito acima dos pares (media): Comparado com os outros conjuntos da MESMA frente e do MESMO período. Comparar com o histórico da própria unidade esconde a piora da rede inteira.
- Nome fora dos formatos declarados (media): Nome que não casa com nenhum formato não entra em nenhum agrupamento — some do relatório sem ninguém perceber.
- Conjuntos ativos com o mesmo nome (media): Dois conjuntos iguais dividem verba e aprendizado, e cada um aprende metade. Quase sempre é cópia manual esquecida.
- Frente do manual sem nenhum dado no período (alta): Ou a frente parou de rodar, ou o dado não está chegando ao Hub. As duas coisas precisam de resposta, e nenhuma delas aparece num relatório que só soma o que existe.
- Fonte de dados prevista e não conectada (alta): Análise que se diz completa usando uma fonte de três leva a decisão errada com a confiança de quem viu tudo.

Parâmetros usados: cobra-se resultado a partir de 5.000 impressões; custo vira alerta acima de 1.5× a mediana da frente; só entra na comparação quem gastou ao menos R$ 100,00.

---


## Como decidir de que frente é uma campanha

Este é o algoritmo mais importante da especificação. Ele foi reescrito três
vezes contra a conta real, e cada regra abaixo existe porque a versão anterior
errou de um jeito específico.

```
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
```

### As quatro armadilhas

**1. A frente vem da CAMPANHA, nunca do conjunto.**
Um conjunto chamado `dco | interesses | leads | sacoma` dentro da campanha
`[Rise] always-on | apartadas` é **Apartadas**, não DCO. O "dco" ali é o
formato de compra; a frente é para onde a verba foi. Ler pelo conjunto
classificaria toda a verba das unidades como DCO genérico.

**2. O passo 5 não pode ser pulado.**
A campanha `[Rise] venda | always-on | store` tem o conjunto
`always-on | store | rmkt`. Sem a parada, o marcador "rmkt" a jogaria em
Remarketing — que no manual é uma frente de **aula experimental**. A verba da
loja entraria no eixo errado, com aparência de número certo. Público declarado
e não mapeado é uma decisão pendente, não um caso a adivinhar.

**3. "advantage" NÃO identifica aula experimental.**
É a segmentação automática do Meta e aparece em qualquer frente, inclusive nos
conjuntos da Academy (`belenzinho | sao-paulo | advantage | aberto-21-a-40-anos`).
Usá-la como marcador migraria a verba da Academy para o eixo de aula
experimental.

**4. O público é o último segmento, e não a terceira posição.**
Em agosto/2026 a agência renomeou `[Rise] dco | always-on | apartadas` para
`[Rise] always-on | apartadas`. Um leitor que esperasse exatamente três partes
devolveria `null` e faria **as apartadas inteiras sumirem do manual** — R$ 4.400
classificados como "fora do manual" sem nada ter mudado na operação, só no nome.
O nome de duas partes continua sendo sinalizado como fora da convenção; o que
não pode é a verba sumir do eixo por causa disso.


---


## O estado real das fontes (25/08/2026)

Esta seção é o que mais economiza tempo de quem for reconstruir. Cada linha
custou uma investigação.

### Meta Ads — funciona, mas cuidado com o grão e com os eventos

- A Graph API entrega no nível de **conjunto** (`level=adset`), que é o grão
  em que o manual classifica. O SmartAds guarda só **campanha**.
- `/{adset_id}/leads` **não existe**. Os caminhos válidos são
  `/{form_id}/leads` e `/{ad_id}/leads`.
- `/{form_id}/leads` **exige Page Access Token**. Com token de usuário a
  resposta vem `{"data":[]}` — sem erro, sem aviso, apenas vazia. É o pior
  tipo de falha, porque parece "não há leads".
- O Meta devolve **o mesmo evento sob mais de vinte `action_type`**, um por
  janela de atribuição e origem. Somar todos multiplica o resultado por dez.
  Os três que valem:
  - `complete_registration` → agendamento de aula experimental
  - `onsite_conversion.lead_grouped` → lead de formulário (RH, Academy, franquias)
  - `purchase` → compra (Pure Pass)
- **`lead` NÃO serve**: soma o lead de formulário com o lead de pixel do site
  e conta a mesma pessoa duas vezes.
- O texto do anúncio mora em **três lugares diferentes**, e ler só um perde a
  maior parte: `creative.body`/`title`, `object_story_spec.link_data` (ou
  `video_data`), e `asset_feed_spec` (DCO, onde os textos são listas de
  variações).

### Google Ads — só via SmartAds, e só campanha

- Não há acesso à API do Google Ads. A única fonte é a tabela `insights` do
  SmartAds (projeto `tobdedvnqaukpmnedabt`), com `platform='google'`.
- O grão é **campanha**. Não há grupo de anúncios.
- `conversions` vem como **um inteiro só**, sem quebra por tipo. Não dá para
  separar agendamento de lead. A tela precisa dizer isso, em vez de deixar
  parecer que a quebra existe e foi omitida.
- **A carga estava parada desde 12/08/2026** (último dia: 11/08), enquanto a do
  Meta seguia atualizando. Cargas independentes param de forma independente.

### Google Analytics 4 — existe e está QUEBRADO

A tabela `ga4_metrics` do SmartAds tem as colunas certas (sessões, canal,
bounce, duração, conversões), mas a coleta colapsou depois de abril/2026:

| mês | sessões | conversões |
|---|---|---|
| abr/26 | 3.116 (em 12 dias) | 989 |
| mai/26 | 130 | 4 |
| jun/26 | 108 | 0 |
| jul/26 | 96 | 0 |
| ago/26 | 93 | 2 |

Um site com R$ 250 mil/mês de mídia não tem 93 sessões no mês. O `bounce_rate`
vem 100% em quase toda linha, o que indica evento não disparando.

**Não ligar o GA4 ao relatório enquanto isso não for consertado.** Ele
colocaria "93 sessões" ao lado de "5 milhões de impressões" e chamaria as duas
de dado. Isso é medição para consertar, não integração para fazer.

### A armadilha que quase passou

O relatório do Hub lia `dpp_ad_set_daily_metrics`, tabela do próprio Hub. Ela
tinha métrica de **6 dos 112 conjuntos**, todos de uma campanha só, e somava
**R$ 1.437 em agosto contra R$ 65.315 de gasto real**.

O relatório não quebrava. Analisava 2% da conta e mostrava o resultado com a
mesma cara de quem viu tudo — nada na tela denunciava. Qualquer reconstrução
precisa de uma conferência que compare o total lido com o total da plataforma,
e que **falhe alto** quando divergirem.


---


## Avaliação contra o PDM (plano de mídia)

O PDM é a planilha que a agência entrega todo mês
(`RISE_PURE-PILATES_PDM_BRANDPERFORMANCE_Q425Q126_11319`), com verba, alcance,
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
- **`bruto` = `líquido` + comissão da agência (20%)**. O líquido é o que vira
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


---


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


---

## Scripts que acompanham

Todos leem credenciais de `.env.local`, que nunca é versionado.

**Saíram do Hub com o módulo.** Recuperáveis em `git show caf4dca:<caminho>`:

| script | o que faz |
|---|---|
| `scripts/atualiza-desempenho.mjs` | Meta por conjunto (Graph API) + Google por campanha (SmartAds). É a carga que o relatório consumia. |
| `scripts/atualiza-criativos.mjs` | os textos de todos os anúncios da conta, com detecção de defeito no texto publicado |

**Ficaram no Hub**, porque alimentam a avaliação contra o PDM, que continua no
Dashboard:

| script | o que faz |
|---|---|
| `scripts/atualiza-realizado.mjs` | Meta e Google, dia a dia, via SmartAds |
| `scripts/gera-pdm.mjs` | lê a planilha da Rise e gera os meses planejados |

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
