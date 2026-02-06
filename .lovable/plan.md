
## Drag and Drop no Quadro Kanban

Adicionar a funcionalidade de arrastar e soltar (drag and drop) nos cards do quadro Kanban da Solicitacao de Demandas, permitindo mover uma tarefa entre colunas (Pendente, Em Andamento, Concluido, Cancelado) de forma visual e intuitiva.

### Como vai funcionar

- Voce podera clicar e segurar um card de demanda e arrasta-lo para outra coluna
- Ao soltar o card na nova coluna, o status da demanda sera atualizado automaticamente no banco de dados
- Um feedback visual (toast) confirmara a mudanca de status
- Um clique rapido (sem arrastar) continuara abrindo os detalhes da demanda normalmente

### Detalhes tecnicos

**1. Instalar biblioteca de drag and drop**
- Adicionar `@dnd-kit/core` e `@dnd-kit/sortable` -- bibliotecas leves e acessiveis, ideais para React
- Alternativa considerada: HTML5 nativo (dragstart/dragover/drop), porem com menos suporte a mobile e acessibilidade

**2. Refatorar `DemandKanbanView.tsx`**
- Envolver o quadro com `DndContext` do @dnd-kit
- Cada coluna sera um `useDroppable` (area onde se pode soltar)
- Cada card de demanda sera um `useDraggable` (elemento arrastavel)
- Ao soltar (`onDragEnd`), chamar `onStatusChange(demandId, novoStatus)` que ja existe e funciona
- Diferenciar clique de arraste: so abrir detalhes se o usuario nao arrastou o card

**3. Feedback visual durante o arraste**
- Card sendo arrastado fica com opacidade reduzida na posicao original
- Coluna de destino recebe um destaque visual (borda ou fundo) ao passar o card por cima
- Overlay do card arrastado acompanha o cursor

**4. Compatibilidade mobile**
- O @dnd-kit suporta touch nativamente com sensores de toque
- Configurar `PointerSensor` com uma distancia minima de ativacao (ex: 8px) para diferenciar toque/clique de arraste

### Arquivos que serao modificados

| Arquivo | Acao |
|---|---|
| `package.json` | Adicionar @dnd-kit/core e @dnd-kit/utilities |
| `src/components/demands/DemandKanbanView.tsx` | Refatorar para incluir drag and drop com DndContext, Draggable cards e Droppable columns |
