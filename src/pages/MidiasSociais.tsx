import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Video,
  Image,
  Target,
  LayoutGrid,
  LucideIcon,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateSocialMediaDialog from '@/components/social-media/CreateContentDialog';
import ContentDetailsDialog from '@/components/social-media/ContentDetailsDialog';
import EditContentDialog from '@/components/social-media/EditContentDialog';
import { cn } from '@/lib/utils';

interface SocialMediaContent {
  id: string;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  content_type: string | null;
  posting_date: string | null;
  tag: 'reels' | 'desafio_semana' | 'carrossel' | 'estatico' | null;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

const TAG_LABELS: Record<string, string> = {
  reels: 'Reels',
  desafio_semana: 'Desafio da Semana',
  carrossel: 'Carrossel',
  estatico: 'Estático',
};

const TAG_COLORS: Record<string, string> = {
  reels: 'bg-purple-500 text-white',
  desafio_semana: 'bg-red-500 text-white',
  carrossel: 'bg-teal-500 text-white',
  estatico: 'bg-blue-500 text-white',
};

const TAG_LEGEND_COLORS: Record<string, string> = {
  reels: 'bg-purple-500',
  desafio_semana: 'bg-red-500',
  carrossel: 'bg-teal-500',
  estatico: 'bg-blue-500',
};

const TAG_ICONS: Record<string, LucideIcon> = {
  reels: Video,
  desafio_semana: Target,
  carrossel: LayoutGrid,
  estatico: Image,
};

const MidiasSociais = () => {
  const { isColaborador } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [content, setContent] = useState<SocialMediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedContent, setSelectedContent] = useState<SocialMediaContent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('social_media_content')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
      return;
    }

    // Fetch profiles for creators
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.user_id, { full_name: p.full_name, email: p.email }])
      );

      const contentWithProfiles = data.map((c) => ({
        ...c,
        profiles: profilesMap.get(c.user_id) || null,
      }));

      setContent(contentWithProfiles);
    } else {
      setContent([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('social-media-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_media_content' }, () =>
        fetchContent()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for proper calendar alignment
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getContentForDay = (date: Date) => {
    return content.filter((c) => {
      const contentDate = c.posting_date ? parseISO(c.posting_date) : parseISO(c.start_date);
      return isSameDay(date, contentDate);
    });
  };

  const handleDayClick = (date: Date) => {
    const dayContent = getContentForDay(date);
    if (dayContent.length > 0) {
      setSelectedContent(dayContent[0]);
      setIsDetailsDialogOpen(true);
    } else if (isColaborador) {
      setSelectedDate(date);
      setIsCreateDialogOpen(true);
    }
  };

  const handleEditClick = () => {
    setIsDetailsDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mídias Sociais</h1>
            <p className="text-muted-foreground mt-1">Calendário de conteúdos para redes sociais</p>
          </div>
          {isColaborador && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Conteúdo
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6">
          {Object.entries(TAG_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={cn("w-4 h-4 rounded", TAG_LEGEND_COLORS[key])} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
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
              <div key={`padding-${index}`} className="min-h-28 p-2 border-b border-r border-border bg-muted/10" />
            ))}
            {daysInMonth.map(day => {
              const dayContent = getContentForDay(day);
              const hasContent = dayContent.length > 0;
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-28 p-2 border-b border-r border-border cursor-pointer transition-colors hover:bg-accent/50",
                    !isSameMonth(day, currentDate) && "bg-muted/20 text-muted-foreground",
                    isDayToday && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isDayToday && "text-primary font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                  {hasContent && (
                    <div className="space-y-1">
                      {dayContent.slice(0, 2).map(c => {
                        const tag = c.tag || c.content_type;
                        const colorClass = tag && TAG_COLORS[tag] ? TAG_COLORS[tag] : 'bg-primary text-primary-foreground';
                        const TagIcon = tag && TAG_ICONS[tag] ? TAG_ICONS[tag] : Video;
                        return (
                          <div
                            key={c.id}
                            className={cn(
                              "text-xs p-1.5 rounded font-medium flex items-center gap-1",
                              colorClass
                            )}
                            title={c.title}
                          >
                            <TagIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{c.title}</span>
                          </div>
                        );
                      })}
                      {dayContent.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayContent.length - 2} mais
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <CreateSocialMediaDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        selectedDate={selectedDate}
        onContentCreated={fetchContent}
      />

      {/* Details Dialog */}
      <ContentDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        content={selectedContent}
        onDeleted={fetchContent}
        onEditClick={handleEditClick}
      />

      {/* Edit Dialog */}
      <EditContentDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        content={selectedContent}
        onContentUpdated={fetchContent}
      />
    </MainLayout>
  );
};

export default MidiasSociais;
