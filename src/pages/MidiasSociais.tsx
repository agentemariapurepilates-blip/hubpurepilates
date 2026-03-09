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
  const { isColaborador, isAdmin } = useAuth();
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

  const handleContentClick = (e: React.MouseEvent, item: SocialMediaContent) => {
    e.stopPropagation();
    setSelectedContent(item);
    setIsDetailsDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    const dayContent = getContentForDay(date);
    if (dayContent.length === 0 && (isColaborador || isAdmin)) {
      setSelectedDate(date);
      setIsCreateDialogOpen(true);
    }
  };

  const handleEditClick = () => {
    setIsDetailsDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">Mídias Sociais</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Calendário de conteúdos para redes sociais</p>
          </div>
          {(isColaborador || isAdmin) && (
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Conteúdo
            </Button>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
          {Object.entries(TAG_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 sm:gap-2">
              <span className={cn("w-3 h-3 sm:w-4 sm:h-4 rounded", TAG_LEGEND_COLORS[key])} />
              <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {/* Month Navigation */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/30">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="h-8 w-8 sm:h-10 sm:w-10">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h2 className="text-base sm:text-xl font-semibold capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 sm:h-10 sm:w-10">
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-border">
            {weekDays.map((day, index) => (
              <div key={day} className="p-1.5 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground bg-muted/20">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{weekDaysShort[index]}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="min-h-16 sm:min-h-24 md:min-h-28 p-1 sm:p-2 border-b border-r border-border bg-muted/10" />
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
                    "min-h-16 sm:min-h-24 md:min-h-28 p-1 sm:p-2 border-b border-r border-border cursor-pointer transition-colors hover:bg-accent/50",
                    !isSameMonth(day, currentDate) && "bg-muted/20 text-muted-foreground",
                    isDayToday && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-xs sm:text-sm font-medium mb-0.5 sm:mb-1",
                    isDayToday && "text-primary font-bold"
                  )}>
                    {format(day, 'd')}
                  </div>
                  {hasContent && (
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayContent.map(c => {
                        const tag = c.tag || c.content_type;
                        const colorClass = tag && TAG_COLORS[tag] ? TAG_COLORS[tag] : 'bg-primary text-primary-foreground';
                        const TagIcon = tag && TAG_ICONS[tag] ? TAG_ICONS[tag] : Video;
                        return (
                          <div
                            key={c.id}
                            onClick={(e) => handleContentClick(e, c)}
                            className={cn(
                              "text-[10px] sm:text-xs p-1 sm:p-1.5 rounded font-medium flex items-center gap-0.5 sm:gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                              colorClass
                            )}
                            title={c.title}
                          >
                            <TagIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                            <span className="truncate hidden sm:inline">{c.title}</span>
                          </div>
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
