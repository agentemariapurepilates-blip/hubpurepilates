
# Plano: Melhorias no Hub Pure Pilates

## Resumo das Alterações

Este plano aborda **4 funcionalidades** solicitadas:

1. **Nova aba "Avisos"** - Feed de parcerias acessível a todos
2. **Reformular "Calendário de Marketing"** - Trocar calendário por lista visual de promoções por mês
3. **Busca global** - Adicionar campo de pesquisa em Timeline, Artes Prontas e outras telas
4. **Demandas por área** - Visualização tipo Monday.com com quadros por departamento

---

## 1. Nova Aba "Avisos" (Parcerias Pure)

### Descrição
Criar uma nova seção logo abaixo de "Timeline do Mês" no menu lateral. Será um feed simples onde todos os usuários (franqueados e colaboradores) podem visualizar parcerias e avisos gerais.

### Alterações no Menu Lateral
Adicionar link "Avisos" após "Timeline do Mês":
- Comece aqui
- Timeline do Mês  
- **Avisos** (NOVO)
- Mídias Sociais
- Calendário de Marketing
- Artes Prontas

### Nova Tabela no Banco
```text
avisos
├── id (uuid)
├── title (text)
├── content (text) - descrição rica
├── image_url (text) - imagem opcional
├── partner_name (text) - ex: "Boticário"
├── is_active (boolean)
├── created_by (uuid)
├── created_at (timestamp)
└── updated_at (timestamp)
```

### Nova Página
Criar `/avisos` com:
- Header com título "Parcerias e Avisos"
- Grid de cards com as parcerias ativas
- Colaboradores podem criar/editar avisos
- Dialog para visualizar detalhes

### Arquivos a Criar/Modificar
| Arquivo | Ação |
|---------|------|
| `src/pages/Avisos.tsx` | Criar |
| `src/components/avisos/AvisoCard.tsx` | Criar |
| `src/components/avisos/CreateAvisoDialog.tsx` | Criar |
| `src/components/avisos/EditAvisoDialog.tsx` | Criar |
| `src/components/layout/Sidebar.tsx` | Modificar |
| `src/App.tsx` | Adicionar rota |
| Migração SQL | Criar tabela avisos |

---

## 2. Reformular "Calendário de Marketing"

### Descrição
Substituir o calendário atual por uma visualização em lista/cards das promoções, organizadas por mês. Mantém as mesmas funcionalidades (criar, editar, excluir eventos) mas com layout mais visual.

### Novo Layout
```text
┌─────────────────────────────────────────────────┐
│  Próximas Promoções                             │
│  ─────────────────                              │
│                                                 │
│  [Janeiro 2026] [Fevereiro] [Março] [+]         │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🟢 Pure Pass - Especial Verão           │    │
│  │ 01 Jan - 31 Jan                         │    │
│  │ Promoção de início de ano...            │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🔵 Pacotes - Volta às Aulas             │    │
│  │ 15 Jan - 28 Feb                         │    │
│  │ Desconto especial para novos alunos...  │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Funcionalidades Mantidas
- Tags coloridas (Pacotes, Pure Pass, Pure Club)
- Data de início e fim
- Botão "Novo Evento"
- Dialogs de criação, visualização e edição
- Busca por promoções

### Arquivos a Modificar
| Arquivo | Ação |
|---------|------|
| `src/pages/CalendarioMarketing.tsx` | Reescrever layout |

---

## 3. Busca Global em Todas as Telas

### Descrição
Adicionar campo de busca (lupinha) nas seguintes páginas:
- Timeline do Mês (já tem filtro por setor, adicionar busca por texto)
- Artes Prontas
- Calendário de Marketing (promoções)
- Mídias Sociais

### Implementação
Cada página terá um Input com ícone de lupa que filtra o conteúdo em tempo real:

```text
┌────────────────────────────────────────┐
│  🔍 Buscar...                          │
└────────────────────────────────────────┘
```

### Arquivos a Modificar
| Arquivo | Ação |
|---------|------|
| `src/pages/NovidadesDoMes.tsx` | Adicionar busca |
| `src/pages/ArtesProntas.tsx` | Adicionar busca |
| `src/pages/CalendarioMarketing.tsx` | Adicionar busca |
| `src/pages/MidiasSociais.tsx` | Adicionar busca |

---

## 4. Demandas por Área (Quadro tipo Monday)

### Descrição
Modificar a visualização de demandas para organizar por **departamento** em vez de status. O usuário seleciona um departamento e vê o quadro Kanban das demandas daquele setor.

### Novo Layout
```text
┌─────────────────────────────────────────────────────┐
│  Solicitação de Demandas                            │
│                                                     │
│  [Marketing] [Consultoras] [Implantação] [Tech]     │
│                                                     │
│  Quadro: Marketing                                  │
│  ─────────────────                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Pendente │  │ Andamento│  │ Concluído│          │
│  ├──────────┤  ├──────────┤  ├──────────┤          │
│  │ [Task 1] │  │ [Task 3] │  │ [Task 5] │          │
│  │ [Task 2] │  │ [Task 4] │  │          │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### Alterações nas Permissões
Qualquer colaborador poderá alterar o status de demandas (não apenas o criador ou admin).

### Arquivos a Criar/Modificar
| Arquivo | Ação |
|---------|------|
| `src/pages/PedidosDemanda.tsx` | Adicionar filtro por departamento |
| `src/components/demands/DemandKanbanView.tsx` | Permitir drag-and-drop de status |
| `src/components/demands/DepartmentSelector.tsx` | Criar seletor de departamento |
| `src/components/demands/DemandDetailsDialog.tsx` | Permitir qualquer colaborador mudar status |
| Migração RLS | Atualizar política para permitir update por colaboradores |

---

## Detalhes Técnicos

### Migração SQL Necessária

```sql
-- 1. Criar tabela de avisos
CREATE TABLE avisos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text,
  image_url text,
  partner_name text,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE avisos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acesso
CREATE POLICY "Avisos viewable by authenticated"
  ON avisos FOR SELECT USING (true);

CREATE POLICY "Colaboradores can create avisos"
  ON avisos FOR INSERT WITH CHECK (is_colaborador(auth.uid()));

CREATE POLICY "Creator or admin can update avisos"
  ON avisos FOR UPDATE USING (
    auth.uid() = created_by OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Creator or admin can delete avisos"
  ON avisos FOR DELETE USING (
    auth.uid() = created_by OR has_role(auth.uid(), 'admin')
  );

-- 4. Atualizar política de demandas para colaboradores
DROP POLICY "Creator or admin can update demands" ON demands;
CREATE POLICY "Colaboradores can update demands"
  ON demands FOR UPDATE USING (is_colaborador(auth.uid()));
```

### Resumo de Arquivos

| Categoria | Arquivos Novos | Arquivos Modificados |
|-----------|----------------|----------------------|
| Avisos | 4 | 2 |
| Calendário | 0 | 1 |
| Busca | 0 | 4 |
| Demandas | 1 | 3 |
| **Total** | **5** | **10** |

---

## Ordem de Implementação

1. **Migração SQL** - Criar tabela avisos e atualizar RLS de demandas
2. **Avisos** - Página e componentes
3. **Calendário de Marketing** - Novo layout
4. **Busca Global** - Adicionar em todas as telas
5. **Demandas por Área** - Filtro e permissões
