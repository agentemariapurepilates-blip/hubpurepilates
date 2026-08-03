# Aviso de inauguração por e-mail (N8N) — Design Spec

**Data:** 2026-08-01
**Status:** Decisões tomadas pelo Claude a pedido do usuário ("tudo será SIM, sem questionamentos")
**Depende de:** [2026-07-31-inauguracoes-design.md](2026-07-31-inauguracoes-design.md) — a tabela `inauguracao_requests` já existe no banco

---

## 1. Objetivo

No dia da inauguração, às 3h da manhã, o pessoal do marketing recebe um e-mail para **cada unidade** que inaugura naquele dia, com os dados que o colaborador preencheu. Assim a campanha começa a ser montada sem ninguém precisar lembrar de avisar.

## 2. Escopo

Um workflow no N8N que, todo dia às 3h (horário de São Paulo):

1. Consulta `inauguracao_requests` procurando as linhas cuja `data_inauguracao` é hoje e que ainda não foram avisadas.
2. Para cada linha, envia um e-mail ao grupo do marketing com: nome da unidade, ID, endereço, solicitante (nome e e-mail) e a data.
3. Marca a linha como avisada.

### Fora de escopo

- Tela no Hub para gerenciar quem recebe (ver §3).
- Lembrete com antecedência, segunda via, confirmação de leitura.
- Alterar a tela de Inaugurações. O trabalho aqui é banco + N8N.

## 3. Decisões, e por quê

| Decisão | Escolha | Razão |
|---|---|---|
| Como o N8N obtém os dados | Lê o Supabase direto, com a chave de serviço | É como ele já toca este banco (grava `brand_health_reports`). Criar endpoint novo no Hub seria uma peça a mais para manter, sem ganho. |
| Onde fica a lista de destinatários | **Tabela no Hub, gerenciada por admins** — revisado, ver §3.1 | Pedido explícito do usuário. Quem cuida da lista não precisa de acesso ao N8N. |
| Qual nó de e-mail | **Gmail** (`n8n-nodes-base.gmail` v2.1), credencial `Gmail account` (`GfnvRU8IivJHJehE`) — revisado, ver §3.2 | É o que a instância já usa em 5 workflows, incluindo o de Mídia Adicional. Um nó SMTP genérico exigiria credencial nova sem motivo. |
| Evitar e-mail repetido | Coluna nova `email_enviado_em` | Notificação agendada sem marcador de envio é o caminho garantido para o marketing receber cinco e-mails iguais quando alguém reexecutar o workflow. |
| Fuso do agendamento | `America/Sao_Paulo`, declarado no gatilho | O N8N usa o fuso da instância se nada for dito. Fuso implícito é onde o erro se esconde — mesma lição da regra das 48h. |
| Um e-mail por unidade | Sim, o workflow itera as linhas | Foi o pedido: "para cada unidade que será inaugurada". |
| Quem executa a entrega | Claude faz o N8N; as migrations dependem de token | Ver §7. |

### 3.1 Revisão: a lista de destinatários vem do Hub

A versão anterior deste spec colocava a lista dentro do workflow, por YAGNI. **O usuário decidiu o contrário:** admins gerenciam pelo Hub. É a escolha melhor — quem cuida de quem recebe não precisa ter acesso ao N8N, e a lista fica auditável junto com o resto.

Isso acrescenta ao escopo:

- Tabela `inauguracao_email_recipients` (§4.2), gerenciada só por admin.
- Uma aba **"Destinatários"** na tela `/inauguracoes`, visível **apenas para admin**, para adicionar, ativar/desativar e remover.
- Um passo a mais no workflow: buscar a lista antes de enviar.

A tela nasce vazia. Para referência, quem hoje recebe a notificação equivalente de Mídia Adicional (lida do workflow existente no N8N) são seis endereços — mas eles **não** são semeados no código: colocar e-mails de pessoas numa migration versionada é espalhar dado pessoal sem necessidade, e a lista certa para inaugurações pode não ser a mesma.

### 3.2 Revisão: Gmail, e o que isso quebra na trava

A instância do N8N usa o nó **Gmail** com OAuth2 (credencial `Gmail account`, id `GfnvRU8IivJHJehE`), em cinco workflows. Trocar `emailSend` por `gmail` tem uma consequência que passa despercebida:

| | Resposta do nó | Tem `messageId`? | Tem `id`? |
|---|---|---|---|
| `emailSend` (SMTP) | `info` do nodemailer | **sim** | não |
| `gmail` | resposta da API do Gmail | **não** | **sim** |

A trava (§5) testa `messageId`. Com o nó Gmail ela **bloquearia tudo** — nenhum aviso seria marcado, e o marketing receberia repetido todo dia. E trocar ingenuamente para `id` seria pior: **as linhas do banco também têm `id`**, então a trava passaria tudo, que é exatamente a falha silenciosa que ela existe para impedir.

**A trava passa a testar `threadId`** — presente na resposta do Gmail, ausente nas linhas do banco.

## 4. Mudança no banco

Migration nova, pequena:

```sql
ALTER TABLE public.inauguracao_requests
  ADD COLUMN IF NOT EXISTS email_enviado_em timestamptz;

COMMENT ON COLUMN public.inauguracao_requests.email_enviado_em IS
  'Quando o aviso de inauguracao foi enviado ao marketing pelo workflow do n8n. NULL = ainda nao avisado.';

CREATE INDEX IF NOT EXISTS inauguracao_requests_aviso_pendente_idx
  ON public.inauguracao_requests (data_inauguracao)
  WHERE email_enviado_em IS NULL;
```

O índice é parcial de propósito: a consulta do workflow procura sempre por linhas não avisadas, e um índice sobre elas é minúsculo mesmo com a tabela crescendo.

**A RLS não muda.** O workflow usa a chave de serviço, que passa por cima da RLS. Nenhuma policy nova é necessária, e nenhum usuário do Hub ganha ou perde acesso — a coluna nova é visível a quem já via a linha.

### 4.2 Tabela dos destinatários

```sql
CREATE TABLE public.inauguracao_email_recipients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  nome       text,
  ativo      boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inauguracao_email_recipients_email_unico UNIQUE (email)
);
```

`ativo` existe para desligar alguém sem perder o registro de que ele já esteve na lista — quem sai de férias ou muda de área volta com um clique, e o histórico não some.

O `UNIQUE (email)` evita o erro mais provável de operação: duas pessoas cadastrando o mesmo endereço e o marketing recebendo dois e-mails idênticos.

**RLS: só admin, em tudo.**

```sql
ALTER TABLE public.inauguracao_email_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Somente admin gerencia destinatarios"
  ON public.inauguracao_email_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
```

Uma policy `FOR ALL` cobre leitura e escrita, e é honesta quanto à intenção: esta tabela é assunto de administrador. Colaborador não precisa saber quem recebe, e o workflow lê com chave de serviço, que ignora RLS.

## 5. O workflow

Seis passos — **revisado** para ler os destinatários do Hub (§3.1) e usar Gmail (§3.2):

| # | Nó | O que faz |
|---|---|---|
| 1 | **Schedule Trigger** | Todo dia às 03:00, fuso `America/Sao_Paulo` |
| 2 | **HTTP Request** (GET) | `{SUPABASE_URL}/rest/v1/inauguracao_requests?select=*&data_inauguracao=eq.{hoje}&email_enviado_em=is.null` |
| 3 | **HTTP Request** (GET) | `.../inauguracao_email_recipients?select=email&ativo=is.true` — a lista, do Hub |
| 4 | **Gmail** | Um e-mail por inauguração, para todos os destinatários ativos |
| 5 | **Filter** | Deixa passar só o que virou e-mail de verdade (testa `threadId`, ver §3.2) |
| 6 | **HTTP Request** (PATCH) | Grava `email_enviado_em` na linha |

**Se a lista de destinatários estiver vazia**, não há para quem enviar. O workflow não deve marcar as linhas nesse caso — senão o aviso se perde em silêncio e ninguém descobre. Sem destinatário, ele falha barulhento, coerente com o resto do desenho.

**A data de hoje** vem de `{{ $now.setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd') }}` — não do fuso da instância do N8N. Rodando às 3h, um deslocamento de fuso mudaria o dia consultado e o aviso sairia um dia cedo ou tarde.

**Se nenhuma unidade inaugura hoje**, o passo 2 devolve lista vazia e o workflow termina sem enviar nada. Não é erro.

**Ordem importa:** o e-mail vai antes da marcação. Se a marcação falhar, o marketing pode receber repetido no dia seguinte — incômodo. Se fosse o contrário e o e-mail falhasse, a linha ficaria marcada e o aviso nunca sairia — que é pior. Entre falhar barulhento e falhar em silêncio, escolhi barulhento.

### O e-mail

Assunto: `Inauguração hoje — {nome_unidade}`

Corpo com: nome da unidade, ID, endereço, data por extenso em pt-BR, e o solicitante (nome e e-mail) para o marketing saber com quem falar.

## 6. Casos de borda

| Situação | Comportamento |
|---|---|
| Nenhuma inauguração hoje | Workflow roda, não envia nada, termina |
| Duas unidades no mesmo dia | Dois e-mails, um por unidade |
| Workflow reexecutado no mesmo dia | Não reenvia — as linhas já têm `email_enviado_em` |
| N8N fora do ar às 3h | O aviso do dia não sai. Sem recuperação automática: a consulta é sempre "hoje". Registrado como limitação em §8. |
| Solicitação criada às 2h do dia da inauguração | É pega no ciclo das 3h do mesmo dia |
| Solicitação criada às 10h do dia da inauguração | **Não é avisada** — as 3h já passaram. Limitação conhecida, §8. |
| Envio falha | A linha fica sem marcação e o aviso sai no próximo ciclo (que, sendo "hoje", só existe se ainda for o mesmo dia) |

## 7. O que eu entrego, e o que depende de você

**Entrego:** o arquivo da migration, o JSON do workflow pronto para importar, e a documentação de configuração.

**Não faço, e não tenho como fazer:** aplicar a migration e importar/ligar o workflow no N8N. Não tenho acesso à instância de vocês nem credenciais, e aplicar migration é mexer em produção — fora da regra de trabalho local que vale desde o início.

Você faz três coisas: roda o SQL no Supabase, importa o JSON no N8N, e preenche lá as credenciais e a lista de destinatários.

## 8. Limitações conhecidas

- **Sem recuperação.** A consulta é sempre "hoje". Se o N8N estiver fora do ar às 3h, aquele dia não é avisado. Consultar "hoje ou antes, não avisado" resolveria, mas avisaria retroativamente inaugurações antigas na primeira execução — pior. Fica como está.
- **Solicitação criada depois das 3h do próprio dia não é avisada.** Quem cadastra uma inauguração no mesmo dia já sabe dela; o valor do aviso está nas cadastradas com antecedência.
- **A lista de destinatários vive no N8N.** Quem for mexer precisa de acesso lá. É a contrapartida consciente de não construir uma tela para isso.
