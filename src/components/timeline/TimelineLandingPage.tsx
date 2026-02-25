import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Registry of months that have landing pages
// Add new months here as they are created
const LANDING_PAGES: Record<string, () => Promise<{ default: ComponentType }>> = {
  '2026-03': () => import('./MonthLanding_2026_03'),
};

export function hasLandingPage(monthKey: string): boolean {
  return monthKey in LANDING_PAGES;
}

interface TimelineLandingPageProps {
  monthKey: string;
}

const TimelineLandingPage = ({ monthKey }: TimelineLandingPageProps) => {
  const loader = LANDING_PAGES[monthKey];
  if (!loader) return null;

  const LazyComponent = lazy(loader);

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
