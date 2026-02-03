import { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Plus, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { EditEventDialog } from '@/components/calendar/EditEventDialog';
import { EventDetailsDialog } from '@/components/calendar/EventDetailsDialog';

interface MarketingEvent {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  tag: 'pacotes' | 'pure_pass' | 'pure_club' | null;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

const tagConfig = {
  pacotes: { label: 'Pacotes', color: 'bg-blue-500 text-white' },
  pure_pass: { label: 'Pure Pass', color: 'bg-green-500 text-white' },
  pure_club: { label: 'Pure Club', color: 'bg-purple-500 text-white' },
};

const CalendarioMarketing = () => {
  const { isColaborador, isAdmin } = useAuth();
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MarketingEvent | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data: eventsData, error } = await supabase
        .from('marketing_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

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
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  // Generate array of months to display (current + next 5)
  const months = useMemo(() => {
    const monthsArray = [];
    for (let i = 0; i < 6; i++) {
      monthsArray.push(addMonths(startOfMonth(new Date()), i));
    }
    return monthsArray;
  }, []);

  // Filter events by search and current month
  const filteredEvents = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    return events.filter(event => {
      // Check if event overlaps with current month
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      
      const overlapsMonth = (
        isWithinInterval(monthStart, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(monthEnd, { start: eventStart, end: eventEnd }) ||
        isWithinInterval(eventStart, { start: monthStart, end: monthEnd }) ||
        isWithinInterval(eventEnd, { start: monthStart, end: monthEnd })
      );

      if (!overlapsMonth) return false;

      // Apply search filter
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        event.title.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        (event.tag && tagConfig[event.tag].label.toLowerCase().includes(searchLower))
      );
    });
  }, [events, currentMonth, searchTerm]);

  const handleEventClick = (event: MarketingEvent) => {
    setSelectedEvent(event);
    setIsDetailsDialogOpen(true);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleMonthClick = (month: Date) => {
    setCurrentMonth(month);
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    
    if (format(startDate, 'MMM yyyy') === format(endDate, 'MMM yyyy')) {
      return `${format(startDate, 'dd')} - ${format(endDate, 'dd MMM', { locale: ptBR })}`;
    }
    return `${format(startDate, 'dd MMM', { locale: ptBR })} - ${format(endDate, 'dd MMM', { locale: ptBR })}`;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">Próximas Promoções</h1>
            </div>
            {(isColaborador || isAdmin) && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Promoção</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar promoções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Month Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <ScrollArea className="flex-1">
              <div className="flex gap-2 pb-2">
                {months.map((month) => {
                  const isActive = format(month, 'yyyy-MM') === format(currentMonth, 'yyyy-MM');
                  return (
                    <Button
                      key={month.toISOString()}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMonthClick(month)}
                      className="whitespace-nowrap"
                    >
                      {format(month, 'MMMM yyyy', { locale: ptBR })}
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma promoção encontrada</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? 'Tente uma busca diferente' 
                  : `Nenhuma promoção para ${format(currentMonth, 'MMMM yyyy', { locale: ptBR })}`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card 
                key={event.id}
                className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]"
                onClick={() => handleEventClick(event)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{event.title}</CardTitle>
                    {event.tag && (
                      <Badge className={`shrink-0 ${tagConfig[event.tag].color}`}>
                        {tagConfig[event.tag].label}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(event.start_date, event.end_date)}</span>
                  </div>
                  {event.description && (
                    <div 
                      className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none [&>*]:m-0"
                      dangerouslySetInnerHTML={{ __html: event.description }}
                    />
                  )}
                  {event.profiles && (
                    <p className="text-xs text-muted-foreground mt-2">
                      por {event.profiles.full_name || event.profiles.email}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CreateEventDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          selectedDate={new Date()}
          onSuccess={fetchEvents}
        />

        <EventDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          event={selectedEvent}
          onEventDeleted={fetchEvents}
          onEditClick={() => setIsEditDialogOpen(true)}
        />

        <EditEventDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          event={selectedEvent}
          onSuccess={fetchEvents}
        />
      </div>
    </MainLayout>
  );
};

export default CalendarioMarketing;
