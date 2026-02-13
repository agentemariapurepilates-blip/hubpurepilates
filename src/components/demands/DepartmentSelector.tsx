import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const SECTORS = [
  { value: 'all', label: 'Todos' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Consultoras', label: 'Consultoras' },
  { value: 'Implantação', label: 'Implantação' },
  { value: 'Tecnologia', label: 'Tecnologia' },
  { value: 'Expansão', label: 'Expansão' },
  { value: 'Estúdios', label: 'Estúdios' },
  { value: 'Academy', label: 'Academy' },
  { value: 'Franchising', label: 'Franchising' },
  { value: 'Pure Store', label: 'Pure Store' },
  { value: 'RH', label: 'RH' },
];

interface DepartmentSelectorProps {
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  demandCounts?: Record<string, number>;
}

const DepartmentSelector = ({ 
  selectedDepartment, 
  onDepartmentChange,
  demandCounts = {}
}: DepartmentSelectorProps) => {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 pb-2">
        {SECTORS.map((dept) => {
          const isActive = selectedDepartment === dept.value;
          const count = dept.value === 'all' 
            ? Object.values(demandCounts).reduce((a, b) => a + b, 0)
            : demandCounts[dept.value] || 0;
          
          return (
            <Button
              key={dept.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onDepartmentChange(dept.value)}
              className={cn(
                "whitespace-nowrap gap-2",
                isActive && "shadow-md"
              )}
            >
              {dept.label}
              {count > 0 && (
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                  isActive 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default DepartmentSelector;
export { SECTORS };
