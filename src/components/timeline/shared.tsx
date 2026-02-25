import AnimatedSection from './AnimatedSection';
import AnimatedCounter from './AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';

export const MetricCard = ({
  icon: Icon,
  value,
  suffix,
  label,
  sub,
  delay = 0,
}: {
  icon: React.ElementType;
  value: number;
  suffix?: string;
  label: string;
  sub?: string;
  delay?: number;
}) => (
  <AnimatedSection variant="scale-up" delay={delay}>
    <Card className="text-center border-none shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6 pb-5 px-4">
        <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
        <p className="text-3xl font-bold text-foreground">
          <AnimatedCounter end={value} suffix={suffix} />
        </p>
        <p className="text-sm font-medium text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-xs text-primary font-semibold mt-1">{sub}</p>}
      </CardContent>
    </Card>
  </AnimatedSection>
);

export const SectionTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-2xl sm:text-3xl font-heading font-bold text-foreground ${className}`}>{children}</h2>
);
