# Workflows do n8n

Esta pasta guarda os workflows do n8n em formato importável. Os arquivos são só
o código-fonte versionado — **o n8n não lê esta pasta**. Quem importa é você,
pela interface, em <https://backend.purepilates.com.br>.

---

## `aviso-inauguracao.workflow.json` — Aviso de inauguração (marketing)

No dia da inauguração, o pessoal do marketing recebe **um e-mail por unidade**
que inaugura naquele dia, com os dados que o colaborador preencheu no Hub.

**A arquitetura foi invertida.** Quem manda no fluxo agora é o Supabase; o n8n
virou o carteiro:

```
pg_cron (03:00 America/Sao_Paulo = 06:00 UTC)
  └─> Edge Function `inauguracao-aviso-diario`   [já tem a chave de serviço]
        1. calcula "hoje" em São Paulo
        2. busca as inaugurações de hoje ainda não avisadas
        3. busca os destinatários ativos
        4. POST no webhook do n8n com tudo pronto
             └─> n8n: Webhook → Split Out → Gmail → Filter → Set → Respond
                  devolve { "enviados": ["id", ...] }
        5. marca `email_enviado_em` SÓ dos ids que o n8n confirmou
```

**Nenhum segredo do Supabase entra no n8n.** A chave de serviço nunca sai de
dentro do Supabase.

### Por que mudou (leia antes de "voltar como era")

A versão anterior fazia o contrário: o workflow tinha um Schedule Trigger e três
nós de HTTP Request que liam e escreviam no Supabase via PostgREST, usando
`{{ $env.SUPABASE_URL }}` e `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}`.

**Essas variáveis não existem nesta instância do n8n.** Na execução real as
expressões resolveram para string vazia e o nó quebrou com:

```
Invalid URL: /rest/v1/inauguracao_email_recipients?select=email&ativo=is.true
URL must start with "http" or "https"
```

Havia duas saídas: cadastrar `SUPABASE_SERVICE_ROLE_KEY` no ambiente do n8n, ou
inverter o fluxo. **A chave de serviço ignora toda a RLS do banco** — é senha de
administrador. Guardá-la numa segunda ferramenta, para poupar uma Edge Function,
não se paga. A Edge Function já roda dentro do Supabase e já tem a chave no
ambiente, sem ninguém precisar copiá-la para lugar nenhum.

### Os seis nós

| # | Nó | O que faz |
|---|---|---|
| 1 | `Recebe do Supabase` (Webhook, POST) | Recebe `{ destinatarios, inauguracoes }` da Edge Function. `responseMode: responseNode` |
| 2 | `Separar as inauguracoes` (Split Out) | Quebra `body.inauguracoes` em um item por unidade |
| 3 | `Enviar e-mail ao marketing` (**Gmail**) | Um e-mail por unidade, para todos os destinatários de uma vez |
| 4 | `So o que virou e-mail de verdade` (Filter) | Deixa passar só o que o Gmail aceitou — ver "O nó 4 é uma trava" |
| 5 | `Ids que o Gmail confirmou` (Set) | Traz de volta o **id da inauguração** (a saída do Gmail é a resposta da API) |
| 6 | `Responder ao Supabase` (Respond to Webhook) | Devolve `{ "enviados": [ids...] }` |

### O contrato entre os dois lados

**O que a Edge Function envia** (POST, `Content-Type: application/json`):

```json
{
  "destinatarios": ["marketing@exemplo.com", "outro@exemplo.com"],
  "inauguracoes": [
    {
      "id": "0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0",
      "nome_unidade": "Pure Pilates Exemplo",
      "unidade_id": "1234",
      "endereco": "Rua Exemplo, 100 - Cidade/UF",
      "solicitante_nome": "Fulano de Tal",
      "solicitante_email": "fulano@exemplo.com",
      "data_inauguracao": "2026-08-20",
      "data_inauguracao_fmt": "20/08/2026"
    }
  ]
}
```

**O que o n8n tem que devolver:**

```json
{ "enviados": ["0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0"] }
```

Só esses ids são marcados como avisados. A Edge Function também aceita um array
puro (`["id1", "id2"]`), por robustez, e **descarta qualquer id que não estava no
lote** que ela mesma enviou.

Qualquer outra coisa — HTTP != 2xx, corpo que não é JSON, JSON sem `enviados`,
ou nenhuma resposta dentro de 60s — faz a Edge Function **não marcar nada** e
registrar erro no log. Ver "Falhar barulhento".

---

## ANTES DE IMPORTAR: aplique as TRÊS migrations e publique a function

| Migration | O que cria | Sem ela |
|---|---|---|
| `supabase/migrations/20260801100000_inauguracao_email_enviado.sql` | Coluna `email_enviado_em` em `inauguracao_requests` | A Edge Function falha na consulta (`42703`) e nenhum e-mail sai |
| `supabase/migrations/20260801140000_inauguracao_email_recipients.sql` | Tabela `inauguracao_email_recipients` (+ RLS de admin) | A Edge Function falha ao buscar os destinatários (`42P01`) |
| `supabase/migrations/20260803120000_inauguracao_aviso_cron.sql` | O agendamento no `pg_cron` | Nada dispara às 3h — o workflow só roda se você chamar o webhook na mão |

Rode as três no **SQL Editor do Supabase**, no projeto do Hub
(`evprrtvbvjnjixogjsmn`).

**A migration do cron precisa do segredo no Vault.** Ela monta o header
`Authorization: Bearer <segredo>` lendo `vault.decrypted_secrets` no nome
`cron_secret`, e esse valor tem que ser **idêntico** ao segredo `CRON_SECRET` das
Edge Functions (é ele que a function compara). Se ainda não existir:

```sql
select vault.create_secret('<o mesmo valor de CRON_SECRET>', 'cron_secret');
```

Sem isso o header sai como `Bearer ` e a function responde **401 todo dia, em
silêncio** — o `pg_net` não reclama de um 401 do outro lado.

**Publique a Edge Function** `inauguracao-aviso-diario` (`supabase functions
deploy inauguracao-aviso-diario`, ou pelo painel). Os segredos que ela usa —
`CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — **já existem** no
projeto; nada a cadastrar. O único opcional é `INAUGURACAO_WEBHOOK_URL`, e só se
o endereço do webhook for diferente do default (próxima seção).

**Cadastre pelo menos um destinatário no Hub:** **Inaugurações → aba
Destinatários** (a aba só aparece para **admin**). A tabela nasce vazia de
propósito — e-mail de pessoa não entra em migration versionada. **Sem
destinatário ativo o aviso não sai**, e isso é registrado como erro (ver "Falhar
barulhento").

---

## Passo a passo da importação

1. Baixe/abra o arquivo `n8n/aviso-inauguracao.workflow.json` deste repositório.
2. No n8n (<https://backend.purepilates.com.br>): **Workflows → Add workflow →
   Import from File...** e selecione o JSON.
   - Copiar e colar também funciona e agora é **menos arriscado** que antes: o
     `settings.timezone` continua no arquivo, mas o agendamento **não depende
     mais dele** (quem agenda é o `pg_cron`, no Supabase). Ainda assim, prefira
     **Import from File**.
3. Confira no nó `Enviar e-mail ao marketing` que a credencial **`Gmail
   account`** ficou selecionada. O arquivo referencia a credencial pelo id que já
   existe na instância; se aparecer em branco, selecione-a na lista (não crie
   outra).
4. **Pegue a URL de produção do webhook.** Abra o nó `Recebe do Supabase` e copie
   a **Production URL**. Com o `path` do arquivo ela é:

   ```
   https://backend.purepilates.com.br/webhook/aviso-inauguracao
   ```

   Esse é o **default** que a Edge Function usa. Se a sua instância montar outra
   URL, cadastre o segredo `INAUGURACAO_WEBHOOK_URL` nas Edge Functions do
   Supabase com o valor certo. **Não** mude o `path` no arquivo sem atualizar o
   segredo junto — a function chamaria um endereço que não existe e o aviso do
   dia se perderia.
5. **Ative o workflow** (botão **Active**, canto superior direito). Isto é
   obrigatório aqui, e é diferente da versão anterior: a **Production URL só
   responde com o workflow ativo**. Enquanto inativo, só a *Test URL* funciona, e
   só durante uma execução de teste — a chamada do cron levaria 404.

---

## O que você precisa preencher

### 1. Variáveis do Supabase — **nada a fazer**

O workflow **não lê mais nada do Supabase**. `$env.SUPABASE_URL` e
`$env.SUPABASE_SERVICE_ROLE_KEY` sumiram do arquivo, e é o ponto principal desta
versão. Se você já tinha cadastrado essas variáveis no ambiente do n8n para a
versão anterior, **remova-as** — chave de serviço parada num lugar onde não é
usada é só superfície de ataque.

### 2. A credencial de e-mail — **nada a fazer**

O nó `Enviar e-mail ao marketing` é um **Gmail** com OAuth2 apontando para a
credencial **`Gmail account`** (id `GfnvRU8IivJHJehE`), a mesma usada por outros
cinco workflows da instância — inclusive o de Mídia Adicional. **Não crie
credencial nova.**

O `id` da credencial no arquivo **não é segredo**: é só o identificador interno
do n8n. O token OAuth em si nunca sai da instância.

### 3. Os destinatários — **no Hub, não aqui**

> **Hub → Inaugurações → aba Destinatários** (só admin)

Ali dá para adicionar, ativar/desativar e remover endereços. Quem lê essa tabela
agora é a **Edge Function**, a cada execução, filtrando `ativo = true` — mudança
na lista vale já no próximo dia, sem tocar no n8n.

O nó Gmail monta o campo **Para** juntando a lista que chegou no webhook:

```
{{ $('Recebe do Supabase').first().json.body.destinatarios.join(', ') }}
```

> **`.first()`, não `.item`.** O webhook emite **um único item** com a lista
> inteira; o nó Gmail itera as **inaugurações**. `.first()` pega esse item único
> independentemente de quantas unidades inauguram no dia.

O **Reply-To** aponta para o solicitante da inauguração, então basta o marketing
responder o e-mail para falar com quem cadastrou.

---

## Falhar barulhento: os três casos que não marcam nada

A regra que organiza o desenho inteiro: **como a consulta é sempre "hoje", um
aviso que não sai hoje não sai nunca.** Entre marcar sem certeza (o aviso se
perde em silêncio) e não marcar (risco de e-mail repetido numa reexecução do
mesmo dia), o desenho escolhe sempre o repetido.

| Situação | O que acontece | Marca? |
|---|---|---|
| **Nenhuma inauguração hoje** | A function retorna **200** com `mensagem: "Nenhuma inauguracao hoje"`. **Não é erro** — e o webhook do n8n nem é chamado | Nada a marcar |
| **Há inauguração e nenhum destinatário ativo** | A function retorna **500** com `error: "sem_destinatarios_ativos"` e grava no log que ninguém foi avisado | ❌ nada |
| **n8n fora do ar, 4xx/5xx, timeout de 60s, ou resposta em formato inesperado** | A function retorna **502** com `error: "falha_no_webhook_n8n"` e o detalhe no log | ❌ nada |
| **n8n confirma parte** (ex.: 2 de 3) | A function marca as 2 e grava no log que 1 ficou para trás | ✅ só os confirmados |

> **A lista vazia deixou de ser silenciosa.** Na versão anterior, sem
> destinatário ativo o workflow terminava em **sucesso** sem enviar nem marcar
> nada — a proteção era estrutural (o nó de destinatários saía com 0 itens e
> nada depois dele executava), mas ninguém era alertado. Agora é uma verificação
> explícita, com 500 e log. **É a melhoria mais direta desta inversão.**

Onde ver esses logs: painel do Supabase → **Edge Functions →
`inauguracao-aviso-diario` → Logs**. Todas as linhas começam com
`[aviso-inauguracao]`.

---

## O fuso — o detalhe que mais dói se estiver errado

O agendamento saiu do n8n e foi para o `pg_cron`. Rodando **às 3h da manhã**, um
deslocamento de fuso de poucas horas muda o *dia* consultado, e o aviso sairia um
dia cedo ou um dia tarde. Agora o fuso está tratado em dois lugares, **os dois no
lado do Supabase**:

- **Quando dispara:** `'0 6 * * *'` na migration do cron. **O `pg_cron` agenda
  sempre em UTC**, e São Paulo é UTC−3 o ano inteiro (o Brasil não tem horário de
  verão desde 2019) — então **06:00 UTC = 03:00 em São Paulo**. Trocar por
  `'0 3 * * *'` faria o aviso sair à meia-noite local. Está comentado na
  migration; leia antes de "corrigir".
- **Qual dia é consultado:** a Edge Function calcula
  `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })`, que devolve
  `YYYY-MM-DD` — a data é calculada explicitamente em São Paulo, **não** em UTC.
  Às 03:00 locais o dia em UTC já virou; usar `new Date().toISOString()` daria o
  dia certo por acidente neste horário e o dia errado em qualquer outro.

O `settings.timezone = "America/Sao_Paulo"` continua no arquivo do workflow. Ele
é inofensivo e não agenda mais nada — fica porque qualquer expressão de data que
alguém venha a escrever no n8n vai querer esse fuso, não o da instância
(`America/New_York` por padrão num self-hosted).

---

## O nó 4 é uma trava, não enfeite

O nó **`So o que virou e-mail de verdade`** (um **Filter**) fica entre o envio e
a montagem da resposta, e deixa passar só os itens que têm **`threadId`** — ou
seja, o que a API do Gmail de fato aceitou. Ele parece redundante e **não é**.

**O que ele impede.** O nó de e-mail tem duas maneiras diferentes de falhar:

| Tipo de falha | Exemplo | O que o n8n faz |
|---|---|---|
| **Por item** | O Gmail recusa o endereço de uma unidade | O item sai pela **saída de erro** (desconectada). Os outros seguem. Tudo certo. |
| **De nível de nó** | **Credencial OAuth2 não selecionada, apagada, renomeada ou com o consentimento revogado** | O nó estoura **antes** do laço por item, e o motor repassa os **itens de entrada** — as inaugurações, com `id` e `pairedItem` intactos — pela **saída principal**. A saída de erro nem chega a ser usada. |

É a segunda linha que faz o estrago: sem o filtro, os ids de **todas** as
inaugurações do dia entrariam na resposta, e a Edge Function marcaria todas como
avisadas sem **nenhum** e-mail ter saído.

### Por que `threadId`, e por que não os outros dois campos

| Campo | Está na resposta do Gmail? | Está no item de entrada? | O que aconteceria |
|---|---|---|---|
| `messageId` | **não** (era do SMTP/nodemailer) | não | A trava **bloquearia tudo**: nada marcado, e o marketing recebendo repetido a cada reexecução |
| `id` | sim (o da mensagem) | **sim** (o da inauguração) | A trava **passaria tudo** — exatamente a falha silenciosa que ela existe para impedir |
| **`threadId`** | **sim** | **não** | ✅ É o único campo que distingue a resposta do Gmail de um item de entrada |

---

## O nó 5 também não é enfeite (e o `Always Output Data` menos ainda)

O nó `Ids que o Gmail confirmou` (um **Set**) existe por um motivo simples: **a
saída do nó Gmail é a resposta da API do Google** (`id`, `threadId`, `labelIds`),
não a inauguração. O `id` de lá é o da **mensagem** — devolvê-lo para a Edge
Function não casaria linha nenhuma no banco. O nó reconstrói o campo com
`$('Separar as inauguracoes').item.json.id`, que resolve o item pareado (o
`pairedItem` sobrevive ao Gmail e ao Filter).

E ele está com **`Always Output Data`** ligado de propósito. Se **nenhum** e-mail
sair, o Filter não emite nada; sem o toggle, este nó também não emitiria e o
`Responder ao Supabase` **não executaria** — a requisição da Edge Function
ficaria pendurada até estourar o timeout de 60s. Com o toggle, sai um item vazio,
o `.filter(Boolean)` do nó 6 o descarta, a resposta volta como
`{ "enviados": [] }` e a function conclui **sem marcar nada**, que é o
comportamento correto.

---

## Como testar sem esperar até as 3h

Há **dois** testes possíveis agora, e vale fazer os dois: um exercita só o n8n,
o outro exercita a corrente inteira.

### A. Só o n8n (não toca no banco)

Com o workflow **ativo**, mande o corpo na mão:

```bash
curl -X POST https://backend.purepilates.com.br/webhook/aviso-inauguracao \
  -H 'Content-Type: application/json' \
  -d '{
    "destinatarios": ["voce@exemplo.com"],
    "inauguracoes": [{
      "id": "00000000-0000-0000-0000-000000000001",
      "nome_unidade": "Unidade de Teste",
      "unidade_id": "9999",
      "endereco": "Rua do Teste, 1",
      "solicitante_nome": "Teste",
      "solicitante_email": "voce@exemplo.com",
      "data_inauguracao": "2026-08-20",
      "data_inauguracao_fmt": "20/08/2026"
    }]
  }'
```

O esperado: chega um e-mail e o `curl` devolve
`{"enviados":["00000000-0000-0000-0000-000000000001"]}`. O id é inventado, então
**nada é marcado no banco** — o teste é seguro.

### B. A corrente inteira (Edge Function → n8n → banco)

1. Garanta **pelo menos um destinatário ativo** (Hub → Inaugurações →
   Destinatários) e **pelo menos uma linha** com `data_inauguracao` = hoje e
   `email_enviado_em` `NULL`:

   ```sql
   -- o que a Edge Function enxergaria agora
   select id, nome_unidade, data_inauguracao, email_enviado_em
     from public.inauguracao_requests
    where data_inauguracao = (now() at time zone 'America/Sao_Paulo')::date
      and email_enviado_em is null;

   -- e para quem ela mandaria
   select email from public.inauguracao_email_recipients
    where ativo order by email;
   ```

2. Chame a function na mão, com o mesmo `CRON_SECRET` que o cron usa:

   ```bash
   curl -X POST https://evprrtvbvjnjixogjsmn.supabase.co/functions/v1/inauguracao-aviso-diario \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

   A resposta é o resumo: `{"ok":true,"data":"...","inauguracoes":N,
   "destinatarios":M,"marcadas":K}`.

3. **Para reexecutar**, limpe a marcação da linha de teste:

   ```sql
   update public.inauguracao_requests
      set email_enviado_em = null
    where id = '<o id da linha de teste>';
   ```

### Confira estes pontos na primeira execução

1. **Chegou um e-mail por unidade**, não um só com tudo dentro. Se vier **um só**
   com os campos vazios, o `fieldToSplitOut` do nó 2 não está achando
   `body.inauguracoes`.
2. **O campo Para trouxe TODOS os destinatários ativos.** Se vier só um, alguém
   trocou o `.first()` da expressão do `sendTo`.
3. **A data saiu em `dd/mm/aaaa`.** Ela vem pronta da Edge Function — se estiver
   errada, o problema é lá, não aqui.
4. **A linha ficou marcada:** rode o `select` do passo 1 de novo; a unidade
   avisada não deve mais aparecer.
5. **O teste da credencial ausente** — é o que valida a trava do nó 4, e vale
   fazer **uma vez**, porque é o modo de falha que causaria o pior estrago em
   silêncio:
   1. Limpe a marcação da linha de teste.
   2. No nó `Enviar e-mail ao marketing`, **remova a credencial do Gmail**.
   3. Rode o teste **B**. A function deve responder `"marcadas":0`.
   4. Confirme no `select` que a linha **continua** com `email_enviado_em` `NULL`.

   Se a linha aparecer marcada sem e-mail nenhum ter saído, **a trava do nó 4 não
   está funcionando** — não ative o workflow e confira se o Filter está presente,
   conectado entre o Gmail e o Set, e testando **`threadId`** (não `id`, que
   passaria tudo).

   5. Recoloque a credencial e limpe a marcação antes de seguir.
6. **O teste da lista vazia:** desative todos os destinatários no Hub e rode o
   teste **B**. O esperado agora é um **erro explícito** (`500`,
   `sem_destinatarios_ativos`), com a linha intacta — não mais o silêncio da
   versão anterior. Reative os destinatários depois.

---

## Limitações conhecidas

- **Sem recuperação.** A consulta é sempre "hoje". Se o Supabase ou o n8n
  estiverem fora do ar às 3h, o aviso daquele dia **não sai e não é recuperado
  depois**. Consultar "hoje ou antes, não avisado" resolveria, mas na primeira
  execução dispararia avisos retroativos de inaugurações antigas — pior.
- **Solicitação criada depois das 3h do próprio dia não é avisada.** Não há
  segunda passada. Quem cadastra uma inauguração no mesmo dia já sabe dela.
- **Duas unidades no mesmo dia** geram dois e-mails, um por unidade. É o pedido,
  não um defeito.
- **Se o envio de uma unidade falhar, só ela fica para trás.** O nó de e-mail
  está com *On Error → Continue (using error output)*: as outras seguem, entram
  na lista `enviados` e são marcadas; a que falhou não entra, fica sem
  `email_enviado_em` e volta a ser candidata — na prática, só se você reexecutar
  **no mesmo dia**.
- **O *Retry On Fail* cobre menos do que o nome sugere — e na primeira unidade
  pode duplicar.** O retry é do **nó inteiro**, não do item, e o n8n decide
  reexecutar olhando o **primeiro item** da saída principal. Falha na 1ª unidade
  → o nó reexecuta inteiro e as que já tinham dado certo **recebem de novo**;
  falha na 2ª ou 3ª, com a 1ª tendo dado certo → **nenhum retry**. Não é motivo
  para tirar o retry (sem ele o caso transitório também não é coberto); é motivo
  para não confiar nele como rede de segurança.
- **Reexecutar depois de uma falha parcial não reenvia para quem já recebeu.**
  Quem recebeu já está marcado e sai da consulta.
- **O e-mail pode sair sem a linha ser marcada.** Se o n8n enviar e a resposta se
  perder no caminho (timeout, queda entre uma coisa e outra), a function não
  marca e uma reexecução no mesmo dia manda repetido. É o incômodo que o desenho
  aceita de propósito para nunca ficar em silêncio.
- **A cota do Gmail vale.** A conta da credencial `Gmail account` divide a cota
  diária com os outros cinco workflows. Para uma ou duas inaugurações por dia
  está muito longe do teto, mas o teto existe.

---

## Formato do workflow — o que está confirmado e onde olhar se algo reclamar

Este JSON foi escrito **sem acesso a uma instância do n8n**. O que dá para
garantir por verificação local: é JSON válido, tem `name`/`nodes`/`connections`,
cada nó tem `type`/`typeVersion`/`position`/`parameters`, e as conexões ligam os
seis nós na ordem certa. O tipo, a `typeVersion` e o id da credencial do nó Gmail
**foram lidos da instância real** (do workflow `Midia Adicional - Notificacao por
email`), não chutados.

| Ponto | O que foi usado | Situação | Se der problema |
|---|---|---|---|
| `webhook` `typeVersion` | `2` | **Confirmado** — versão atual do nó | Numa instância antiga, `1.1` aceita os mesmos parâmetros (`httpMethod`, `path`, `responseMode`) |
| Saída do Webhook tem `body` | `body.inauguracoes` no Split Out e `body.destinatarios` no Gmail | **Confirmado** — o nó Webhook v2 devolve `{ headers, params, query, body }` | Se o Split Out reclamar de campo inexistente, abra o nó Webhook, rode o teste A e olhe a saída real. Se o corpo vier na raiz, tire o prefixo `body.` **nos dois lugares** |
| `splitOut` `typeVersion` | `1` | **Confirmado** — é a versão do nó desde que ele existe | Nada a fazer |
| `gmail` `typeVersion` e credencial | `n8n-nodes-base.gmail` v`2.1`, `gmailOAuth2` id `GfnvRU8IivJHJehE` | **Lido da instância real** | Nada a fazer |
| Parâmetros do nó Gmail | `sendTo`, `subject`, `message`, `options.replyTo` | **Lidos da instância real** (mesmo workflow) | Nada a fazer |
| `emailType: "html"` e `options.appendAttribution: false` | Explicitados no arquivo | **Não verificados na instância** — o precedente não os traz | Se o corpo chegar como texto cru com as tags à mostra, abra o nó e confira **Email Type = HTML**. Se `appendAttribution` for ignorado, volta só o rodapé do n8n |
| `filter` `typeVersion` e o formato das condições | `2.2`, condições v2 com `operator: string/exists`, `singleValue: true`, `typeValidation: "loose"` | **Confirmado no código-fonte** — o operador bate com `'string:exists': { type: 'string', operation: 'exists', singleValue: true }`. O `singleValue: true` faz o `filter-parameter.ts` pular a validação do `rightValue` vazio. E `={{ $json.threadId }}` é expressão única cobrindo a string inteira, então o n8n devolve o **valor cru** (`undefined`), não `''` — se virasse `''`, o `exists` daria **true** e a trava deixaria passar tudo | Ver a ressalva de versão logo abaixo |
| `set` `typeVersion` | `3.4` com `assignments` | **Formato atual do nó Set (Edit Fields)** — não verificado nesta instância | Se o nó importar estranho, recrie-o pela interface: um campo `id` (string) com valor `{{ $('Separar as inauguracoes').item.json.id }}`, e **ligue o `Always Output Data`** na aba Settings |
| `alwaysOutputData` no nó 5 | Propriedade de nó padrão do n8n | **Confirmado** — é o mesmo toggle *Always Output Data* da aba Settings, e vale em execução de produção, não só em teste | Se a Edge Function passar a estourar timeout quando nenhum e-mail sai, é este toggle que foi desligado |
| `respondToWebhook` `typeVersion` | `1.1`, `respondWith: "json"` com `responseBody` por expressão | **Confirmado** — `respondWith: json` faz `jsonParse` do corpo, então `JSON.stringify({...})` numa expressão devolve JSON de verdade | Se a Edge Function reclamar de "formato inesperado", rode o teste A e olhe o que o `curl` recebeu |
| `$('Ids que o Gmail confirmou').all()` no nó 6 | Referência a **todos** os itens de um nó anterior | **Confirmado** — `.all()` é a API documentada para ler o conjunto completo | Se voltar só um id, alguém trocou por `.item` |
| `$('Separar as inauguracoes').item` no nó 5 | Referência ao item pareado | **Confirmado** — o nó Gmail v2 empurra `pairedItem` (`constructExecutionMetaData` com `itemData`) e o Filter o preserva. Se o pareamento quebrasse, o n8n lança erro explícito em vez de devolver o id errado em silêncio | Nada a fazer |

### A única ressalva de portabilidade: o Filter exige n8n ≥ 1.59.0

O nó `So o que virou e-mail de verdade` usa `typeVersion 2.2`, que **existe a
partir do n8n 1.59.0**. Numa instância mais antiga o nó importa como versão
desconhecida (aparece quebrado no canvas, não com a condição em branco).

**O fallback é seguro:** baixe o `typeVersion` do Filter para `2` ou `2.1`. Isso
não muda nada neste guard: a condição é `exists` sobre um valor ausente, e o
`filter-parameter` devolve o veredito para `null`/`undefined` **antes** de
qualquer código sensível a versão — o `version` das condições só afeta comparação
de *boolean* e *number*, que este filtro não usa. Pelo mesmo motivo,
`typeValidation: "loose"` é inócuo aqui.

---

## Nunca comite chave no arquivo

O JSON desta pasta vai para o Git. **Nesta versão o workflow não precisa de
nenhum segredo do Supabase** — se você se pegar colando uma chave aqui, pare: é
sinal de que voltou a ler o banco pelo n8n, que é exatamente o que esta inversão
desfez.

Antes de qualquer commit, procure por tokens longos (é o formato de qualquer
chave do Supabase, tanto a JWT antiga quanto a `sb_`... nova):

```bash
grep -rnE "[A-Za-z0-9_+/=-]{50,}" n8n/
```

O que voltar tem que ser olhado linha por linha. Hoje o que casa são **caminhos
de arquivo** e **URLs** citados neste README, que obviamente não são segredo. O
`id` da credencial do Gmail (`GfnvRU8IivJHJehE`, 16 caracteres) também não é — é
só o identificador interno do n8n, não dá acesso a nada fora da instância.
