# Workflows do n8n

Esta pasta guarda os workflows do n8n em formato importável. Os arquivos são só
o código-fonte versionado — **o n8n não lê esta pasta**. Quem importa é você,
pela interface, em <https://backend.purepilates.com.br>.

---

## `aviso-inauguracao.workflow.json` — Aviso de inauguração (marketing)

Todo dia às 03:00 (horário de São Paulo) o workflow procura na tabela
`inauguracao_requests` as unidades cuja `data_inauguracao` é hoje e que ainda não
foram avisadas, e manda **um e-mail por unidade** ao pessoal do marketing com os
dados que o colaborador preencheu no Hub. Depois de enviar, marca a linha para o
aviso não sair repetido.

### Os quatro nós

| # | Nó | O que faz |
|---|---|---|
| 1 | `Todo dia as 03:00` (Schedule Trigger) | Dispara diariamente às 03:00 em `America/Sao_Paulo` |
| 2 | `Buscar inauguracoes de hoje` (HTTP Request, GET) | Lê `inauguracao_requests` no Supabase via PostgREST |
| 3 | `Enviar e-mail ao marketing` (Send Email) | Um e-mail por linha retornada |
| 4 | `Marcar aviso como enviado` (HTTP Request, PATCH) | Grava `email_enviado_em` na linha |

---

## ANTES DE IMPORTAR: aplique a migration

O workflow depende da coluna `email_enviado_em`, que **não existe até você rodar
o SQL**. Sem ela, o passo 2 falha logo de cara: o PostgREST devolve
`42703 column inauguracao_requests.email_enviado_em does not exist` e nenhum
e-mail é enviado.

Rode no **SQL Editor do Supabase**, no projeto do Hub (`evprrtvbvjnjixogjsmn`),
o conteúdo de:

```
supabase/migrations/20260801100000_inauguracao_email_enviado.sql
```

---

## Passo a passo da importação

1. Baixe/abra o arquivo `n8n/aviso-inauguracao.workflow.json` deste repositório.
2. No n8n (<https://backend.purepilates.com.br>), no canto superior direito:
   **Workflows → Add workflow** (ou os três pontinhos `...` de um workflow novo)
   **→ Import from File...** e selecione o JSON.
   - Alternativa (**copiar e colar**): abra o arquivo num editor, copie tudo,
     crie um workflow em branco e cole (`Ctrl+V`) direto no canvas.

     > ⚠️ **Colar traz só os nós e as conexões — o `settings.timezone` do
     > arquivo é descartado.** O workflow fica com o fuso da instância, que num
     > n8n self-hosted é `America/New_York` por padrão: o gatilho das 3h
     > dispararia às 5h de São Paulo e a data consultada seria a de Nova York.
     > Ou seja, o e-mail sai no dia errado — e nada avisa que isso aconteceu.
     > Se você colar em vez de importar, **abra `Workflow settings → Timezone`
     > e ponha `America/Sao_Paulo` na mão**, antes de qualquer outra coisa.
     > Prefira **Import from File**, que preserva o `settings`.
3. Confira em **Workflow settings (`...` → Settings) → Timezone** que está
   `America/Sao_Paulo`. O arquivo já traz isso, mas vale conferir depois de
   importar — ver a seção "O fuso" abaixo, porque é o detalhe que mais dói se
   estiver errado.
4. Preencha o que falta (próxima seção).
5. Teste manualmente (seção "Como testar sem esperar até as 3h").
6. Só então ative o workflow no botão **Active** (canto superior direito).
   Enquanto estiver inativo, o agendamento das 3h **não roda**.

---

## O que você precisa preencher

Nada de credencial vem preenchido no arquivo — ele vai para o Git, e chave de
serviço em repositório é o tipo de coisa que não tem volta. Tudo abaixo é
preenchido **na instância do n8n**, não no arquivo.

### 1. As variáveis do Supabase (`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`)

Os dois nós de HTTP Request leem `{{ $env.SUPABASE_URL }}` e
`{{ $env.SUPABASE_SERVICE_ROLE_KEY }}`. São **variáveis de ambiente do processo
do n8n** — defina-as onde a instância é configurada (`docker-compose.yml`,
arquivo `.env` do servidor, systemd unit, etc.) e reinicie o n8n.

Onde pegar os valores: painel do Supabase → projeto do **Hub**
(`evprrtvbvjnjixogjsmn`) → **Project Settings → API**:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | O campo **Project URL** — `https://evprrtvbvjnjixogjsmn.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | A chave **`service_role`** (a *secret*, não a `anon`) |

> **Atenção ao projeto.** Existe outro Supabase no ecossistema
> (`bweyyihedqnckbtzbkie`, do Painel de Indicadores) que **não tem** a tabela
> `inauguracao_requests`. Apontar para ele dá 404 e nenhum aviso sai.

> **Por que a chave de serviço?** A `inauguracao_requests` tem RLS: cada
> colaborador só enxerga as próprias linhas. O workflow não é um usuário
> logado — precisa ver as solicitações de todo mundo, e a chave de serviço é o
> que passa por cima da RLS. Trate-a como senha de administrador do banco: ela
> ignora toda a segurança de linha.

**Se `$env` não funcionar na sua instância:** o n8n bloqueia acesso a variáveis
de ambiente quando `N8N_BLOCK_ENV_ACCESS_IN_NODE=true` (o padrão é `false`, ou
seja, liberado — mas confira). Se estiver bloqueado, as duas alternativas são:

- criar uma credencial **Header Auth** com `apikey` + `Authorization` e usar
  *Authentication → Generic Credential Type → Header Auth* nos dois nós de HTTP
  Request (removendo os headers correspondentes); ou
- trocar `$env` por `$vars` e cadastrar as **Variables** no n8n.

Em nenhum dos casos escreva a chave de volta no JSON deste repositório.

### 2. A credencial de e-mail (SMTP)

O nó `Enviar e-mail ao marketing` é um **Send Email**, que usa uma credencial do
tipo **SMTP**. O arquivo vem **sem credencial selecionada** de propósito.

Abra o nó → campo **Credential to connect with** → selecione a credencial SMTP
existente da instância, ou **Create new credential** e preencha host, porta,
usuário, senha e SSL/TLS do servidor de e-mail de vocês.

### 3. Os destinatários do marketing

Abra o nó **`Enviar e-mail ao marketing`** e edite dois campos:

| Campo na interface | Valor que vem no arquivo | O que colocar |
|---|---|---|
| **From Email** | `PREENCHER-remetente@purepilates.com.br` | O remetente (precisa ser um endereço que o SMTP configurado tem permissão de usar) |
| **To Email** | `PREENCHER-marketing@purepilates.com.br` | Os e-mails do marketing, **separados por vírgula** |

Exemplo de **To Email** com três pessoas:

```
Fulano <fulano@purepilates.com.br>, ciclana@purepilates.com.br, beltrano@purepilates.com.br
```

No JSON, esses campos são `nodes[2].parameters.fromEmail` e
`nodes[2].parameters.toEmail` — mas edite pela interface do n8n, não no arquivo:
**a lista de destinatários mora no n8n**, essa foi a decisão de projeto (§3 do
spec). Construir uma tela no Hub para administrar três e-mails que mudam uma vez
por ano seria desproporcional.

---

## O fuso — o detalhe que mais dói se estiver errado

Rodando **às 3h da manhã**, um deslocamento de fuso de poucas horas muda o *dia*
consultado. O aviso sairia um dia cedo ou um dia tarde — exatamente o que não
pode acontecer numa notificação de "hoje". Por isso o fuso está declarado em
dois lugares, e nenhum deles é o padrão da instância:

- **Quando dispara:** `settings.timezone = "America/Sao_Paulo"` no próprio
  workflow. O Schedule Trigger dá prioridade ao fuso do workflow sobre o da
  instância (`GENERIC_TIMEZONE`, que num self-hosted vem `America/New_York` por
  padrão).
- **Qual dia é consultado:** a URL do nó 2 usa
  `{{ $now.setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd') }}` — a data é
  calculada explicitamente em São Paulo, não no fuso da instância.

Se você mexer no workflow, **não troque nenhum dos dois por um valor implícito.**

---

## A ordem dos nós: e-mail ANTES da marcação

O nó 4 (marcar como enviado) vem **depois** do nó 3 (enviar e-mail). Isso é
deliberado, não descuido:

- **Como está:** se a marcação falhar, o e-mail já saiu e o marketing pode
  receber repetido numa reexecução. Incômodo, mas visível.
- **Se fosse invertido:** se o envio falhasse, a linha já estaria marcada como
  avisada e o aviso **nunca sairia** — ninguém receberia nada e ninguém ficaria
  sabendo.

Entre falhar barulhento e falhar em silêncio, o desenho escolheu barulhento.
**Não inverta os nós 3 e 4.**

---

## Como testar sem esperar até as 3h

1. Abra o workflow no n8n e clique em **Execute workflow** (ou **Test
   workflow**). O Schedule Trigger dispara na hora, sem esperar o agendamento.
2. Para ter o que testar, garanta que existe pelo menos uma linha em
   `inauguracao_requests` com `data_inauguracao` = **hoje** e
   `email_enviado_em` = `NULL`. No SQL Editor do Supabase:

   ```sql
   -- ver o que o workflow enxergaria agora
   select id, nome_unidade, data_inauguracao, email_enviado_em
     from public.inauguracao_requests
    where data_inauguracao = (now() at time zone 'America/Sao_Paulo')::date
      and email_enviado_em is null;
   ```

3. **Para reexecutar o teste**, limpe a marcação da linha que você usou (senão a
   consulta não devolve mais nada):

   ```sql
   update public.inauguracao_requests
      set email_enviado_em = null
    where id = '<o id da linha de teste>';
   ```

4. Se quiser testar sem mandar e-mail de verdade, desabilite temporariamente o
   nó `Enviar e-mail ao marketing` (clique nele → `D`) e rode: você vê o
   resultado da consulta sem disparar nada.

**Nenhuma unidade inaugura hoje?** O nó 2 devolve lista vazia, os nós seguintes
não executam e o workflow termina em sucesso. Isso é o comportamento correto,
não um erro.

---

## Limitações conhecidas

Estão no spec (§8) e são conscientes, não bugs a corrigir:

- **Sem recuperação.** A consulta é sempre "hoje". Se o n8n estiver fora do ar
  às 3h, o aviso daquele dia **não sai e não é recuperado depois**. Consultar
  "hoje ou antes, não avisado" resolveria, mas na primeira execução dispararia
  avisos retroativos de inaugurações antigas — pior.
- **Solicitação criada depois das 3h do próprio dia não é avisada.** As 3h já
  passaram e não há segunda passada. Quem cadastra uma inauguração no mesmo dia
  já sabe dela; o valor do aviso está nas cadastradas com antecedência.
- **A lista de destinatários vive no n8n.** Quem for mexer precisa de acesso à
  instância. É a contrapartida consciente de não construir uma tela para isso.
- **Duas unidades no mesmo dia** geram dois e-mails, um por unidade. É o
  pedido, não um defeito.
- **Se o envio de uma unidade falhar, só ela fica para trás.** O nó de e-mail
  está com *Retry On Fail* (3 tentativas, 5s entre elas) e *On Error →
  Continue (using error output)*. Numa falha de SMTP com três unidades no dia,
  as outras duas seguem normalmente para a marcação; a que falhou sai pela
  saída de erro, que está **desconectada de propósito** — a linha fica sem
  `email_enviado_em` e volta a ser candidata no próximo ciclo. Como a consulta
  é sempre "hoje", esse próximo ciclo na prática só existe se você reexecutar o
  workflow manualmente **no mesmo dia**; passou da meia-noite, o aviso daquela
  unidade não sai mais (é a limitação "sem recuperação" acima).
- **Reexecutar manualmente depois de uma falha parcial não reenvia para quem já
  recebeu.** Quem recebeu já está marcado, e a consulta filtra
  `email_enviado_em=is.null`. O único caso em que ainda dá para receber
  repetido é o e-mail sair e o PATCH da própria linha falhar — bem mais raro, e
  é o incômodo que o desenho aceita de propósito para nunca ficar em silêncio
  (ver "A ordem dos nós").

---

## Formato do workflow — o que está confirmado e onde olhar se algo reclamar

Este JSON foi escrito **sem acesso a uma instância do n8n**, então nunca foi
importado de verdade. O que dá para garantir por verificação local: é JSON
válido, tem `name`/`nodes`/`connections`, cada nó tem `type`/`typeVersion`/
`position`/`parameters`, e as conexões ligam os quatro nós na ordem certa.

Os pontos que ficaram em dúvida na primeira escrita **foram conferidos depois no
código-fonte do n8n** e se resolveram todos a favor do arquivo como está — não
gaste tempo investigando os que estão marcados como confirmados.

| Ponto | O que foi usado | Situação | Se der problema |
|---|---|---|---|
| `scheduleTrigger` `typeVersion` | `1.2` | **Confirmado** — é o que a documentação oficial usa nos exemplos de workflow | Se a instância for muito antiga, baixe para `1.1`; os parâmetros `rule.interval` são os mesmos |
| `httpRequest` `typeVersion` | `4.2` | **Confirmado** — versão atual, usada nos exemplos oficiais | Numa instância antiga, `4.1` aceita os mesmos parâmetros |
| `emailSend` `typeVersion` | `2.1` | **Confirmado no código-fonte do n8n** — o nó declara o array de versões `[2, 2.1]` | Nada a fazer |
| Fuso declarado no workflow, não no nó | `settings.timezone` | **Confirmado no código-fonte** — o `ScheduleTrigger` chama `this.getTimezone()`, que lê `workflow.settings.timezone`; o nó **não tem** campo de fuso próprio | Confira em *Workflow settings → Timezone*. Ver o alerta sobre copiar-e-colar no passo 2 da importação |
| Um e-mail por unidade | O HTTP Request v4 divide o array JSON da resposta em vários itens | **Confirmado no código-fonte** — `if (Array.isArray(response)) { response.forEach(...) }`, com `pairedItem` por elemento | Nada a fazer. **Não** insira um nó Split Out: ele é desnecessário e no cenário abaixo até atrapalha |
| `$('Buscar inauguracoes de hoje').item.json.id` no nó 4 | Referência ao item pareado do nó 2 | **Confirmado no código-fonte** — o `emailSend` empurra `pairedItem: { item: itemIndex }`, então o vínculo segue item a item mesmo com várias unidades no mesmo dia; e se o pareamento quebrasse, o n8n lança erro explícito em vez de marcar a linha errada em silêncio | Nada a fazer. Foi feito assim porque a saída do nó de e-mail é a resposta do SMTP (`messageId`, `accepted`...), **não** a linha do banco — `$json.id` ali daria `undefined` |
| Data por extenso em pt-BR | `DateTime.fromFormat(...).setLocale('pt-BR')` (Luxon) | Não verificado — depende do ICU do Node da instância | Se o mês vier em inglês, troque por `{{ $json.data_inauguracao.split('-').reverse().join('/') }}` para `dd/mm/aaaa` |

### O único cenário que ainda exige ajuste: a resposta interpretada como texto

O nó 2 está com o **autodetect** de formato de resposta do HTTP Request. Se, por
algum motivo, o PostgREST responder com um `Content-Type` que o n8n não
reconheça como JSON, ele cai no caminho de **texto** e embrulha tudo num único
item no formato `{ "data": "<a resposta inteira como string>" }`.

O sintoma é chegar **um** e-mail só, com os campos vazios ou com `undefined`, em
vez de um por unidade.

**A correção não é um Split Out.** Nesse cenário `data` é uma *string*, não um
array — um Split Out em `data` falha. O ajuste é forçar o formato no nó 2:

> Abra o nó **`Buscar inauguracoes de hoje`** → **Options** → **Add Option** →
> **Response** → **Response Format** → **JSON**.

No JSON isso corresponde a `nodes[1].parameters.options.response.response.responseFormat = "json"`.

---

## Nunca comite chave no arquivo

O JSON desta pasta vai para o Git. Se você preencher credenciais direto no
arquivo para testar, **não comite** — a chave de serviço ignora toda a RLS do
banco, e um segredo que entrou no histórico do Git não sai mais de verdade.

Antes de qualquer commit, procure por tokens longos (é o formato de qualquer
chave do Supabase, tanto a JWT antiga quanto a `sb_`... nova):

```bash
grep -rnE "[A-Za-z0-9_-]{60,}" n8n/
```

Tem que voltar vazio. Se voltar alguma coisa, olhe linha por linha antes de
seguir.
