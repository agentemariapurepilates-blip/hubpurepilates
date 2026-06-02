# Importar o Pure Monitor no Hub

Guia para adicionar a ferramenta **Pure Monitor** (social listening / saúde de
marca da Pure Pilates) ao hub, **sem fundir os repositórios**.

- Ferramenta (repo separado): `agentemariapurepilates-blip/pure-monitor`
- Documento completo (deploy + API): ver `docs/INTEGRACAO-HUB.md` **naquele repo**

> **Resumo da arquitetura:** o Pure Monitor é um **servidor Node** (não uma SPA
> estática como o hub). Por isso ele roda **independente**, sob a URL
> `https://monitor.purepilates.com.br`, e o hub apenas o **embute via iframe**.
> Atualizou a ferramenta? Faz deploy só do repo `pure-monitor`; o hub nem precisa
> de novo deploy.

---

## Pré-requisito (fora deste repo)

O Pure Monitor precisa estar **publicado** numa URL e com a variável
`HUB_ORIGIN=https://hub.purepilates.com.br` definida (libera o iframe/CORS).
Passo a passo de hospedagem: `docs/INTEGRACAO-HUB.md` no repo `pure-monitor`,
seção 3.

---

## Passos neste repo (hub)

### 1. Criar a página `src/features/colaborador/monitoramento/PureMonitor.tsx`

```tsx
import MainLayout from '@/components/layout/MainLayout';

const PURE_MONITOR_URL =
  import.meta.env.VITE_PURE_MONITOR_URL ?? 'https://monitor.purepilates.com.br';

export default function PureMonitor() {
  return (
    <MainLayout>
      <div className="h-[calc(100vh-4rem)] w-full">
        <iframe
          src={PURE_MONITOR_URL}
          title="Pure Monitor — Social Listening"
          className="h-full w-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </MainLayout>
  );
}
```

### 2. Registrar a rota em `src/App.tsx`

```tsx
// junto dos outros lazy() de monitoramento (~linha 47)
const PureMonitor = lazy(() => import('./features/colaborador/monitoramento/PureMonitor'));

// dentro de <Routes>, perto de /agente-monitoramento/saude-de-marca (~linha 120)
<Route
  path="/agente-monitoramento/pure-monitor"
  element={<ProtectedRoute><PureMonitor /></ProtectedRoute>}
/>
```

### 3. Adicionar ao menu em `src/components/layout/Sidebar.tsx`

No array da seção **“Agente Monitoramento”** (~linha 191), ao lado de
“Métricas” e “Saúde de marca”:

```tsx
{ name: 'Pure Monitor (ao vivo)', href: '/agente-monitoramento/pure-monitor', icon: Activity, disabled: false },
```

(importe `Activity` de `lucide-react`.)

### 4. Variável de ambiente do build

```env
VITE_PURE_MONITOR_URL=https://monitor.purepilates.com.br
```

### 5. Deploy

Seguir o `CLAUDE.md`: `git push origin main` **antes** de `./deploy.sh`.
A página é só um iframe — não altera o backend Supabase.

---

## Como o Pure Monitor se relaciona com a “Saúde de Marca” atual

A tela `/agente-monitoramento/saude-de-marca` mostra relatórios **mensais**
(tabela `brand_health_reports`, gravados pelo n8n). O Pure Monitor é o
**complemento ao vivo / dia a dia** (canais, alertas com “resolver”, coleta sob
demanda). Recomendado: **coexistirem** como itens de menu separados.

Se preferir um card de saúde **nativo** na home (em vez do iframe), o hub pode
consumir a API JSON do Pure Monitor (`/api/overview`, `/api/alerts`, …) — o CORS
já está liberado. Detalhes na seção 4 do documento completo.
