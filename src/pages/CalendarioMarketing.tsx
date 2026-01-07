import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { EventDetailsDialog } from '@/components/calendar/EventDetailsDialog';
import { cn } from '@/lib/utils';

interface MarketingEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

const CalendarioMarketing = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // Janeiro 2026
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MarketingEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data: eventsData, error } = await supabase
      .from('marketing_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for each event
    const eventsWithProfiles = await Promise.all(
      (eventsData || []).map(async (event) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', event.user_id)
          .single();
        return { ...event, profiles: profile };
      })
    );

    setEvents(eventsWithProfiles);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const channel = supabase
      .channel('marketing-events-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'marketing_events' },
        () => fetchEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEvents]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  
  // Create padding for days before the first of the month
  const paddingDays = Array(startDayOfWeek).fill(null);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const startDate = parseISO(event.start_date);
      const endDate = parseISO(event.end_date);
      return isWithinInterval(day, { start: startDate, end: endDate }) || 
             isSameDay(day, startDate) || 
             isSameDay(day, endDate);
    });
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const handleDayClick = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setIsDetailsDialogOpen(true);
    } else {
      setSelectedDate(day);
      setIsCreateDialogOpen(true);
    }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendário de Marketing</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas campanhas e promoções</p>
          </div>
          <Button onClick={() => { setSelectedDate(new Date()); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/20">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="min-h-24 p-2 border-b border-r border-border bg-muted/10" />
            ))}
            {daysInMonth.map(day => {
              const dayEvents = getEventsForDay(day);
              const hasEvents = dayEvents.length > 0;
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-24 p-2 border-b border-r border-border cursor-pointer transition-colors hover:bg-accent/50",
                    !isSameMonth(day, currentDate) && "bg-muted/20 text-muted-foreground",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday && "text-primary font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                  {hasEvents && (
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded bg-primary/20 text-primary truncate"
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events List */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Próximos Eventos</h3>
          {loading ? (
            <div className="text-muted-foreground">Carregando...</div>
          ) : events.length === 0 ? (
            <div className="text-muted-foreground">Nenhum evento cadastrado</div>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <div
                  key={event.id}
                  onClick={() => { setSelectedEvent(event); setIsDetailsDialogOpen(true); }}
                  className="p-4 bg-card rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(event.start_date), "dd 'de' MMMM", { locale: ptBR })} - {format(parseISO(event.end_date), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                    {event.profiles && (
                      <span className="text-xs text-muted-foreground">
                        por {event.profiles.full_name || event.profiles.email}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateEventDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedDate={selectedDate}
        onSuccess={fetchEvents}
      />

      <EventDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        event={selectedEvent}
        onEventDeleted={fetchEvents}
      />
    </MainLayout>
  );
};

export default CalendarioMarketing;
