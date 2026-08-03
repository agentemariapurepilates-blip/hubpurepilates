# Workflows do n8n

Esta pasta guarda os workflows do n8n em formato importável. Os arquivos são só
o código-fonte versionado — **o n8n não lê esta pasta**. Quem importa é você,
pela interface, em <https://backend.purepilates.com.br>.

---

## `aviso-inauguracao.workflow.json` — Aviso de inauguração (marketing)

Todo dia às 03:00 (horário de São Paulo) o workflow lê no Hub a lista de quem
recebe o aviso, procura na tabela `inauguracao_requests` as unidades cuja
`data_inauguracao` é hoje e que ainda não foram avisadas, e manda **um e-mail por
unidade** — pelo **Gmail** — a todos os destinatários ativos, com os dados que o
colaborador preencheu. Depois de enviar, marca a linha para o aviso não sair
repetido.

### Os seis nós

| # | Nó | O que faz |
|---|---|---|
| 1 | `Todo dia as 03:00` (Schedule Trigger) | Dispara diariamente às 03:00 em `America/Sao_Paulo` |
| 2 | `Buscar destinatarios ativos` (HTTP Request, GET) | Lê `inauguracao_email_recipients` (`ativo=is.true`) — a lista gerenciada no Hub |
| 3 | `Buscar inauguracoes de hoje` (HTTP Request, GET) | Lê `inauguracao_requests` no Supabase via PostgREST |
| 4 | `Enviar e-mail ao marketing` (**Gmail**) | Um e-mail por unidade, para todos os destinatários ativos de uma vez |
| 5 | `So o que virou e-mail de verdade` (Filter) | Deixa passar só o que o Gmail aceitou — ver "O nó 5 é uma trava, não enfeite" |
| 6 | `Marcar aviso como enviado` (HTTP Request, PATCH) | Grava `email_enviado_em` na linha |

### O que mudou nesta versão

Se você já tinha importado a versão anterior (cinco nós, SMTP), **reimporte**:
praticamente tudo o que importa mudou.

| Antes | Agora | Por quê |
|---|---|---|
| Cinco nós | **Seis** — entrou `Buscar destinatarios ativos` | A lista de destinatários saiu do n8n e foi para o Hub |
| Nó **Send Email** (SMTP), credencial a criar | Nó **Gmail** (`n8n-nodes-base.gmail` v2.1), credencial **`Gmail account` já existente** (`GfnvRU8IivJHJehE`) | É o que a instância já usa em 5 workflows. **Você não precisa criar credencial nenhuma** |
| `To Email` digitado dentro do nó | `sendTo` montado a partir da tabela do Hub | Quem cuida da lista não precisa de acesso ao n8n |
| A trava testava `messageId` | A trava testa **`threadId`** | A resposta do Gmail não tem `messageId` — ver "O nó 5 é uma trava" |

---

## ANTES DE IMPORTAR: aplique as DUAS migrations

O workflow depende de duas coisas que **não existem até você rodar o SQL**:

| Migration | O que cria | Sem ela |
|---|---|---|
| `supabase/migrations/20260801100000_inauguracao_email_enviado.sql` | Coluna `email_enviado_em` em `inauguracao_requests` | O nó 3 falha com `42703 column inauguracao_requests.email_enviado_em does not exist` e nenhum e-mail sai |
| `supabase/migrations/20260801140000_inauguracao_email_recipients.sql` | Tabela `inauguracao_email_recipients` (+ RLS de admin) | O nó 2 falha com `42P01`/404 do PostgREST e o workflow para logo no começo |

Rode as duas no **SQL Editor do Supabase**, no projeto do Hub
(`evprrtvbvjnjixogjsmn`).

**Depois de aplicar**, cadastre pelo menos um destinatário no Hub:
**Inaugurações → aba Destinatários** (a aba só aparece para **admin**). A tabela
nasce vazia de propósito — e-mail de pessoa não entra em migration versionada.
**Sem nenhum destinatário ativo o aviso não sai** (ver "Lista vazia" abaixo).

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
4. Confira no nó `Enviar e-mail ao marketing` que a credencial **`Gmail
   account`** ficou selecionada. O arquivo referencia a credencial pelo id que
   já existe na instância; se por algum motivo ela aparecer em branco,
   selecione-a na lista (não crie outra).
5. Preencha o que falta (próxima seção).
6. Teste manualmente (seção "Como testar sem esperar até as 3h").
7. Só então ative o workflow no botão **Active** (canto superior direito).
   Enquanto estiver inativo, o agendamento das 3h **não roda**.

---

## O que você precisa preencher

Nada de credencial vem preenchido no arquivo — ele vai para o Git, e chave de
serviço em repositório é o tipo de coisa que não tem volta. Tudo abaixo é
preenchido **na instância do n8n** ou **no Hub**, não no arquivo.

### 1. As variáveis do Supabase (`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`)

Os **três** nós de HTTP Request leem `{{ $env.SUPABASE_URL }}` e
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
> (`bweyyihedqnckbtzbkie`, do Painel de Indicadores) que **não tem** as tabelas
> `inauguracao_requests` nem `inauguracao_email_recipients`. Apontar para ele dá
> 404 e nenhum aviso sai.

> **Por que a chave de serviço?** As duas tabelas têm RLS: em
> `inauguracao_requests` cada colaborador só enxerga as próprias linhas, e
> `inauguracao_email_recipients` é visível só para admin. O workflow não é um
> usuário logado — precisa ver tudo, e a chave de serviço é o que passa por cima
> da RLS. Trate-a como senha de administrador do banco.

**Se `$env` não funcionar na sua instância:** o n8n bloqueia acesso a variáveis
de ambiente quando `N8N_BLOCK_ENV_ACCESS_IN_NODE=true` (o padrão é `false`, ou
seja, liberado — mas confira). Se estiver bloqueado, as duas alternativas são:

- criar uma credencial **Header Auth** com `apikey` + `Authorization` e usar
  *Authentication → Generic Credential Type → Header Auth* nos três nós de HTTP
  Request (removendo os headers correspondentes); ou
- trocar `$env` por `$vars` e cadastrar as **Variables** no n8n.

Em nenhum dos casos escreva a chave de volta no JSON deste repositório.

### 2. A credencial de e-mail — **nada a fazer**

O nó `Enviar e-mail ao marketing` é um **Gmail** com OAuth2 e já vem apontando
para a credencial **`Gmail account`** (id `GfnvRU8IivJHJehE`), a mesma usada por
outros cinco workflows da instância — inclusive o de Mídia Adicional. **Não crie
credencial nova.** Só confira, depois de importar, que ela aparece selecionada
no nó (passo 4 da importação).

O `id` da credencial no arquivo **não é segredo**: é só o identificador interno
do n8n. O token OAuth em si nunca sai da instância.

### 3. Os destinatários — **no Hub, não aqui**

A lista **não fica mais no n8n**. Quem administra é o admin, pelo Hub:

> **Hub → Inaugurações → aba Destinatários** (a aba só aparece para admin)

Ali dá para adicionar, ativar/desativar e remover endereços. O nó 2 lê essa
tabela a cada execução, filtrando `ativo=is.true` — então mudança na lista vale
já no próximo dia, sem tocar no n8n.

O nó 4 monta o campo **Para** juntando todos os e-mails ativos numa string
separada por vírgula:

```
{{ $('Buscar destinatarios ativos').all().map(d => d.json.email).join(', ') }}
```

> **`.all()`, não `.item`.** O nó 4 itera as **inaugurações**; se a expressão
> usasse `.item`, o n8n parearia item a item e a 1ª inauguração receberia só o
> 1º destinatário, a 2ª só o 2º, e quem sobrasse não receberia nada. O `.all()`
> traz a lista inteira, independente de quantas unidades inauguram no dia.

O **Reply-To** aponta para o solicitante da inauguração, então basta o marketing
responder o e-mail para falar com quem cadastrou.

---

## Lista vazia: o workflow não marca nada

**Se não houver nenhum destinatário ativo, não há para quem enviar** — e marcar
as linhas nesse caso seria a pior falha possível desta automação: o aviso se
perderia em silêncio e ninguém descobriria.

A garantia é **estrutural, não uma condição escrita em algum lugar**: sem
destinatário ativo o PostgREST devolve `[]`, o nó `Buscar destinatarios ativos`
**não emite nenhum item**, e o motor do n8n não executa nada depois dele — nem a
consulta das inaugurações, nem o envio, nem, principalmente, a marcação. Como o
nó 6 está a jusante do nó de destinatários, ele fica **inalcançável**. Não há
condição a manter, nem expressão a não apagar: o caminho até a marcação
simplesmente não existe quando a lista está vazia.

Consequência prática: as inaugurações do dia continuam com `email_enviado_em`
`NULL` e seguem candidatas. Nada é perdido — o aviso simplesmente não sai
naquela execução.

**O preço dessa escolha, e ele é consciente:** a execução termina como
**sucesso**, sem nó vermelho no histórico. Não é barulhenta. A alternativa
barulhenta exigiria um sétimo nó (*Stop and Error*) só para isso, e o desenho
preferiu a garantia estrutural — a mais forte disponível — a um alerta a mais.
**Quem cuida da lista precisa saber disto:** desativar o último destinatário
desliga o aviso, sem erro nenhum aparecendo.

> **A ordem dos nós 2 e 3 não é o que protege a lista vazia** — e vale dizer,
> porque é a conclusão errada mais fácil de tirar daqui. Com as inaugurações
> primeiro, o nó de destinatários também sairia com 0 itens e o envio também não
> seria alcançado; a proteção vale nos dois sentidos, porque o que importa é o
> nó de destinatários estar **antes da marcação**, e ele está nas duas ordens.
> A inversão existe por outro motivo, na nota abaixo — que é igualmente
> obrigatório.

## Por que os destinatários vêm ANTES das inaugurações

O spec (§5) lista as inaugurações como passo 2 e os destinatários como passo 3.
**O arquivo faz o contrário, e é obrigatório que faça** — não é preferência de
layout.

O motivo é o que alimenta o nó Gmail. **Ele precisa iterar as inaugurações**: é
`$json.nome_unidade`, `$json.endereco`, `$json.data_inauguracao` que montam o
corpo do e-mail, e um nó do n8n produz um item de saída por item de **entrada**.
Como o HTTP Request sempre **substitui** a entrada pela resposta, quem estiver
imediatamente antes do Gmail define o que ele itera:

| Ordem | O que entra no Gmail | Resultado |
|---|---|---|
| Destinatários → Inaugurações → Gmail (**o arquivo**) | as linhas do banco | ✅ um e-mail por unidade, com os dados preenchidos, para a lista inteira |
| Inaugurações → Destinatários → Gmail (a do spec) | os endereços | ❌ **um e-mail por destinatário**, cada um com os campos da unidade em branco (`undefined`), porque `$json` ali é `{ email: ... }` |

> **Não reordene os nós 2 e 3.** O sintoma de ter reordenado é bem específico:
> **e-mails demais** — um por pessoa da lista em vez de um por unidade — e todos
> com Unidade, ID, Endereço, Data e Solicitante **vazios**.

Não existe arranjo linear que respeite a ordem do spec e ainda assim faça o
Gmail iterar inaugurações. As alternativas foram consideradas e descartadas: um
**ramo paralelo** (destinatários e Gmail saindo os dois do nó de inaugurações)
funciona, mas a ordem de execução de ramos no `executionOrder: v1` é resolvida
pela posição dos nós no canvas — arrastar um nó mudaria o comportamento, e o
Gmail passaria a ser alcançável com a lista vazia; e um **sétimo nó** só para
reorganizar isso não se paga.

O nó 3 está com **`Execute Once`** ligado justamente porque agora recebe N itens
(os destinatários) na entrada. Sem isso, ele faria uma consulta por destinatário
e devolveria cada inauguração N vezes — **o marketing receberia o mesmo aviso N
vezes**. Não desligue.

---

## O fuso — o detalhe que mais dói se estiver errado

Rodando **às 3h da manhã**, um deslocamento de fuso de poucas horas muda o *dia*
consultado. O aviso sairia um dia cedo ou um dia tarde — exatamente o que não
pode acontecer numa notificação de "hoje". Por isso o fuso está declarado em
dois lugares, e nenhum deles é o padrão da instância:

- **Quando dispara:** `settings.timezone = "America/Sao_Paulo"` no próprio
  workflow. O Schedule Trigger dá prioridade ao fuso do workflow sobre o da
  instância (`GENERIC_TIMEZONE`, que num self-hosted vem `America/New_York` por
  padrão). O nó **não tem** campo de fuso próprio — é no workflow mesmo.
- **Qual dia é consultado:** a URL do nó 3 usa
  `{{ $now.setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd') }}` — a data é
  calculada explicitamente em São Paulo, não no fuso da instância.

Se você mexer no workflow, **não troque nenhum dos dois por um valor implícito.**

---

## A ordem dos nós: e-mail ANTES da marcação

O nó 6 (marcar como enviado) vem **depois** do nó 4 (enviar e-mail). Isso é
deliberado, não descuido:

- **Como está:** se a marcação falhar, o e-mail já saiu e o marketing pode
  receber repetido numa reexecução. Incômodo, mas visível.
- **Se fosse invertido:** se o envio falhasse, a linha já estaria marcada como
  avisada e o aviso **nunca sairia** — ninguém receberia nada e ninguém ficaria
  sabendo.

Entre falhar barulhento e falhar em silêncio, o desenho escolheu barulhento.
**Não inverta os nós 4 e 6.**

---

## O nó 5 é uma trava, não enfeite

O nó **`So o que virou e-mail de verdade`** (um **Filter**) fica entre o envio e
a marcação e deixa passar só os itens que têm **`threadId`** — ou seja, o que a
API do Gmail de fato aceitou. Ele parece redundante e **não é**. Se alguém
apagar esse nó "para simplificar", volta o pior defeito possível deste workflow.

**O que ele impede.** O nó de e-mail tem duas maneiras diferentes de falhar:

| Tipo de falha | Exemplo | O que o n8n faz |
|---|---|---|
| **Por item** | O Gmail recusa o endereço de uma unidade | O item que falhou sai pela **saída de erro** (desconectada). As outras seguem. Tudo certo. |
| **De nível de nó** | **Credencial OAuth2 não selecionada, apagada, renomeada ou com o consentimento revogado** | O nó estoura **antes** do laço por item, e o motor repassa os **itens de entrada** — as linhas do banco, com `id` e `pairedItem` intactos — pela **saída principal**. A saída de erro nem chega a ser usada. |

É a segunda linha que faz o estrago: sem o filtro, as linhas do banco chegariam
ao nó de marcação, que gravaria `email_enviado_em` em **todas as unidades do
dia** sem **nenhum** e-mail ter saído. Ninguém recebe, ninguém fica sabendo, e no
dia seguinte a consulta não devolve mais nada porque está tudo marcado.

### Por que `threadId`, e por que não os outros dois campos

A resposta do nó Gmail traz `id`, `threadId` e `labelIds`. A escolha do campo
testado é crítica **nos dois sentidos**, e as duas alternativas óbvias estão
erradas:

| Campo | Está na resposta do Gmail? | Está na linha do banco? | O que aconteceria |
|---|---|---|---|
| `messageId` | **não** (era do SMTP/nodemailer) | não | A trava **bloquearia tudo**: nenhuma linha marcada, e o marketing recebendo o mesmo aviso todo dia até a inauguração passar |
| `id` | sim | **sim** (`inauguracao_requests.id`) | A trava **passaria tudo** — exatamente a falha silenciosa que ela existe para impedir |
| **`threadId`** | **sim** | **não** | ✅ É o único campo que distingue a resposta do Gmail de uma linha do banco |

Esta é a mudança mais fácil de errar na migração de SMTP para Gmail. Se você
mexer aqui, **releia esta tabela antes**.

---

## Como testar sem esperar até as 3h

1. Abra o workflow no n8n e clique em **Execute workflow** (ou **Test
   workflow**). O Schedule Trigger dispara na hora, sem esperar o agendamento.
2. Garanta que existe **pelo menos um destinatário ativo** (Hub → Inaugurações →
   Destinatários) e **pelo menos uma linha** em `inauguracao_requests` com
   `data_inauguracao` = **hoje** e `email_enviado_em` = `NULL`. No SQL Editor do
   Supabase:

   ```sql
   -- ver o que o workflow enxergaria agora
   select id, nome_unidade, data_inauguracao, email_enviado_em
     from public.inauguracao_requests
    where data_inauguracao = (now() at time zone 'America/Sao_Paulo')::date
      and email_enviado_em is null;

   -- e para quem ele mandaria
   select email from public.inauguracao_email_recipients
    where ativo order by email;
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
   resultado das duas consultas sem disparar nada.

**Nenhuma unidade inaugura hoje?** O nó 3 devolve lista vazia, os nós seguintes
não executam e o workflow termina em sucesso. Isso é o comportamento correto,
não um erro.

### Confira estes seis pontos na primeira execução manual

1. **Chegou um e-mail por unidade**, não um só com tudo dentro nem um por pessoa
   da lista. Se vier **um só**, veja "O único cenário que ainda exige ajuste"
   mais abaixo. Se vier **um por destinatário, com os dados da unidade em
   branco**, os nós 2 e 3 foram reordenados — ver "Por que os destinatários vêm
   ANTES das inaugurações".
2. **O campo Para trouxe TODOS os destinatários ativos**, não só um. Se vier só
   um endereço por e-mail, alguém trocou o `.all()` da expressão do `sendTo` por
   `.item` — ver "Os destinatários" acima.
3. **A data saiu por extenso em português** ("15 de setembro de 2026"). Se o mês
   veio em inglês, veja a tabela de formato mais abaixo.
4. **A linha ficou marcada:** rode o `select` do passo 2 de novo — a unidade
   avisada não deve mais aparecer.
5. **O teste da credencial ausente** — é o que valida a trava do nó 5, e vale a
   pena fazer **uma vez**, porque é o modo de falha que causaria o pior estrago
   em silêncio:

   1. Limpe a marcação da linha de teste (SQL do passo 3 acima).
   2. No nó `Enviar e-mail ao marketing`, **remova a credencial do Gmail**
      (ou renomeie a credencial, que dá no mesmo).
   3. **Execute o workflow.** Ele vai falhar no nó de e-mail — é o esperado.
   4. Rode o `select` do passo 2 e confirme que a linha de teste **continua
      aparecendo**, ou seja, `email_enviado_em` continua `NULL`.

   Se a linha aparecer marcada mesmo sem e-mail nenhum ter saído, **a trava do
   nó 5 não está funcionando** — pare, não ative o workflow, e confira se o nó
   `So o que virou e-mail de verdade` está presente, conectado entre o envio e
   a marcação, e testando **`threadId`** (não `id`, que passaria tudo).

   5. Recoloque a credencial e limpe a marcação antes de seguir.

6. **O teste da lista vazia** — vale uma vez, porque é a outra forma de perder o
   aviso em silêncio:

   1. Limpe a marcação da linha de teste (SQL do passo 3 acima).
   2. No Hub (Inaugurações → Destinatários), **desative todos** os destinatários.
   3. **Execute o workflow.** O esperado é ele terminar **sem enviar nada**: o
      nó `Buscar destinatarios ativos` sai com **0 itens** e os nós seguintes
      nem chegam a executar (aparecem sem execução no canvas).
   4. Rode o `select` do passo 2 e confirme que a linha de teste **continua
      aparecendo** com `email_enviado_em` `NULL`.

   Se a linha aparecer marcada, **a trava estrutural da lista vazia se perdeu** —
   confira se o nó `Buscar destinatarios ativos` continua **a montante** do nó
   `Marcar aviso como enviado`, e não em algum ramo paralelo a ele. (Um e-mail
   com o campo Para vazio **não** é o sintoma esperado aqui: sem destinatário o
   nó de envio nem chega a executar.)

   5. Reative os destinatários e limpe a marcação antes de seguir.

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
- **Lista vazia desliga o aviso em silêncio.** Sem destinatário ativo o
  workflow termina em sucesso sem enviar nada e sem marcar nada. É a garantia
  estrutural descrita em "Lista vazia" — e a contrapartida é que ninguém é
  alertado.
- **Duas unidades no mesmo dia** geram dois e-mails, um por unidade. É o
  pedido, não um defeito.
- **Se o envio de uma unidade falhar, só ela fica para trás.** O nó de e-mail
  está com *On Error → Continue (using error output)*. Numa falha com três
  unidades no dia, as outras duas seguem normalmente para a marcação; a que
  falhou sai pela saída de erro, que está **desconectada de propósito** — a
  linha fica sem `email_enviado_em` e volta a ser candidata no próximo ciclo.
  Como a consulta é sempre "hoje", esse próximo ciclo na prática só existe se
  você reexecutar o workflow manualmente **no mesmo dia**; passou da meia-noite,
  o aviso daquela unidade não sai mais (é a limitação "sem recuperação" acima).
- **O *Retry On Fail* cobre menos do que o nome sugere — e na primeira unidade
  pode duplicar.** O nó está com 3 tentativas e 5s de intervalo, e isso ajuda no
  caso transitório mais comum (API do Gmail devolvendo 5xx ou rate limit por
  alguns segundos). Mas o retry é do **nó inteiro**, não do item, e o n8n só
  decide reexecutar olhando o **primeiro item** da saída principal. Na prática:
  - falha na **1ª** unidade → o nó reexecuta **inteiro**, e as unidades que já
    tinham dado certo **recebem o e-mail de novo** (até 3 cópias);
  - falha na 2ª ou na 3ª, com a 1ª tendo dado certo → **nenhum retry acontece**;
    a que falhou simplesmente sai pela saída de erro.

  Não é motivo para tirar o retry — sem ele, o caso transitório também não é
  coberto. É motivo para **não confiar nele como rede de segurança**: com mais
  de uma unidade no mesmo dia, o comportamento depende de qual delas falhou.
- **Reexecutar manualmente depois de uma falha parcial não reenvia para quem já
  recebeu.** Quem recebeu já está marcado, e a consulta filtra
  `email_enviado_em=is.null`. O único caso em que ainda dá para receber
  repetido é o e-mail sair e o PATCH da própria linha falhar — bem mais raro, e
  é o incômodo que o desenho aceita de propósito para nunca ficar em silêncio
  (ver "A ordem dos nós").
- **A cota do Gmail vale.** A conta da credencial `Gmail account` tem limite
  diário de envio, e este workflow divide essa cota com os outros cinco
  workflows que usam a mesma credencial. Para o volume de inaugurações (uma
  ou duas por dia) está muito longe do teto, mas é bom saber que o teto existe.

---

## Formato do workflow — o que está confirmado e onde olhar se algo reclamar

Este JSON foi escrito **sem acesso a uma instância do n8n** — ele nunca foi
importado de verdade a partir deste arquivo. O que dá para garantir por
verificação local: é JSON válido, tem `name`/`nodes`/`connections`, cada nó tem
`type`/`typeVersion`/`position`/`parameters`, e as conexões ligam os seis nós na
ordem certa. O tipo, a `typeVersion` e o id da credencial do nó Gmail **foram
lidos da instância real** (do workflow `Midia Adicional - Notificacao por
email`), não chutados.

| Ponto | O que foi usado | Situação | Se der problema |
|---|---|---|---|
| `scheduleTrigger` `typeVersion` | `1.2` | **Confirmado** — é o que a documentação oficial usa nos exemplos de workflow | Se a instância for muito antiga, baixe para `1.1`; os parâmetros `rule.interval` são os mesmos |
| `httpRequest` `typeVersion` | `4.2` | **Confirmado** — versão atual, usada nos exemplos oficiais | Numa instância antiga, `4.1` aceita os mesmos parâmetros |
| `gmail` `typeVersion` e credencial | `n8n-nodes-base.gmail` v`2.1`, `gmailOAuth2` id `GfnvRU8IivJHJehE` | **Lido da instância real** — é exatamente o que o workflow de Mídia Adicional usa | Nada a fazer |
| Parâmetros do nó Gmail | `sendTo`, `subject`, `message`, `options.replyTo` | **Lidos da instância real** (mesmo workflow) | Nada a fazer |
| `emailType: "html"` e `options.appendAttribution: false` | Explicitados no arquivo | **Não verificados na instância** — o precedente não os traz. `emailType` é o padrão do nó (HTML) escrito por clareza; `appendAttribution: false` tira o rodapé "sent automatically with n8n" | Se o corpo chegar como texto cru com as tags à mostra, abra o nó e confira **Email Type = HTML**. Se `appendAttribution` for ignorado, o único efeito é o rodapé do n8n voltar |
| Fuso declarado no workflow, não no nó | `settings.timezone` | **Confirmado no código-fonte** — o `ScheduleTrigger` chama `this.getTimezone()`, que lê `workflow.settings.timezone`; o nó **não tem** campo de fuso próprio | Confira em *Workflow settings → Timezone*. Ver o alerta sobre copiar-e-colar no passo 2 da importação |
| Um e-mail por unidade | O HTTP Request v4 divide o array JSON da resposta em vários itens | **Confirmado no código-fonte** — `if (Array.isArray(response)) { response.forEach(...) }`, com `pairedItem` por elemento | Nada a fazer. **Não** insira um nó Split Out: ele é desnecessário e no cenário do fim desta seção até atrapalha |
| `executeOnce` no nó 3 | Propriedade de nó padrão do n8n (a mesma do toggle *Execute Once* na aba Settings do nó) | **Confirmado** — o motor reduz a entrada ao primeiro item; a **saída** continua sendo o array inteiro da resposta | Se o mesmo aviso chegar repetido tantas vezes quantos são os destinatários, é este toggle que foi desligado |
| `$('Buscar destinatarios ativos').all()` no `sendTo` | Referência a **todos** os itens de um nó anterior | **Confirmado** — `.all()` é a API documentada para ler o conjunto completo; `.item` pareia item a item e é justamente o que **não** serve aqui | Se cada e-mail sair para um destinatário só, alguém trocou por `.item` |
| `$('Buscar inauguracoes de hoje').item.json.id` no nó 6 | Referência ao item pareado do nó 3 | **Confirmado no código-fonte** para o `emailSend`, e o nó Gmail v2 empurra `pairedItem` do mesmo jeito (`constructExecutionMetaData` com `itemData`). Se o pareamento quebrasse, o n8n lança erro explícito em vez de marcar a linha errada em silêncio | Foi feito assim porque a saída do nó de e-mail é a resposta do Gmail (`id`, `threadId`, `labelIds`), **não** a linha do banco — `$json.id` ali seria o id da **mensagem**, e o PATCH não casaria linha nenhuma |
| `filter` `typeVersion` e o formato das condições | `2.2`, condições v2 com `operator: string/exists`, `singleValue: true` e `typeValidation: "loose"` | **Confirmado no código-fonte** — o nó registra as versões `{1, 2, 2.1, 2.2, 2.3}`, e o operador bate com a definição canônica `'string:exists': { type: 'string', operation: 'exists', singleValue: true }` (`FilterConditions/constants.ts`). O `singleValue: true` é necessário, não enfeite: é ele que faz o `filter-parameter.ts` pular a validação do `rightValue` vazio. E `={{ $json.threadId }}` é expressão única cobrindo a string inteira, então o n8n devolve o **valor cru** (`undefined` numa linha do banco), não a string `''` — se virasse `''`, o `exists` daria **true** e o guard deixaria passar tudo | Nada a fazer. **Não** troque pela alternativa do ternário na URL (descrita abaixo) sem necessidade: ela devolve a trava para dentro de uma expressão |
| Data por extenso em pt-BR | `DateTime.fromFormat(...).setLocale('pt-BR')` (Luxon) | Não verificado — depende do ICU do Node da instância | Se o mês vier em inglês, troque por `{{ $json.data_inauguracao.split('-').reverse().join('/') }}` para `dd/mm/aaaa` |

### A única ressalva de portabilidade: o Filter exige n8n ≥ 1.59.0

O nó `So o que virou e-mail de verdade` usa `typeVersion 2.2`, que **existe a
partir do n8n 1.59.0**. Numa instância mais antiga o nó importa como **versão
desconhecida** — ele aparece no canvas quebrado/não reconhecido, não com a
condição em branco. É o único ponto do workflow com piso de versão.

**O fallback é seguro:** baixe o `typeVersion` do Filter para `2` ou `2.1` (no
JSON, ou removendo e recriando o nó pela interface). **Isso não muda nada neste
guard.** A condição usada é `exists` sobre um valor ausente, e o `filter-parameter`
devolve o veredito para `null`/`undefined` **antes** de qualquer código sensível
a versão — o `version` das condições só afeta comparação de *boolean* e *number*,
que este filtro não usa.

Pelo mesmo motivo, `typeValidation: "loose"` é inócuo aqui: o curto-circuito do
valor ausente acontece antes da checagem de tipo, com `strict` ou `loose`. Está
posto por coerência, não por necessidade.

**Alternativa, se por algum motivo o Filter não servir na sua instância:** apague
o nó, ligue o e-mail direto na marcação e troque a URL do nó 6 por

```
?id=eq.{{ $json.threadId ? $('Buscar inauguracoes de hoje').item.json.id : '00000000-0000-0000-0000-000000000000' }}
```

O PATCH não casa nenhuma linha quando o e-mail não saiu, então protege igual.
**Só use se precisar** — a trava fica escondida numa expressão, dentro do próprio
nó que ela protege, que é justamente onde alguém vai "limpar" um ternário que não
parece ter a ver com marcar uma linha.

### O único cenário que ainda exige ajuste: a resposta interpretada como texto

Os nós 2 e 3 estão com o **autodetect** de formato de resposta do HTTP Request.
Se, por algum motivo, o PostgREST responder com um `Content-Type` que o n8n não
reconheça como JSON, ele cai no caminho de **texto** e embrulha tudo num único
item no formato `{ "data": "<a resposta inteira como string>" }`.

O sintoma no nó 3 é chegar **um** e-mail só, com os campos vazios ou com
`undefined`, em vez de um por unidade. No nó 2, é o campo **Para** sair com
`undefined` no lugar dos endereços.

**A correção não é um Split Out.** Nesse cenário `data` é uma *string*, não um
array — um Split Out em `data` falha. O ajuste é forçar o formato no nó afetado:

> Abra o nó → **Options** → **Add Option** → **Response** → **Response Format**
> → **JSON**.

No JSON isso corresponde a `parameters.options.response.response.responseFormat = "json"`.

---

## Nunca comite chave no arquivo

O JSON desta pasta vai para o Git. Se você preencher credenciais direto no
arquivo para testar, **não comite** — a chave de serviço ignora toda a RLS do
banco, e um segredo que entrou no histórico do Git não sai mais de verdade.

Antes de qualquer commit, procure por tokens longos (é o formato de qualquer
chave do Supabase, tanto a JWT antiga quanto a `sb_`... nova):

```bash
grep -rnE "[A-Za-z0-9_+/=-]{50,}" n8n/
```

O que voltar tem que ser olhado linha por linha. Hoje a única coisa que casa são
**caminhos de arquivo** citados neste README (`supabase/migrations/...`), que
obviamente não são segredo. O `id` da credencial do Gmail
(`GfnvRU8IivJHJehE`, 16 caracteres) também não é — é só o identificador interno
do n8n, não dá acesso a nada fora da instância.
