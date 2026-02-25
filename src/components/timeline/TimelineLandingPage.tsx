import { lazy, Suspense, ComponentType, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Registry of months that have landing pages
const LANDING_PAGES: Record<string, () => Promise<{ default: ComponentType }>> = {
  '2026-03': () => import('./MonthLanding_2026_03'),
};

// Pre-resolved lazy components so they are stable across renders
const LazyComponents: Record<string, React.LazyExoticComponent<ComponentType>> = {};
function getLazyComponent(monthKey: string) {
  if (!LazyComponents[monthKey]) {
    const loader = LANDING_PAGES[monthKey];
    if (!loader) return null;
    LazyComponents[monthKey] = lazy(loader);
  }
  return LazyComponents[monthKey];
}

export function hasLandingPage(monthKey: string): boolean {
  return monthKey in LANDING_PAGES;
}

interface TimelineLandingPageProps {
  monthKey: string;
}

const TimelineLandingPage = ({ monthKey }: TimelineLandingPageProps) => {
  const LazyComponent = getLazyComponent(monthKey);
  if (!LazyComponent) return null;

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <LazyComponent />
    </Suspense>
  );
};

export default TimelineLandingPage;
