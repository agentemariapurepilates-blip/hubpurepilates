import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Video, Image, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateSocialMediaDialog from '@/components/social-media/CreateContentDialog';
import ContentDetailsDialog from '@/components/social-media/ContentDetailsDialog';
import EditContentDialog from '@/components/social-media/EditContentDialog';

interface SocialMediaContent {
  id: string;
  title: string;
  description: string | null;
  google_drive_url: string | null;
  content_type: string | null;
  posting_date: string | null;
  tag: 'reels' | 'desafio_semana' | 'carrossel' | null;
  start_date: string;
  end_date: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

const TAG_CONFIG: Record<string, { label: string; bgColor: string }> = {
  reels: { label: 'Reels', bgColor: 'bg-purple-500' },
  desafio_semana: { label: 'Desafio', bgColor: 'bg-red-500' },
  carrossel: { label: 'Carrossel', bgColor: 'bg-teal-500' },
};

const CONTENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  video: Video,
  image: Image,
  document: FileText,
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

  const upcomingContent = content
    .filter((c) => {
      const contentDate = c.posting_date ? parseISO(c.posting_date) : parseISO(c.start_date);
      return contentDate >= new Date();
    })
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Mídias Sociais</h1>
            <p className="text-muted-foreground">Calendário de conteúdos para redes sociais</p>
          </div>
          {isColaborador && (
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Conteúdo
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="card-pure lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, index) => (
                  <div key={`padding-${index}`} className="aspect-square p-1" />
                ))}

                {daysInMonth.map((date) => {
                  const dayContent = getContentForDay(date);
                  const hasContent = dayContent.length > 0;

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDayClick(date)}
                      className={`
                        aspect-square p-1 rounded-lg text-sm transition-colors relative
                        ${isToday(date) ? 'bg-primary text-primary-foreground font-bold' : ''}
                        ${!isSameMonth(date, currentDate) ? 'text-muted-foreground/50' : ''}
                        ${hasContent ? 'bg-accent/50 hover:bg-accent' : 'hover:bg-muted'}
                      `}
                    >
                      <span className="block">{format(date, 'd')}</span>
                      {hasContent && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayContent.slice(0, 3).map((c, i) => {
                            const tagConfig = c.tag ? TAG_CONFIG[c.tag] : null;
                            return (
                              <span 
                                key={i} 
                                className={`w-2 h-2 rounded-full ${tagConfig?.bgColor || 'bg-primary'}`} 
                              />
                            );
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Content */}
          <Card className="card-pure">
            <CardHeader>
              <CardTitle className="text-lg">Próximos Conteúdos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground text-sm">Carregando...</p>
              ) : upcomingContent.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum conteúdo programado</p>
              ) : (
                upcomingContent.map((c) => {
                  const Icon = CONTENT_TYPE_ICONS[c.content_type || 'video'] || Video;
                  const tagConfig = c.tag ? TAG_CONFIG[c.tag] : null;
                  const contentDate = c.posting_date ? parseISO(c.posting_date) : parseISO(c.start_date);
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedContent(c);
                        setIsDetailsDialogOpen(true);
                      }}
                      className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{c.title}</p>
                            {tagConfig && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white ${tagConfig.bgColor}`}>
                                {tagConfig.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(contentDate, 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
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
      </div>
    </MainLayout>
  );
};

export default MidiasSociais;
