import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
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

        {/* Calendar */}
        <Card className="card-pure">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg capitalize">
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
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
              {Object.entries(TAG_CONFIG).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${config.bgColor}`} />
                  <span className="text-sm text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map((_, index) => (
                <div key={`padding-${index}`} className="min-h-[80px] p-1" />
              ))}

              {daysInMonth.map((date) => {
                const dayContent = getContentForDay(date);
                const hasContent = dayContent.length > 0;

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDayClick(date)}
                    className={`
                      min-h-[80px] p-1 rounded-lg text-sm transition-colors flex flex-col
                      ${isToday(date) ? 'ring-2 ring-primary' : ''}
                      ${!isSameMonth(date, currentDate) ? 'text-muted-foreground/50' : ''}
                      ${hasContent ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/30'}
                    `}
                  >
                    <span className={`text-xs font-medium mb-1 ${isToday(date) ? 'text-primary font-bold' : ''}`}>
                      {format(date, 'd')}
                    </span>
                    {hasContent && (
                      <div className="flex flex-col gap-0.5 flex-1">
                        {dayContent.slice(0, 2).map((c, i) => {
                          const tagConfig = c.tag ? TAG_CONFIG[c.tag] : (c.content_type ? TAG_CONFIG[c.content_type] : null);
                          return (
                            <span 
                              key={i} 
                              className={`text-[10px] px-1 py-0.5 rounded text-white truncate ${tagConfig?.bgColor || 'bg-primary'}`}
                            >
                              {tagConfig?.label || 'Conteúdo'}
                            </span>
                          );
                        })}
                        {dayContent.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{dayContent.length - 2} mais
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

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
