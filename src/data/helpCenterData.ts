import {
  Users,
  Calendar,
  CreditCard,
  Megaphone,
  Settings,
  MessageSquare,
  Play,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Shield,
  Bot,
  Layers,
  LucideIcon,
} from "lucide-react";

export interface Section {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  articles: Article[];
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  tags?: string[];
}

export const helpCenterSections: Section[] = [
  {
    id: "treinamento-sistema",
    title: "Treinamento Sistema",
    description: "Aprenda a acessar e navegar pelo sistema Pure Pilates",
    icon: GraduationCap,
    color: "hsl(270 65% 45%)",
    articles: [
      {
        id: "primeiro-acesso",
        title: "Primeiro Acesso ao Sistema",
        summary: "Como fazer login e configurar sua conta pela primeira vez",
        content: `
# Primeiro Acesso ao Sistema

O sistema Pure foi desenvolvido para facilitar a gestão das unidades, centralizando informações de alunos, planos, pagamentos e agendamentos em um único lugar. A ideia é que você consiga resolver o máximo possível dentro da própria plataforma, reduzindo erros e ganhando tempo no atendimento.

---

## 🔗 Links Importantes

| Plataforma | Link |
|------------|------|
| **Sistema Web** | [admin.purepilates.com.br](https://admin.purepilates.com.br/purepilates/publish.htm) |
| **App Android** | [Google Play](https://play.google.com/apps/testing/br.com.purepilates) |
| **App iOS** | [TestFlight](https://testflight.apple.com/join/bxP2Dudu) |

---

## 🔐 Como fazer Login

![Tela de Login](/images/manual/login-screen.png)

1. Acesse o link do sistema
2. Digite seu **usuário**: \`nome.sobrenome\`
3. Digite sua **senha**: Os **6 primeiros dígitos do CPF**
4. Clique em **Entrar**

> ⚠️ **Importante**: Verifique se a sua versão está sempre atualizada!
> 
> **Versão atual: 4.1.0.51**

---

## 🔑 Senha Master

Em casos especiais, a senha master é: **0904PURE1**

---

## 💡 Dica Importante

> O acesso deve ser feito sempre pelo **perfil correto**. Cada função (gestor, professor, consultor etc.) tem permissões diferentes dentro do sistema.
>
> Usar o perfil errado pode limitar as ações disponíveis ou gerar registros incorretos.
        `,
        tags: ["login", "acesso", "senha", "primeiro acesso", "app"],
      },
      {
        id: "menu-usuario",
        title: "Menu do Usuário",
        summary: "Entenda as opções disponíveis no menu de usuário",
        content: `
# Menu do Usuário

Ao entrar no sistema, você terá acesso ao menu na parte inferior com várias opções importantes para gerenciar sua conta.

![Menu do Usuário](/images/manual/menu-usuario.jpg)

---

## 🔐 Alterar Senha

![Alterar Senha](/images/manual/alterar-senha.png)

Para alterar sua senha:

1. Clique em **Alterar Senha** no menu
2. Digite a **senha atual**
3. Digite a **nova senha** (mínimo 6 caracteres)
4. **Confirme** a nova senha
5. Clique em **Confirmar**

---

## ✍️ Obter Assinatura

![Obter Assinatura](/images/manual/obter-assinatura.png)

A assinatura digital é utilizada em:
- ✅ Contratos
- ✅ Recibos emitidos por você

**Como configurar:**

1. Clique em **Obter Assinatura**
2. Digite sua senha para liberação de acesso
3. Desenhe sua assinatura no campo indicado
4. Clique em **Enviar**

> 📝 Não esqueça que nosso padrão de senha é sempre os **6 primeiros dígitos do CPF**

---

## 📋 Dados Cadastrais

Verifique e atualize seus dados cadastrados no sistema:

- Nome e Apelido
- Data de Nascimento
- Dados de Contato (Email, Telefones)
- Documentos

---

## 🚪 Encerrar Sessão

Quando precisar sair do sistema, use esta opção para encerrar sua sessão de forma segura.

> ⚠️ Sempre encerre a sessão ao terminar de usar o sistema, especialmente em computadores compartilhados.
        `,
        tags: ["menu", "senha", "assinatura", "perfil", "configurações"],
      },
      {
        id: "tela-inicial",
        title: "Navegando na Tela Inicial",
        summary: "Conheça o painel principal e os atalhos disponíveis",
        content: `
# Navegando na Tela Inicial

Ao entrar no sistema, você verá o painel principal com os atalhos para as funções mais usadas no dia a dia.

![Tela Inicial](/images/manual/tela-inicial.jpg)

---

## 📊 Elementos do Painel

### 📬 Notificações

Na tela inicial você encontra dois indicadores importantes:

| Notificação | Descrição |
|-------------|-----------|
| **Publicações** | Fotos publicadas pelos alunos aguardando sua aprovação |
| **Avaliações** | Avaliações feitas ao Studio para revisão |

---

### 📋 Dicas de Navegação

Atalhos rápidos para as funções mais utilizadas no dia a dia.

---

### 💰 Tabela de Preços

> ⚠️ **Atenção**: Cada tabela tem um valor conforme a região. Verifique a sua no sistema!

---

### 🤖 Pure GPT

Assistente de IA integrado ao sistema para ajudar com dúvidas e tarefas.

---

### ℹ️ Informações do Sistema

No rodapé você encontra:
- **Versão** atual do sistema
- **Data** de acesso

---

## 🎯 Próximos Passos

Agora que você conhece a tela inicial, explore o menu completo começando pela **Agenda** - sua principal ferramenta de trabalho diário!
        `,
        tags: ["tela inicial", "navegação", "notificações", "atalhos", "dashboard"],
      },
    ],
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Gestão completa de alunos, planos e aulas",
    icon: Users,
    color: "hsl(200 70% 50%)",
    articles: [
      {
        id: "agenda",
        title: "Agenda de Aulas",
        summary: "Como visualizar e gerenciar a agenda da sua unidade",
        content: `
# Agenda de Aulas

A agenda é sua **principal ferramenta** para gerenciar a rotina da unidade. Nela você tem acesso a todas as informações importantes do dia.

![Agenda de Aulas](/images/manual/agenda.jpg)

---

## 📅 Informações Disponíveis

| Campo | Descrição |
|-------|-----------|
| **Data** | Data atual ou selecionada |
| **Unidades** | Suas unidades (se tiver mais de uma) 🏬 |
| **Calendário** | Navegação entre datas 🗓 |
| **Hora da Aula** | Horários disponíveis |
| **Professores** | ED (Educador Físico) ou FT (Fisioterapeuta) |
| **Nome do Aluno** | Com indicadores especiais |
| **Tipo de Aula** | Mensalista, Wellhub, Experimental, etc. |

---

## 🏷️ Tipos de Aula

- **Mensalista** - Aluno com plano fixo
- **Wellhub Booking** - Agendamento via Wellhub
- **Experimental** - Aula experimental
- **Experimental Wellhub** - Experimental via agregador
- **Avulsa** - Aula única
- **Pacote** - Créditos de pacote
- **Reposição** - Aula de reposição

---

## ⚠️ Indicadores Especiais

| Símbolo | Significado |
|---------|-------------|
| **⁕** | Aluno com **pendência financeira** |
| **⚠️** | Horário com alguma **restrição** |
| **🚫** | Horário **indisponível** |
| **⁕** | Aluno **não fez checkin** pelo Wellhub |

---

## 🖱️ Menu Suspenso (Clique com Botão Direito)

![Menu Suspenso](/images/manual/menu-suspenso.jpg)

Ao clicar com o **botão direito** no aluno, você acessa:

- ❌ Marcar Falta
- 📝 Cadastro
- 📋 Planos e Aulas
- 🔄 Reposições
- ❌ Aulas Excluídas ou Canceladas
- 📊 Análise de Frequência
- 💳 Pagamentos
- 💳 Perfis de Pagamento
- 📋 Prontuário
- 📝 Ficha de Avaliação
- 📜 Histórico Pessoas
- ✏️ Inserir Histórico
- 👨‍🏫 Alterar Professor
- 📧 Enviar senha de acesso
- 📱 Chamar no WhatsApp Web
        `,
        tags: ["agenda", "aulas", "horários", "professores", "rotina"],
      },
      {
        id: "marcar-falta",
        title: "Marcando Faltas",
        summary: "Regras e procedimentos para marcar faltas de alunos",
        content: `
# Marcando Faltas

O sistema de faltas está diretamente ligado ao direito de reposição do aluno. É importante entender as regras para marcar corretamente.

![Marcar Falta](/images/manual/marcar-falta.png)

---

## ✅ Com Direito a Reposição

### Falta avisada de 3h a 24h de antecedência
➡️ **14 dias** corridos para reposição

### Falta avisada com mais de 24h de antecedência
➡️ **21 dias** corridos para reposição

---

## ❌ Sem Direito a Reposição

- Avisado **após as 3h** de antecedência
- **Falta sem aviso** prévio
- **Aulas em feriados** não têm reposição

---

## 📋 Como Marcar a Falta

1. Na agenda, clique com o **botão direito** no aluno
2. Selecione **"Marcar Falta"**
3. O sistema perguntará:
   - **Com reposição** (avisou com antecedência)
   - **Sem reposição** (não avisou ou avisou tarde)
4. Confirme a ausência

> ⚠️ **Atenção**: O sistema registra automaticamente se a falta foi avisada dentro do prazo para calcular os dias de reposição.

---

## 📌 Resumo das Regras

| Antecedência do Aviso | Prazo para Repor |
|----------------------|------------------|
| Mais de 24h | 21 dias |
| 3h a 24h | 14 dias |
| Menos de 3h | Sem reposição |
| Sem aviso | Sem reposição |
| Feriado | Sem reposição |
        `,
        tags: ["falta", "ausência", "reposição", "antecedência"],
      },
      {
        id: "cadastro-aluno",
        title: "Cadastro de Alunos",
        summary: "Como cadastrar e editar informações de alunos",
        content: `
# Cadastro de Alunos

O cadastro completo do aluno é fundamental para o bom funcionamento do sistema e comunicação eficiente.

![Cadastro de Cliente](/images/manual/cadastro-cliente.jpg)

---

## 📝 Informações Principais

### Dados Pessoais

| Campo | Obrigatório |
|-------|-------------|
| Nome completo | ✅ Sim |
| Apelido | Não |
| Data de nascimento | Recomendado |
| Sexo | ✅ Sim |

---

### Dados de Contato

| Campo | Uso |
|-------|-----|
| **Email** | Envio de contratos, senhas e comunicados |
| **Tel. Residencial** | Contato alternativo |
| **Tel. Comercial** | Contato alternativo |
| **Celular (WhatsApp)** | Principal canal de comunicação |

> 💡 **Dica**: Sempre cadastre o WhatsApp para facilitar a comunicação rápida!

---

### Documentos

- **País**: Brasil (padrão)
- **Tipo**: CPF, RG, etc.
- **Número**: Documento do cliente

---

### Outras Informações

- **Como ficou sabendo da Pure Pilates?** - Importante para marketing
- **Interesses** - Objetivos do aluno com o Pilates
- **Observações** - Notas importantes sobre o cliente

---

## 🔒 Status do Aluno

| Status | Descrição |
|--------|-----------|
| ✅ **Matriculado** | Aluno ativo com plano |
| 🔒 **Bloqueado** | Acesso restrito (não se aplica ao Wellhub) |

---

## 📧 Campos do Wellhub

Para alunos que vêm via Wellhub, o sistema preenche automaticamente:
- **Wellhub ID** - Identificador único do parceiro
- **Tipo de Plano** - Silver, Gold, Platinum, etc.
        `,
        tags: ["cadastro", "aluno", "cliente", "informações", "dados"],
      },
      {
        id: "planos-aulas",
        title: "Planos e Aulas",
        summary: "Gerenciamento de planos mensalistas e horários fixos",
        content: `
# Planos e Aulas

Esta é a tela central para gerenciar todos os planos e aulas do aluno. Aqui você tem controle total sobre matrículas, pagamentos e agendamentos.

![Planos e Aulas](/images/manual/planos-aulas.jpg)

---

## 📋 Tipos de Planos

### 🔄 Horário Fixo (Mensalista)

Planos **recorrentes** com aulas em dias e horários fixos.

![Cadastro de Planos](/images/manual/cadastro-planos.png)

---

## 💰 Tabela de Preços por Programa

| Programa | 1x semana | 2x semana | 3x semana | Carência |
|----------|-----------|-----------|-----------|----------|
| **Barrel** | R$ 319 | R$ 509 | R$ 689 | Sem carência |
| **Chair** | 4x R$ 259 | 4x R$ 419 | 4x R$ 589 | 4 meses |
| **Reformer** | 6x R$ 239 | 6x R$ 389 | 6x R$ 539 | 6 meses |
| **Cadillac** | 12x R$ 219 | 12x R$ 359 | 12x R$ 479 | 12 meses |

> ⚠️ Os valores podem variar conforme a tabela da sua região!

---

## ➕ Como Incluir um Plano

### Passo 1: Acessar a tela
1. Acesse **"Planos e Aulas"** no menu do aluno
2. Clique em **"Inserir"**

### Passo 2: Preencher informações

| Campo | Descrição |
|-------|-----------|
| **Unidade** | Onde as aulas serão realizadas |
| **Plano** | Qual programa o aluno escolheu |
| **Data de início** | Quando começa |
| **Valor total** | Com desconto se aplicável |
| **Renovações com desconto** | Quantas vezes o desconto será aplicado |
| **Forma de pagamento** | Cartão, boleto, PIX |
| **Dados da aula** | Dia, hora e professor |

### Passo 3: Confirmar

> 💡 Ao finalizar, o sistema lembrará de **enviar a senha de acesso ao App** para o aluno!

---

## 🗑️ Excluir um Plano

> ⚠️ **ATENÇÃO**: A exclusão de um plano afeta diretamente a agenda e o pagamento dos professores!
>
> TODOS os contratos enviados para esse plano serão **permanentemente excluídos** e não poderão ser recuperados.

Use apenas em caso de:
- Não uso do programa
- Não pagamento
        `,
        tags: ["planos", "mensalista", "horário fixo", "aulas", "matrícula"],
      },
      {
        id: "reposicoes",
        title: "Reposições de Aulas",
        summary: "Regras e gerenciamento de reposições",
        content: `
# Reposições de Aulas

O sistema de reposições garante que os alunos possam recuperar aulas perdidas dentro das regras estabelecidas.

![Histórico de Reposições](/images/manual/reposicoes.jpg)

---

## 📋 Regras de Reposição

| Antecedência do Aviso | Prazo para Repor |
|----------------------|------------------|
| Mais de 48h | **21 dias** corridos |
| 3h a 24h | **14 dias** corridos |
| Menos de 3h | ❌ Sem direito |
| Sem aviso | ❌ Sem direito |
| Feriado | ❌ Não tem reposição |

---

## 💡 Informações Importantes

### 💰 Pagamento ao Professor
O valor da aula de reposição é **repassado ao professor** do horário da reposição, não ao professor original.

### 🏢 Reposição em Outra Unidade
- O aluno **pode fazer reposição em outra unidade** se a sua não tiver horário
- As unidades fazem o repasse entre si
- É cobrada uma **taxa administrativa**

> 💡 Se as duas unidades forem do **mesmo franqueado**, essa taxa pode ser isenta como diferencial comercial!

---

## 📱 Agendamento pelo App

| Tipo de Aluno | Visualização |
|---------------|--------------|
| **Mensalistas** | Até **14 dias** |
| **Wellhub** | Configurado pelo franqueado (7 ou 14 dias) |

---

## ⏰ Tolerância

O aluno tem tolerância de até **15 minutos** para o início da aula.

> ⚠️ Remarcações dependem da disponibilidade da agenda e do professor. Em algumas unidades, quando não há alunos agendados, o professor não é obrigado a permanecer no local.

---

## 📊 Tela de Reposições

Na tela de reposições você visualiza:
- Unidade da aula original
- Data e hora da aula
- Data do aviso de falta
- Quem avisou
- Validade da reposição
- Status (Pendente, Agendada, Realizada, Expirada)
        `,
        tags: ["reposição", "falta", "agendamento", "prazo"],
      },
      {
        id: "interrupcoes",
        title: "Interrupções de Plano",
        summary: "Férias, atestados e pausas nos planos",
        content: `
# Interrupções de Plano

As interrupções permitem pausar o plano do aluno temporariamente, seja por férias ou questões médicas.

![Interrupções](/images/manual/interrupcoes.jpg)

---

## 🏖️ Prazos para Férias por Plano

| Plano | Dias de Férias |
|-------|----------------|
| **Chair** | Até **7 dias** |
| **Reformer** | Até **15 dias** |
| **Cadillac** | Até **30 dias** |

---

## 📋 Tipos de Interrupção

### 🏖️ Férias
Pausas programadas conforme o plano contratado.

### 🏥 Atestado Médico
- Pausa por questões de saúde
- Requer documentação comprobatória
- Pode ser enviado pelo sistema

---

## ➕ Como Cadastrar uma Interrupção

1. Acesse **"Planos e Aulas"** do aluno
2. Clique em **"Interrupções"**
3. Selecione o **motivo**:
   - Férias
   - Atestado Médico
   - Outro
4. Defina as **datas de início e fim** da pausa
5. Defina as **datas de retomada**
6. Clique em **Confirmar**

---

## 🔄 Opções Disponíveis

| Ação | Descrição |
|------|-----------|
| **Atualizar** | Atualiza a lista |
| **Inserir** | Nova interrupção |
| **Excluir** | Remove interrupção |
| **Enviar** | Envia atestado |
| **Visualizar** | Vê detalhes |

---

## ↩️ Botão Desfazer

> ⚠️ Fica ativo por **no máximo 24hrs**!
>
> Use em casos de necessidade de desfazer algum movimento no cadastro do aluno.
        `,
        tags: ["interrupção", "férias", "atestado", "pausa", "descanso"],
      },
      {
        id: "alterar-professor",
        title: "Alteração de Professor",
        summary: "Como trocar professor de uma aula eventual ou definitivamente",
        content: `
# Alteração de Professor

Essa funcionalidade permite trocar o professor de uma aula, seja de forma eventual ou definitiva.

![Alterar Professor](/images/manual/alterar-professor.png)

---

## 🔄 Tipos de Troca

### Troca Eventual
- Para uma **aula específica**
- Professor substituto apenas naquele dia
- Usado em casos de falta do professor

### Troca Definitiva
- **Mudança permanente** de professor
- Afeta todas as aulas futuras
- Usado em casos de saída ou realocação

---

## 📋 Como Fazer a Troca

### Troca Simples (Uma Aula)

1. Clique com botão direito no aluno na agenda
2. Selecione **"Alterar Professor"**
3. Escolha **"Troca eventual"** ou **"Troca definitiva"**
4. Selecione o **novo professor**
5. Confirme

---

### Alteração em Lote

Para trocar o professor de **várias aulas de uma vez**:

1. Marque a opção **"Alteração em Lote"**
2. Defina:
   - **Período**: Data início e fim
   - **Horários**: Quais horários serão afetados
   - **Dias da semana**: Quais dias
3. Selecione o professor que **está saindo**
4. Selecione o professor que **está entrando**
5. Confirme

---

## ⚠️ Opção "Sem Professor"

> Selecione se esta aula **não deve gerar pagamento**.
>
> Usado em casos especiais onde a aula ocorre sem professor designado.

---

## 💡 Dica

Após a troca, verifique na agenda se a alteração foi aplicada corretamente em todos os dias afetados.
        `,
        tags: ["professor", "troca", "substituição", "alteração"],
      },
    ],
  },
  {
    id: "agregadores",
    title: "Agregadores",
    description: "PurePass, Wellhub e outros parceiros",
    icon: Layers,
    color: "hsl(340 70% 50%)",
    articles: [
      {
        id: "purepass",
        title: "PurePass",
        summary: "Gerenciamento de pacotes por assinatura",
        content: `
# PurePass

O PurePass é o programa de **pacotes por assinatura** da Pure Pilates, oferecendo flexibilidade para alunos que não querem compromisso de horário fixo.

![PurePass](/images/manual/purepass.jpg)

---

## 📋 Tipos de Programas

### 🔒 Com Fidelidade

| Característica | Descrição |
|---------------|-----------|
| **Unidade Favorita** | Precisa escolher uma unidade |
| **Gerenciamento** | Feito pela unidade escolhida |
| **Cancelamento** | Apenas com o gestor da unidade |
| **Valor** | Menor que sem fidelidade |

### 🔓 Sem Fidelidade

| Característica | Descrição |
|---------------|-----------|
| **Unidade** | Pode usar qualquer uma |
| **Gerenciamento** | Todo do aluno |
| **Cancelamento** | Flexível |
| **Valor** | Maior que com fidelidade |

---

## 📊 Informações do Pacote

Na tela do PurePass você visualiza:

| Campo | Descrição |
|-------|-----------|
| **Nome** | Nome do pacote |
| **Status** | Ativo ou Inativo |
| **Créditos** | Total de créditos |
| **Créditos Herdados** | De planos anteriores |
| **Disponíveis** | Quantos ainda podem usar |
| **Valor** | Valor total pago |
| **Valor Unitário** | Preço por aula |
| **Vencimento** | Data limite para uso |

---

## 🎯 Agendamento de Aulas

Após inserir o pacote, é necessário **agendar as aulas**:

1. Selecione o pacote do aluno
2. Clique em **"Agendar"**
3. Escolha:
   - Unidade
   - Data
   - Hora
   - Professor
4. Confirme

> 💡 O aluno também pode agendar pelo **App da Pure Pilates**!
        `,
        tags: ["purepass", "pacote", "assinatura", "créditos", "flexibilidade"],
      },
      {
        id: "wellhub",
        title: "Wellhub (Gympass)",
        summary: "Integração e gerenciamento de alunos Wellhub",
        content: `
# Wellhub (Gympass)

O Wellhub é um dos principais agregadores de alunos da Pure Pilates. Esta seção explica como gerenciar os alunos que vêm por essa parceria.

![Wellhub](/images/manual/wellhub.jpg)

---

## 📊 Tela de Wellhub

### Informações Disponíveis

| Campo | Descrição |
|-------|-----------|
| **Wellhub ID** | Identificador único do aluno |
| **Unidade** | Onde fez checkin |
| **Cliente** | Nome do aluno |
| **Data Aula** | Data da aula |
| **Hora** | Horário do checkin |
| **Tipo Plano** | Silver, Gold, Platinum |
| **Status** | Sucesso ou Erro |

---

## ⚠️ Sistema de Alertas

### Alerta 3 - Falta de Associação do Aluno

**Problema**: Cliente desconhecido fez checkin (não está na agenda)

**Solução**:
1. Vá em **"Todos os Clientes Booking"**
2. Encontre as informações do aluno pelo **ID**
3. Volte à tela de alertas
4. Clique em **"Associar Cliente"**
5. Pesquise e selecione o aluno
6. Confirme

---

### Alerta 4 - Falta de Associação da Aula

**Problema**: Cliente conhecido, mas checkin não reconhecido

**Solução**:
1. Se a aula **já está na agenda**:
   - Clique no alerta
   - Clique em **"Associar Aula"**
   - Confirme

2. Se a aula **não está na agenda**:
   - Primeiro, lance o pacote no sistema
   - Depois, associe a aula

---

## 📋 Booking Log

Detalhes sobre agendamentos no app Wellhub:

| Campo | Descrição |
|-------|-----------|
| **Data** | Quando ocorreu |
| **Tipo** | Agendamento ou Cancelamento |
| **Unidade** | Local |
| **Wellhub ID** | ID do aluno |
| **Status** | Sucesso ou Erro |
| **Motivo** | Razão do erro (se houver) |

---

## 📱 Indicadores na Agenda

| Símbolo | Significado |
|---------|-------------|
| ⁕ | Aluno não fez checkin pelo Wellhub |
| ⚠️ | Alerta de booking pendente |
        `,
        tags: ["wellhub", "gympass", "checkin", "booking", "agregador", "alerta"],
      },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Pagamentos, receitas, despesas e fechamento",
    icon: CreditCard,
    color: "hsl(150 60% 45%)",
    articles: [
      {
        id: "pagamentos",
        title: "Pagamentos de Alunos",
        summary: "Visualização e geração de recibos",
        content: `
# Pagamentos de Alunos

Esta tela centraliza todas as informações de pagamentos dos alunos, permitindo visualizar histórico, gerar recibos e gerenciar cobranças.

![Pagamentos](/images/manual/pagamentos.jpg)

---

## 📋 Tipos de Referência

| Referência | Descrição |
|------------|-----------|
| **Mensalidade** | Pagamento mensal do plano |
| **Encerramento de contrato** | Valores de rescisão |
| **Interrupção** | Taxas de pausa |
| **Taxa de Adesão** | Matrícula inicial |

---

## 📊 Abas de Visualização

### 💳 Plano ou Pacote
Pagamentos relacionados ao plano contratado pelo aluno.

### 📅 Aulas em Geral
Pagamentos de aulas avulsas e pacotes de créditos.

### 📋 Todos os Pagamentos
Visualização consolidada de todo o histórico.

### 💳 Faturas CC (Cartão de Crédito)
- Geração de links de pagamento
- Cobrança de pacotes de créditos
- Faturas avulsas

---

## 🧾 Gerar Recibo

1. Selecione o pagamento desejado
2. Clique em **"Gerar Recibo"**
3. Escolha enviar por **email** ou **visualizar**

---

## ⚠️ Estorno de Pagamento

> ⚠️ **ATENÇÃO**: Esta operação é **irreversível**!
>
> Para confirmar o estorno, digite: **"EFETUAR ESTORNO"**

Use apenas em casos de:
- Pagamento duplicado
- Cobrança indevida
- Cancelamento aprovado
        `,
        tags: ["pagamento", "recibo", "fatura", "estorno", "cobrança"],
      },
      {
        id: "fechamento-mes",
        title: "Fechamento de Mês",
        summary: "Como fazer o fechamento mensal da unidade",
        content: `
# Fechamento de Mês

O fechamento mensal é essencial para a gestão financeira da unidade, consolidando pagamentos a professores e receitas.

![Fechamento de Mês](/images/manual/fechamento.jpg)

---

## 🎥 Vídeos de Suporte

Para ajudar com o processo de fechamento, temos vídeos explicativos:

- 📹 [Tutorial de Fechamento Parte 1](https://youtu.be/e7jiFhaxUh0)
- 📹 [Tutorial de Fechamento Parte 2](https://youtu.be/CPyu6A1Ik_k)

---

## 📋 Tela de Fechamento

### Informações Disponíveis

| Seção | Descrição |
|-------|-----------|
| **Mês** | Selecione o mês de referência |
| **Professores** | Lista de professores e unidades |
| **Financeiro** | Valores a pagar |
| **Reposições** | Aulas de reposição do período |

---

## 📊 Processo de Fechamento

1. Selecione o **mês de referência**
2. Clique em **"Atualizar"** para carregar dados
3. Revise os valores de cada professor
4. Verifique as **reposições**
5. Gere os **PDFs** de relatório
6. Clique em **"Efetuar Fechamento"**

---

## 🧾 Relatórios Disponíveis

- **PDF de Pagamentos**: Detalhamento por professor
- **Relatório de Aulas**: Quantidade de aulas ministradas
- **Reposições**: Aulas de reposição realizadas

---

## 💡 Dicas Importantes

> ✅ Sempre revise os dados antes de confirmar o fechamento
>
> ✅ Verifique se todas as faltas foram registradas corretamente
>
> ✅ Confira os valores de reposição entre unidades
        `,
        tags: ["fechamento", "mês", "professor", "pagamento", "relatório"],
      },
      {
        id: "cobrancas",
        title: "Cobranças",
        summary: "Gerenciamento de boletos e cobranças",
        content: `
# Cobranças

A tela de cobranças centraliza todos os boletos dos alunos, permitindo acompanhar status, reenviar e resolver problemas.

![Cobranças](/images/manual/cobrancas.jpg)

---

## 📊 Status dos Boletos

| Status | Descrição |
|--------|-----------|
| **Enviado** | Boleto enviado ao cliente |
| **Lançado** | Registrado no sistema |
| **Com erro** | Problema no processamento |
| **Liquidado** | Pago pelo cliente |

---

## 🔧 Ações Disponíveis

| Ação | Quando usar |
|------|-------------|
| **Alterar** | Corrigir valor ou dados |
| **Reenviar por email** | Cliente perdeu o email |
| **Forçar Envio** | Erro no lançamento |
| **Visualizar** | Ver e enviar arquivo |
| **Cancelar** | Casos específicos |

---

## ⚠️ Resolução de Problemas

### Cliente não recebeu o email
1. Selecione o boleto
2. Clique em **"Reenviar por email"**

### Erro no lançamento
1. Selecione o boleto
2. Clique em **"Forçar Envio"**

### Precisa enviar por outro canal
1. Clique em **"Visualizar"**
2. Baixe o arquivo
3. Envie por WhatsApp ou outro canal

---

## 📋 Informações da Tela

| Campo | Descrição |
|-------|-----------|
| **Nosso Número** | ID interno do boleto |
| **Unidade** | Local da cobrança |
| **Plano ou Pacote** | Referência |
| **Vencimento** | Data limite |
| **Último Envio** | Quando foi enviado |
| **Valor** | Quantia a pagar |
        `,
        tags: ["cobrança", "boleto", "fatura", "envio", "pagamento"],
      },
      {
        id: "nota-fiscal",
        title: "Nota Fiscal",
        summary: "Emissão de notas fiscais",
        content: `
# Nota Fiscal

A emissão de notas fiscais é obrigatória e deve ser feita mensalmente para todos os pagamentos recebidos.

---

## 🎥 Vídeo Tutorial

Para o passo a passo completo de emissão:

📹 [Tutorial de Emissão de Nota Fiscal](https://youtu.be/h9dRkcQ6d2k)

---

## ⚠️ Prazo Importante

> **As notas devem ser emitidas até o dia 5 do mês subsequente!**

---

## 📊 Abas da Tela

### Notas Emitidas

Visualize todas as notas já processadas:

| Campo | Descrição |
|-------|-----------|
| **Número** | Número da nota |
| **Tipo** | RPS ou NFS-e |
| **Status** | Emitida, Cancelada |
| **Período** | Início e Fim |
| **Total** | Valor total |
| **Gerado Por** | Quem emitiu |

### Notas a Emitir

Lista de notas pendentes de emissão para o período.

---

## 📋 Detalhes da Nota

Ao clicar em uma nota, você vê:

| Campo | Descrição |
|-------|-----------|
| **Unidade** | Local |
| **ID Cliente** | Identificador |
| **Nome** | Nome do cliente |
| **Código** | Código interno |
| **Valor** | Valor da nota |
| **Status** | OK ou Erro |

---

## 💡 Dicas

> ✅ Emita as notas semanalmente para não acumular
>
> ✅ Verifique se todos os dados do cliente estão corretos
>
> ✅ Em caso de erro, corrija o cadastro antes de emitir
        `,
        tags: ["nota fiscal", "NFS-e", "RPS", "emissão", "fiscal"],
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "Campanhas, publicações e comunicação",
    icon: Megaphone,
    color: "hsl(25 90% 55%)",
    articles: [
      {
        id: "publicacoes",
        title: "Aprovação de Publicações",
        summary: "Gerenciamento de fotos publicadas pelos alunos",
        content: `
# Aprovação de Publicações

Os alunos podem publicar fotos através do app, que ficam pendentes de aprovação antes de aparecerem publicamente.

---

## 📬 Notificações

Na tela inicial você verá o indicador:

> **"X publicação aguarda aprovação"**

---

## 📋 Como Aprovar

1. Clique na notificação de publicações
2. Visualize a foto enviada
3. Verifique se está adequada
4. Clique em **Aprovar** ou **Reprovar**

---

## ✅ Critérios de Aprovação

- Foto nítida e de boa qualidade
- Ambiente do studio visível
- Aluno identificável (com autorização)
- Sem conteúdo impróprio

---

## ❌ Motivos de Reprovação

- Foto borrada ou escura
- Conteúdo inadequado
- Não relacionado ao Pilates
- Sem autorização de imagem
        `,
        tags: ["publicação", "foto", "aprovação", "marketing", "redes sociais"],
      },
    ],
  },
  {
    id: "administracao",
    title: "Administração",
    description: "Configurações gerais e gestão da unidade",
    icon: Settings,
    color: "hsl(220 70% 50%)",
    articles: [
      {
        id: "historico-pessoas",
        title: "Histórico de Pessoas",
        summary: "Visualização de todas as movimentações do perfil",
        content: `
# Histórico de Pessoas

O Histórico de Pessoas registra todas as movimentações e interações realizadas no perfil do aluno.

![Histórico de Pessoas](/images/manual/historico-pessoas.jpg)

---

## 📋 O que é Registrado

### Prospecção
- Fichas de avaliação enviadas
- Emails de acompanhamento
- Ligações realizadas

### Matrículas
- Termos de adesão enviados
- Contratos assinados
- Senhas de acesso enviadas

### Pagamentos
- Pagamentos realizados
- Cartões recusados
- Troca de cartão

### Agendamentos
- Reposições agendadas
- Cancelamentos
- Alterações via App

---

## 📊 Abas Disponíveis

| Aba | Conteúdo |
|-----|----------|
| **Principal** | Todos os registros |
| **Robô Automatizado** | Ações automáticas do sistema |
| **Auto Atendimento** | Ações feitas pelo aluno no app |

---

## ⚠️ Alertas de Pagamento

Quando um cartão é **recusado**, o sistema registra:

- Número da tentativa (ex: "2ª de 5 tentativas")
- Data da recusa
- Contato do cliente

> 💡 **Ação recomendada**: Verifique com o cliente o problema e sugira a **troca do cartão de crédito**.

---

## ➕ Inserir Histórico Manual

Você pode adicionar registros manuais:

1. Clique em **"Inserir Histórico"**
2. Preencha:
   - Tipo de histórico
   - Data e hora
   - Ativo ou Passivo
   - Descrição
3. Defina se é um **recado** para alguém
4. Confirme
        `,
        tags: ["histórico", "movimentações", "registro", "acompanhamento"],
      },
    ],
  },
  {
    id: "crm",
    title: "CRM",
    description: "Gestão de relacionamento com clientes",
    icon: MessageSquare,
    color: "hsl(180 60% 45%)",
    articles: [
      {
        id: "ficha-avaliacao",
        title: "Ficha de Avaliação",
        summary: "Gerenciamento de fichas de avaliação pré-aula",
        content: `
# Ficha de Avaliação

A ficha de avaliação é enviada aos alunos antes da aula experimental para coletar informações importantes sobre saúde e objetivos.

---

## 📋 Como Enviar

### Por Email
1. Acesse o cadastro do aluno
2. Vá em **"Planos e Aulas"** > **"Aulas Experimentais"**
3. Marque **"Enviar Ficha de Avaliação"**
4. Clique em **Confirmar**

### Copiar Link
1. Mesma navegação anterior
2. Clique em **"Copiar para área de transferência"**
3. Cole o link no WhatsApp ou outro canal

---

## 📊 Informações Coletadas

A ficha coleta dados sobre:

### Saúde
- Condições médicas
- Lesões anteriores
- Medicamentos em uso
- Restrições físicas

### Objetivos
- Por que busca o Pilates
- Experiência anterior
- Expectativas

---

## 👁️ Visualizar Respostas

Após o aluno preencher:

1. Acesse **"Planos e Aulas"**
2. Clique em **"Ficha de Avaliação"**
3. Visualize as respostas

---

## 💡 Importância

> A ficha é essencial para que o professor adapte a aula às necessidades e limitações do aluno, garantindo segurança e eficácia.
        `,
        tags: ["ficha", "avaliação", "experimental", "saúde", "objetivos"],
      },
    ],
  },
  {
    id: "midias-conteudos",
    title: "Mídias e Conteúdos",
    description: "Gestão de conteúdos e materiais",
    icon: Play,
    color: "hsl(290 60% 50%)",
    articles: [
      {
        id: "termo-adesao",
        title: "Termo de Adesão",
        summary: "Envio e gerenciamento de contratos",
        content: `
# Termo de Adesão (Contrato)

O termo de adesão é o contrato digital que formaliza a matrícula do aluno.

---

## 📋 Opções Disponíveis

| Ação | Descrição |
|------|-----------|
| **Abrir Link** | Abre o contrato no navegador |
| **Enviar por Email** | Envia para o email do aluno |
| **Visualizar Aceite** | Vê se foi assinado |
| **Contrato Antigo** | Acessa versões anteriores |

---

## 💰 Custo

> É cobrado **R$ 1,00** por termo de adesão enviado.

---

## 📧 Como Enviar

1. Acesse **"Planos e Aulas"** do aluno
2. Clique em **"Termo de Adesão"**
3. Escolha **"Enviar por Email"** ou **"Abrir Link"**
4. O aluno receberá o link para assinar

---

## ✅ Verificar Assinatura

1. Clique em **"Visualizar Aceite"**
2. Verifique se o contrato foi assinado
3. Se não foi, reenvie o link

---

## 🔄 Reenviar Contrato

Se o aluno perdeu o email:
1. Clique em **"Enviar por Email"** novamente
2. Ou copie o link e envie por WhatsApp
        `,
        tags: ["contrato", "termo", "adesão", "assinatura", "matrícula"],
      },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    description: "Análises e métricas do negócio",
    icon: BarChart3,
    color: "hsl(35 85% 50%)",
    articles: [
      {
        id: "analise-frequencia",
        title: "Análise de Frequência",
        summary: "Métricas de presença dos alunos",
        content: `
# Análise de Frequência

A análise de frequência mostra o nível de presença do aluno nas aulas, ajudando a identificar padrões e riscos de evasão.

---

## 📊 Dados Disponíveis

### Dados Gerais

| Métrica | Descrição |
|---------|-----------|
| **Qtd. Aulas** | Total de aulas do período |
| **Qtd. Presença** | Aulas que compareceu |
| **Qtd. Faltas** | Aulas que faltou |
| **% Aproveitamento** | Taxa de presença |

### Últimos 45 Dias
Análise focada no período recente.

### Reposições

| Métrica | Descrição |
|---------|-----------|
| **Agendadas** | Reposições marcadas |
| **Pendentes** | Aguardando agendamento |
| **Expiradas** | Prazo vencido |

---

## 📈 Padrões Identificados

O sistema mostra:

- **Dia da semana** com mais faltas
- **Horário** com mais faltas

> 💡 Use esses dados para conversar com o aluno sobre ajustes no horário se necessário.

---

## ⚠️ Indicadores de Risco

| Taxa de Presença | Status |
|-----------------|--------|
| Acima de 80% | ✅ Excelente |
| 60% a 80% | ⚠️ Atenção |
| Abaixo de 60% | 🚨 Risco de evasão |
        `,
        tags: ["frequência", "presença", "falta", "análise", "evasão"],
      },
    ],
  },
  {
    id: "campanhas-desempenho",
    title: "Campanhas de Desempenho",
    description: "Acompanhamento de metas e resultados",
    icon: TrendingUp,
    color: "hsl(15 80% 50%)",
    articles: [
      {
        id: "metas",
        title: "Metas e Indicadores",
        summary: "Acompanhamento de desempenho da unidade",
        content: `
# Metas e Indicadores

O acompanhamento de metas ajuda a medir o desempenho da unidade e identificar oportunidades de melhoria.

---

## 📊 Indicadores Principais

### 📈 Matrículas
- Novas matrículas do mês
- Meta definida
- % de atingimento

### 💰 Receita
- Faturamento realizado
- Meta de faturamento
- Ticket médio

### 👥 Retenção
- Alunos ativos
- Taxa de renovação
- Cancelamentos

### 📅 Aulas
- Aulas ministradas
- Taxa de ocupação
- Horários ociosos

---

## 🎯 Como Usar

1. Defina metas mensais realistas
2. Acompanhe semanalmente o progresso
3. Identifique gargalos
4. Tome ações corretivas
5. Celebre os resultados!

---

## 💡 Dicas

> ✅ Compare com meses anteriores
>
> ✅ Analise sazonalidades
>
> ✅ Compartilhe resultados com a equipe
        `,
        tags: ["metas", "indicadores", "desempenho", "KPI", "resultados"],
      },
    ],
  },
  {
    id: "professores",
    title: "Professores",
    description: "Gestão de equipe e pagamentos",
    icon: GraduationCap,
    color: "hsl(260 60% 55%)",
    articles: [
      {
        id: "gestao-professores",
        title: "Gestão de Professores",
        summary: "Cadastro e gerenciamento da equipe",
        content: `
# Gestão de Professores

O módulo de professores permite gerenciar toda a equipe, incluindo cadastros, horários e pagamentos.

---

## 📋 Informações do Cadastro

### Dados Pessoais
- Nome completo
- CPF
- Formação (ED ou FT)
- Contatos

### Dados Profissionais
- Unidades de atuação
- Horários disponíveis
- Especialidades
- CREF/CREFITO

---

## 💰 Pagamentos

O sistema calcula automaticamente:

| Item | Descrição |
|------|-----------|
| **Aulas Mensalistas** | Valor por aula fixa |
| **Aulas Avulsas** | Valor diferenciado |
| **Reposições** | Pagas ao professor do horário |
| **Experimentais** | Se aplicável |

---

## 📅 Horários

Configure a disponibilidade:

1. Dias da semana de trabalho
2. Horários de início e fim
3. Intervalos
4. Exceções (férias, folgas)

---

## 🔄 Troca de Professor

Para substituições, use:
- **Troca Eventual**: Uma aula específica
- **Troca Definitiva**: Mudança permanente

*Veja mais em "Alteração de Professor" na seção Clientes.*
        `,
        tags: ["professor", "equipe", "pagamento", "horário", "cadastro"],
      },
    ],
  },
  {
    id: "seguranca",
    title: "Segurança",
    description: "Senhas, acessos e permissões",
    icon: Shield,
    color: "hsl(0 70% 50%)",
    articles: [
      {
        id: "senhas-acessos",
        title: "Senhas e Acessos",
        summary: "Gerenciamento de senhas do sistema",
        content: `
# Senhas e Acessos

O gerenciamento correto de senhas é essencial para a segurança do sistema.

---

## 🔐 Padrões de Senha

### Para Usuários do Sistema
- **Padrão inicial**: 6 primeiros dígitos do CPF
- **Mínimo**: 6 caracteres
- **Recomendado**: Alterar no primeiro acesso

### Para Alunos (App)
- Senha enviada automaticamente por email
- Pode ser reenviada pelo menu do aluno

---

## 🔑 Senha Master

> **0904PURE1**
>
> Use apenas em casos especiais autorizados.

---

## 👤 Perfis de Acesso

| Perfil | Permissões |
|--------|------------|
| **Gestor** | Acesso total |
| **Professor** | Agenda e alunos |
| **Consultor** | Vendas e matrículas |
| **Administrativo** | Financeiro e relatórios |

---

## 📧 Enviar Senha para Aluno

1. Clique com botão direito no aluno
2. Selecione **"Enviar senha de acesso"**
3. Confirme o envio por email

---

## ⚠️ Boas Práticas

> ✅ Nunca compartilhe sua senha
>
> ✅ Altere a senha periodicamente
>
> ✅ Use o perfil correto
>
> ✅ Encerre a sessão ao terminar
        `,
        tags: ["senha", "acesso", "segurança", "login", "permissão"],
      },
    ],
  },
  {
    id: "pure-gpt",
    title: "Pure GPT",
    description: "Assistente de IA integrado ao sistema",
    icon: Bot,
    color: "hsl(190 70% 45%)",
    articles: [
      {
        id: "como-usar-gpt",
        title: "Como Usar o Pure GPT",
        summary: "Guia do assistente de inteligência artificial",
        content: `
# Como Usar o Pure GPT

O Pure GPT é o assistente de inteligência artificial integrado ao sistema Pure Pilates, projetado para ajudar com dúvidas e tarefas do dia a dia.

---

## 🤖 O que é o Pure GPT?

Um assistente virtual que:
- Responde dúvidas sobre o sistema
- Ajuda com procedimentos
- Sugere soluções para problemas
- Fornece informações rápidas

---

## 📍 Onde Encontrar

O Pure GPT está disponível na **tela inicial** do sistema, logo abaixo das dicas de navegação.

---

## 💬 Como Usar

1. Clique no ícone do Pure GPT
2. Digite sua pergunta ou dúvida
3. Aguarde a resposta
4. Se precisar, faça perguntas de acompanhamento

---

## 💡 Exemplos de Perguntas

- "Como marcar uma falta com reposição?"
- "Qual o prazo para o aluno repor uma aula?"
- "Como enviar o contrato para o aluno?"
- "Como cadastrar um novo plano?"

---

## ⚠️ Limitações

O Pure GPT:
- Não executa ações no sistema
- Não acessa dados específicos de alunos
- Pode não ter informações muito recentes
- É um **auxiliar**, não substitui o suporte humano

> 💡 Para problemas complexos, entre em contato com o suporte técnico.
        `,
        tags: ["GPT", "IA", "assistente", "ajuda", "inteligência artificial"],
      },
    ],
  },
];

// Search function
export function searchArticles(query: string): { section: Section; article: Article }[] {
  const normalizedQuery = query.toLowerCase().trim();
  const results: { section: Section; article: Article; score: number }[] = [];

  helpCenterSections.forEach((section) => {
    section.articles.forEach((article) => {
      let score = 0;

      if (article.title.toLowerCase().includes(normalizedQuery)) {
        score += 10;
      }

      if (article.summary.toLowerCase().includes(normalizedQuery)) {
        score += 5;
      }

      if (article.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))) {
        score += 7;
      }

      if (article.content.toLowerCase().includes(normalizedQuery)) {
        score += 2;
      }

      if (section.title.toLowerCase().includes(normalizedQuery)) {
        score += 3;
      }

      if (score > 0) {
        results.push({ section, article, score });
      }
    });
  });

  return results
    .sort((a, b) => b.score - a.score)
    .map(({ section, article }) => ({ section, article }));
}
