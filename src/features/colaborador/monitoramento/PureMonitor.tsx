import MainLayout from '@/components/layout/MainLayout';
import { Radar } from 'lucide-react';

// URL pública do Pure Monitor (servidor Node, repo separado).
// Defina VITE_PURE_MONITOR_URL no build; o fallback é o domínio previsto.
const PURE_MONITOR_URL =
  import.meta.env.VITE_PURE_MONITOR_URL ?? 'https://monitor.purepilates.com.br';

export default function PureMonitor() {
  return (
    <MainLayout>
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            <span className="font-semibold">Pure Monitor</span>
            <span className="text-sm text-muted-foreground">— social listening ao vivo</span>
          </div>
          <a
            href={PURE_MONITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Abrir em nova aba ↗
          </a>
        </div>

        <iframe
          src={PURE_MONITOR_URL}
          title="Pure Monitor — Social Listening"
          className="h-[85vh] w-full border-0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </MainLayout>
  );
}
