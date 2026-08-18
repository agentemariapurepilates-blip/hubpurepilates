# Pure Store — aba do Hub

Central de apoio ao franqueado: **FAQ**, **Pure Box**, **Uniformes** (tabelas de medidas nativas em SVG), **Tabela de preços** e **Catálogo digital**.

Rota: `/pure-store` (logado). Menu lateral: item solto "Pure Store".

## ⚠️ Catálogo digital — precisa de manutenção periódica

O que é: cada unidade gera um **link público exclusivo**
`/catalogo/<slug>?u=<nome>&w=<whatsapp>` com todos os produtos do site. O aluno
abre **sem login** e pede pelo **WhatsApp da unidade** (rota pública em `App.tsx`,
componente `CatalogoPublico.tsx`).

Arquitetura (sem backend):
- O **WhatsApp da unidade vai no próprio link** → cada link é exclusivo, sem QR e
  sem banco. A unidade gera **um único link** (mesmo nome+WhatsApp → mesmo slug).
- Os produtos vêm de **`src/data/pureStoreCatalogo.ts`** (lista central). Logo,
  quando essa lista é atualizada + deploy, **todos os links das unidades
  atualizam sozinhos** — a unidade não precisa gerar de novo.
- **Esgotado:** produto sem estoque aparece só com a tag "Esgotado" (sem "Pedir"
  nem "Ver no site").
- **PURE BOX:** kits B2B — **não** entram no catálogo do cliente (o gerador remove).

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
