# Entre Molas — revista folheável

Aba **Entre Molas** do Hub (rota `/entre-molas`, no menu logo abaixo de "Timeline do Mês").
Tudo da revista mora nesta pasta.

```
entre-molas/
├── EntreMolas.tsx        página da aba (palco em tela cheia + lista de páginas)
├── Revista.tsx           motor de folhear: escala, virada 3D, teclado, arraste, tela cheia
├── entre-molas.css       estilos da revista (papel, virada, capa, cores da identidade)
├── paginas/              uma página da revista por arquivo
│   └── Capa.tsx
└── assets/               imagens da revista
    ├── logo-entre-molas-*.{svg,png}   logo oficial (vinho e creme)
    └── original/                       arquivos de referência vindos do Canva
```

## Como funciona

- Toda página é desenhada em **820 × 1000** (o mesmo tamanho do Canva) e a revista é
  escalada para caber na tela — a diagramação não quebra de uma tela para outra.
- Em tela larga abre em **página dupla**; em tela estreita, uma página por vez.
- Para acrescentar uma página: crie o arquivo em `paginas/` e inclua na lista `PAGINAS`
  de `EntreMolas.tsx`, na ordem em que ela aparece na revista.

## Regra do conteúdo

Os textos vêm do Canva **"Entre molas Edição 1"** e entram **exatamente** como lá —
sem reescrever, resumir nem inventar.
