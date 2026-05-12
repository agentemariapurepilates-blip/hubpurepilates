import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  GeneratedContent,
  isThemeStage,
  networkColors, networkLegendColors, networkIcons,
  contentTypeLabel, contentTypeShort, contentTypeBadgeColor,
  statusIcons, statusLabels,
  WEEK_DAYS, WEEK_DAYS_SHORT,
} from './types';

interface EditorialCalendarProps {
  resultMonth: Date;
  generatedContents: GeneratedContent[];
  onItemClick: (item: GeneratedContent) => void;
  onApproveAll: () => void;
}

export function EditorialCalendar({ resultMonth, generatedContents, onItemClick, onApproveAll }: EditorialCalendarProps) {
  const monthStart = startOfMonth(resultMonth);
  const monthEnd = endOfMonth(resultMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }, () => null);

  // Facebook e replicado do Instagram, escondemos do calendario.
  const getItemsForDay = (date: Date) =>
    generatedContents.filter(
      (item) => item.network === 'Instagram Studios' && isSameDay(date, new Date(item.date)),
    );

  const approvedCount = generatedContents.filter((c) => c.status === 'approved').length;
  const pendingCount = generatedContents.filter((c) => c.status === 'pending').length;
  const hasPending = generatedContents.some((c) => c.status === 'pending');

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold capitalize">
            {format(resultMonth, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {generatedContents.length} postagens · {approvedCount} aprovadas · {pendingCount} pendentes
          </p>
        </div>
        <Button size="sm" onClick={onApproveAll} disabled={!hasPending}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Aprovar tudo
        </Button>
      </div>

      {/* Legenda das redes */}
      <div className="flex flex-wrap gap-3 sm:gap-4">
        {(Object.keys(networkLegendColors) as GeneratedContent['network'][]).map((network) => {
          const Icon = networkIcons[network];
          return (
            <div key={network} className="flex items-center gap-1.5">
              <span className={cn('w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center', networkLegendColors[network])}>
                <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">{network}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEK_DAYS.map((day, index) => (
            <div key={day} className="p-1.5 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground bg-muted/20">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{WEEK_DAYS_SHORT[index]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {paddingDays.map((_, index) => (
            <div key={`pad-${index}`} className="min-h-16 sm:min-h-24 md:min-h-28 p-1 sm:p-2 border-b border-r border-border bg-muted/10" />
          ))}

          {daysInMonth.map((day) => {
            const items = getItemsForDay(day);
            const hasContent = items.length > 0;
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-16 sm:min-h-24 md:min-h-28 p-1 sm:p-2 border-b border-r border-border transition-colors',
                  !isSameMonth(day, resultMonth) && 'bg-muted/20 text-muted-foreground',
                  isDayToday && 'bg-primary/5',
                )}
              >
                <div className={cn('text-xs sm:text-sm font-medium mb-0.5 sm:mb-1', isDayToday && 'text-primary font-bold')}>
                  {format(day, 'd')}
                </div>
                {hasContent && (
                  <div className="space-y-0.5 sm:space-y-1">
                    {items.map((item) => {
                      const NetworkIcon = networkIcons[item.network];
                      const StatusIcon = statusIcons[item.status];
                      const isTheme = isThemeStage(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onItemClick(item)}
                          title={`${item.title} — ${item.content_type ? contentTypeLabel[item.content_type] + ' — ' : ''}${statusLabels[item.status]}${isTheme ? ' (tema)' : ''}`}
                          className={cn(
                            'w-full text-[10px] sm:text-xs p-1 sm:p-1.5 rounded font-medium flex items-center gap-0.5 sm:gap-1 cursor-pointer hover:opacity-80 transition-opacity text-left',
                            networkColors[item.network],
                            item.status === 'rejected' && 'opacity-50 line-through',
                          )}
                        >
                          <NetworkIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                          {item.content_type && (
                            <span className={cn(
                              'rounded px-1 py-0 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide flex-shrink-0',
                              contentTypeBadgeColor[item.content_type],
                            )}>
                              {contentTypeShort[item.content_type]}
                            </span>
                          )}
                          {isTheme && (
                            <span className="rounded px-1 py-0 text-[8px] sm:text-[9px] font-bold uppercase tracking-wide bg-amber-400 text-amber-900 flex-shrink-0">
                              Tema
                            </span>
                          )}
                          <span className="truncate hidden sm:inline flex-1">{item.title}</span>
                          {item.status !== 'pending' && (
                            <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 opacity-90" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
