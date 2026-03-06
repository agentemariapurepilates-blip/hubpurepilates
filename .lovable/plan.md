

## Plano: Recriar Manual do Franqueado nativamente no Hub

O manual será integrado diretamente no hub, sem iframe, usando os mesmos componentes e dados do projeto original. O conteúdo ficará dentro do layout do hub (sidebar + top bar), totalmente integrado.

---

### O que será feito

1. **Instalar dependências extras**: `react-markdown`, `remark-gfm`, `@tailwindcss/typography` (usados para renderizar o conteúdo markdown dos artigos)

2. **Copiar assets (imagens)**: 21 imagens do manual (`public/images/manual/`) + logo `logo-pure.png` do projeto original para este projeto

3. **Criar arquivo de dados**: `src/data/helpCenterData.ts` (1793 linhas) com todas as 12 categorias e ~25 artigos com conteúdo completo em markdown

4. **Criar componentes do manual** (adaptados ao layout do hub, sem header/footer próprios):
   - `src/components/manual/SearchBar.tsx` -- busca com autocomplete
   - `src/components/manual/SectionCard.tsx` -- cards de categoria
   - `src/components/manual/ArticleList.tsx` -- lista de artigos de uma categoria
   - `src/components/manual/ArticleView.tsx` -- visualização de artigo com markdown renderizado

5. **Reescrever `src/pages/ManualSistema.tsx`**: Substituir o iframe pelo conteúdo nativo, usando `MainLayout` + os novos componentes. A hero section será simplificada (sem header/footer duplicados) e integrada ao estilo do hub.

6. **Configurar Tailwind**: Adicionar plugin `@tailwindcss/typography` no `tailwind.config.ts`

---

### Detalhes técnicos

- Os componentes serão copiados do projeto original com adaptações: remoção do header (Pure Pilates logo bar) e footer, já que o hub tem sua própria sidebar/navbar
- O `ArticleView` usa `react-markdown` + `remark-gfm` para renderizar conteúdo rico (tabelas, listas, código, blockquotes)
- As imagens referenciadas nos artigos usam paths como `/images/manual/agenda.jpg` que serão copiadas para `public/images/manual/`
- A busca funciona client-side com scoring por título, tags, summary e conteúdo

