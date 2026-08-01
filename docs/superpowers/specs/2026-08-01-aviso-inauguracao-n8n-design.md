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
| Onde fica a lista de destinatários | **No próprio workflow do N8N** | São poucas pessoas, que mudam raramente, e o N8N tem interface de edição. Uma tabela + tela de administração para três e-mails é desproporcional. Mover para o Hub depois custa pouco. |
| Evitar e-mail repetido | Coluna nova `email_enviado_em` | Notificação agendada sem marcador de envio é o caminho garantido para o marketing receber cinco e-mails iguais quando alguém reexecutar o workflow. |
| Fuso do agendamento | `America/Sao_Paulo`, declarado no gatilho | O N8N usa o fuso da instância se nada for dito. Fuso implícito é onde o erro se esconde — mesma lição da regra das 48h. |
| Um e-mail por unidade | Sim, o workflow itera as linhas | Foi o pedido: "para cada unidade que será inaugurada". |
| Quem executa a entrega | **O usuário** | Ver §7. |

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

## 5. O workflow

Quatro passos, entregues como arquivo JSON importável:

| # | Nó | O que faz |
|---|---|---|
| 1 | **Schedule Trigger** | Todo dia às 03:00, fuso `America/Sao_Paulo` |
| 2 | **HTTP Request** (GET) | `{SUPABASE_URL}/rest/v1/inauguracao_requests?select=*&data_inauguracao=eq.{hoje}&email_enviado_em=is.null` |
| 3 | **Send Email** | Um por linha retornada |
| 4 | **HTTP Request** (PATCH) | Grava `email_enviado_em` na linha |

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
