# TODO: Migrar export pra `modern-screenshot`

> **Quando ler isso, migrar a feature aqui (Criação de Layout / agente-design) do `html2canvas` pra `modern-screenshot`.** O Pure Design já foi migrado em 03/06/2026 — esta pasta ficou pendente.

## Por que migrar

O `html2canvas` **reimplementa o renderizador de texto do zero** usando `canvas.fillText()` com aproximação das métricas da fonte. Não usa o engine nativo do browser. Resultado: o texto sai com baseline 1-3px diferente do preview, especialmente dentro de pills/badges/containers com `line-height` maior que `font-size`.

Esse bug se manifestou no Pure Design no template "Feriado Corpus Christi" (texto dentro das pills vermelhas descia no PNG exportado). **A causa NÃO é CSS** — várias tentativas de "consertar com CSS" falharam: `line-height=height`, flex centering, padding asymmetric, font preload. Cada uma "explicada com confiança" mas todas fracassaram. O bug é arquitetural: o renderizador é o errado.

A `modern-screenshot` usa **SVG foreignObject**: embute o DOM dentro de `<svg><foreignObject>` e deixa o **browser nativo** renderizar, depois converte pra PNG. Pixel-perfect com o preview, sempre, garantido.

## Como migrar (copiar do Pure Design)

Referência: [src/features/geral/artes/PureDesignEditor.tsx](../../../../features/geral/artes/PureDesignEditor.tsx) — commit `1d61a43` (fix(pure-design): migra export pra modern-screenshot).

Onde mexer aqui (`agente-design/`):

1. **`CriacaoLayout.tsx`** linha ~690 (`html2canvas(staticExportRef.current, ...)`). Substituir por:

   ```ts
   import { domToBlob } from 'modern-screenshot';
   // ...
   const blob = await domToBlob(staticExportRef.current, {
     type: 'image/png',
     scale: 1,
     backgroundColor: null,
   });
   if (!blob) throw new Error('falha ao gerar PNG');
   ```

2. **Trocar o `import html2canvas from 'html2canvas'`** pelo import da `domToBlob` no topo do arquivo.

3. **A lib `modern-screenshot` já está instalada** (`package.json` na raiz). Não precisa `npm install`.

## Workarounds que provavelmente podem ser removidos depois da migração

Vários arquivos aqui têm código compensatório porque o html2canvas é unreliable. Depois da migração, **testar se ainda são necessários** (provavelmente não):

- [`components/StaticCanvas.tsx`](components/StaticCanvas.tsx) linhas 9-10 — comentário sobre `react-rnd` + `transform:translate3d` renderizar inconsistente
- [`components/EditableCanvas.tsx`](components/EditableCanvas.tsx) linhas 67-70 — workaround de wrap de texto com Montserrat ExtraBold (mede largura diferente do browser)
- [`components/EditableCanvas.tsx`](components/EditableCanvas.tsx) linhas 106-107 — usa `marginTop`/`marginBottom` em vez de `gap` flex porque html2canvas ignora `gap`
- [`components/HandDrawnUnderline.tsx`](components/HandDrawnUnderline.tsx) linha 10 — comentário "renderiza idêntico no preview e no PNG" (sublinhado SVG manuscrito)
- [`CriacaoLayout.tsx`](CriacaoLayout.tsx) linha 1638 — `opacity:1` porque "precisa estar visível pra html2canvas capturar"

Após migrar, **rodar npm run dev local + exportar uma arte real + comparar com preview**. Se ficar pixel-perfect: remover os workarounds um por um e re-testar. Se algum problema novo aparecer: voltar o workaround correspondente.

## Não esquecer

- **NÃO deletar `html2canvas` do `package.json`** até confirmar que NADA mais usa (a build chunk `html2canvas.esm-*.js` é grande, ~201 KB — vale a pena remover depois pra reduzir bundle).
- **Testar export real** (download de PNG ou envio por email/webhook), não só preview no editor.
- Esse bug é insidioso: pode parecer "ok" no preview e só falhar no PNG. Sempre validar abrindo o arquivo final.

---

_Esse doc foi criado em 03/06/2026 depois do Pure Design ser migrado com sucesso. Quando essa migração aqui for feita, deletar este arquivo._
