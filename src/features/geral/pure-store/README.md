# Pure Store — aba do Hub

Central de apoio ao franqueado: **FAQ**, **Pure Box**, **Uniformes** (tabelas de medidas nativas em SVG), **Tabela de preços** e **Catálogo digital**.

Rota: `/pure-store` (logado). Menu lateral: item solto "Pure Store".

## ⚠️ Catálogo digital (PDF) — precisa de manutenção periódica

O que é: a unidade preenche **nome + WhatsApp** e o Hub **gera um PDF** (foto +
preço de cada produto, com o WhatsApp da unidade clicável) para ela enviar aos
alunos. Componente `catalogoPdf.ts` (jsPDF) + aba no `PureStore.tsx`. **Não há
link público nem backend** — a decisão foi PDF justamente para não expor o Hub.

Detalhes:
- Botões **Gerar catálogo** / **Atualizar catálogo** (baixa o PDF novo com a lista
  mais recente). Nome + WhatsApp ficam salvos no `localStorage` da unidade.
- Fotos vêm do CDN da loja (CORS liberado) → carregadas no navegador e embutidas
  no PDF. Produtos: **`src/data/pureStoreCatalogo.ts`** (lista central).
- **Esgotado:** aparece só com a tag "Esgotado".
- **PURE BOX:** kits B2B — **não** entram no catálogo (o gerador remove).
- O PDF é uma **foto do momento**: para pegar novidades, a unidade clica em
  **Atualizar catálogo** (que usa a lista central já deployada).

### Como atualizar o catálogo (manual, ~1x por semana)

`src/data/pureStoreCatalogo.ts` é **gerado automaticamente** a partir da loja
(loja.purepilates.com.br, Nuvemshop). **Não editar à mão.** Para atualizar:

```bash
node scripts/gerar-catalogo-pure-store.mjs
```

Depois: **commit + `./deploy.sh`**. Pronto — todos os catálogos passam a mostrar os
produtos/preços novos (links das unidades não mudam).

## Tabela de preços (fonte diferente)

`src/data/pureStorePrecos.ts` vem da **planilha do franqueado** (Revenda + 20/25/30%
OFF), não do site. Atualizada quando chega uma planilha nova (gerada a partir do
`.xlsx`). Os valores do site (catálogo) e da planilha (tabela) podem divergir.
