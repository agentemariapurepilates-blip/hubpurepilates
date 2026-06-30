import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Image,
  Target,
  LayoutGrid,
  Instagram,
  Download,
  Copy,
  ExternalLink,
  LucideIcon,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CreateSocialMediaDialog from '@/components/social-media/CreateContentDialog';
import ContentDetailsDialog from '@/components/social-media/ContentDetailsDialog';
import EditContentDialog from '@/components/social-media/EditContentDialog';
import { cn } from '@/lib/utils';

// instagram_feed ainda não está no types.ts gerado (regenerar após a migration).
const db = supabase as unknown as SupabaseClient;

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
  profiles?: { full_name: string | null; email: string } | null;
}

// Espelho do Instagram oficial (já publicado), puxado por instagram-feed-sync.
interface FeedChild { media_type?: string; media_url: string | null }
interface FeedItem {
  id: string;
  ig_media_id: string;
  media_type: string | null;        // IMAGE | VIDEO | CAROUSEL_ALBUM
  caption: string | null;
  permalink: string | null;
  ig_timestamp: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  children: FeedChild[];
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

// tipo (e cor) de um post publicado no Instagram
const feedTag = (it: FeedItem): 'reels' | 'carrossel' | 'estatico' =>
  it.media_type === 'VIDEO' ? 'reels' : it.media_type === 'CAROUSEL_ALBUM' ? 'carrossel' : 'estatico';

const feedThumb = (it: FeedItem): string | null =>
  it.media_type === 'CAROUSEL_ALBUM' ? (it.children?.[0]?.media_url ?? it.media_url)
    : it.media_type === 'VIDEO' ? (it.thumbnail_url ?? it.media_url)
    : it.media_url;

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, '_blank');
  }
}

const MidiasSociais = () => {
  const { isColaborador, isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [content, setContent] = useState<SocialMediaContent[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedContent, setSelectedContent] = useState<SocialMediaContent | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<FeedItem | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFeedOpen, setIsFeedOpen] = useState(false);

  const fetchContent = async () => {
    const { data, error } = await db
      .from('social_media_content')
      .select('*')
      .is('brand', null)
      .order('start_date', { ascending: true });
    if (error) { console.error('Error fetching content:', error); return; }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles').select('user_id, full_name, email').in('user_id', userIds);
      const profilesMap = new Map((profilesData || []).map((p) => [p.user_id, { full_name: p.full_name, email: p.email }]));
      setContent(data.map((c) => ({ ...c, profiles: profilesMap.get(c.user_id) || null })));
    } else {
      setContent([]);
    }
  };

  const fetchFeed = async () => {
    const { data, error } = await db
      .from('instagram_feed').select('*')
      .order('ig_timestamp', { ascending: false, nullsFirst: false });
    if (error) { console.error('Error fetching instagram feed:', error); return; }
    setFeed((data ?? []) as FeedItem[]);
  };

  useEffect(() => {
    Promise.all([fetchContent(), fetchFeed()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel('midias-sociais-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_media_content' }, () => {
        clearTimeout(t1); t1 = setTimeout(() => fetchContent(), 1500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instagram_feed' }, () => {
        clearTimeout(t2); t2 = setTimeout(() => fetchFeed(), 1500);
      })
      .subscribe();
    return () => { clearTimeout(t1); clearTimeout(t2); supabase.removeChannel(channel); };
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => null);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getContentForDay = (date: Date) =>
    content.filter((c) => {
      const d = c.posting_date ? parseISO(c.posting_date) : parseISO(c.start_date);
      return isSameDay(date, d);
    });

  const getFeedForDay = (date: Date) =>
    feed.filter((f) => f.ig_timestamp && isSameDay(date, parseISO(f.ig_timestamp)));

  const handleContentClick = (e: React.MouseEvent, item: SocialMediaContent) => {
    e.stopPropagation();
    setSelectedContent(item);
    setIsDetailsDialogOpen(true);
  };

  const handleFeedClick = (e: React.MouseEvent, item: FeedItem) => {
    e.stopPropagation();
    setSelectedFeed(item);
    setIsFeedOpen(true);
  };

  const handleDayClick = (date: Date) => {
    if (getContentForDay(date).length === 0 && (isColaborador || isAdmin)) {
      setSelectedDate(date);
      setIsCreateDialogOpen(true);
    }
  };

  const handleEditClick = () => {
    setIsDetailsDialogOpen(false);
    setIsEditDialogOpen(true);
  };

  const copyCaption = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Legenda copiada!'); }
    catch { toast.error('Não foi possível copiar'); }
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDaysShort = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">Mídias Sociais</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Calendário de conteúdos — com o que já foi publicado no Instagram oficial</p>
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-600" />
            <span className="text-xs sm:text-sm text-muted-foreground">Publicado no Instagram</span>
          </div>
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
              const dayFeed = getFeedForDay(day);
              const hasContent = dayContent.length > 0 || dayFeed.length > 0;
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
                  <div className={cn("text-xs sm:text-sm font-medium mb-0.5 sm:mb-1", isDayToday && "text-primary font-bold")}>
                    {format(day, 'd')}
                  </div>
                  {hasContent && (
                    <div className="space-y-0.5 sm:space-y-1">
                      {/* Planejamento (social_media_content) */}
                      {dayContent.map(c => {
                        const tag = c.tag || c.content_type;
                        const colorClass = tag && TAG_COLORS[tag] ? TAG_COLORS[tag] : 'bg-primary text-primary-foreground';
                        const TagIcon = tag && TAG_ICONS[tag] ? TAG_ICONS[tag] : Video;
                        return (
                          <div
                            key={c.id}
                            onClick={(e) => handleContentClick(e, c)}
                            className={cn("text-[10px] sm:text-xs p-1 sm:p-1.5 rounded font-medium flex items-center gap-0.5 sm:gap-1 cursor-pointer hover:opacity-80 transition-opacity", colorClass)}
                            title={c.title}
                          >
                            <TagIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                            <span className="truncate hidden sm:inline">{c.title}</span>
                          </div>
                        );
                      })}
                      {/* Espelho do Instagram (já publicado) */}
                      {dayFeed.map(f => {
                        const tag = feedTag(f);
                        const colorClass = TAG_COLORS[tag];
                        return (
                          <div
                            key={f.id}
                            onClick={(e) => handleFeedClick(e, f)}
                            className={cn("text-[10px] sm:text-xs p-1 sm:p-1.5 rounded font-medium flex items-center gap-0.5 sm:gap-1 cursor-pointer hover:opacity-80 transition-opacity ring-1 ring-inset ring-white/40", colorClass)}
                            title={f.caption ?? 'Publicação Instagram'}
                          >
                            <Instagram className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                            <span className="truncate hidden sm:inline">{f.caption || TAG_LABELS[tag]}</span>
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

      {/* Dialogs do planejamento (inalterados) */}
      <CreateSocialMediaDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} selectedDate={selectedDate} onContentCreated={fetchContent} />
      <ContentDetailsDialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} content={selectedContent} onDeleted={fetchContent} onEditClick={handleEditClick} />
      <EditContentDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} content={selectedContent} onContentUpdated={fetchContent} />

      {/* Detalhe do post publicado no Instagram — baixar + copiar legenda */}
      <Dialog open={isFeedOpen} onOpenChange={setIsFeedOpen}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              {selectedFeed && TAG_LABELS[feedTag(selectedFeed)]}
            </DialogTitle>
          </DialogHeader>
          {selectedFeed && (
            <div className="space-y-3">
              {selectedFeed.media_type === 'CAROUSEL_ALBUM' ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {selectedFeed.children.map((c, i) => (
                    <img key={i} src={c.media_url ?? ''} alt="" className="h-56 rounded-lg object-cover flex-shrink-0" />
                  ))}
                </div>
              ) : selectedFeed.media_type === 'VIDEO' ? (
                <video src={selectedFeed.media_url ?? ''} poster={selectedFeed.thumbnail_url ?? undefined} controls className="w-full rounded-lg max-h-[60vh]" />
              ) : (
                <img src={selectedFeed.media_url ?? ''} alt="" className="w-full rounded-lg object-contain max-h-[60vh]" />
              )}

              {selectedFeed.ig_timestamp && (
                <p className="text-xs text-muted-foreground">
                  Publicado em {format(new Date(selectedFeed.ig_timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
              {selectedFeed.caption && <p className="text-sm whitespace-pre-wrap">{selectedFeed.caption}</p>}

              <div className="flex flex-wrap gap-2 pt-1">
                {selectedFeed.media_type === 'CAROUSEL_ALBUM' ? (
                  <Button variant="outline" size="sm" onClick={() => selectedFeed.children.forEach((c, i) => c.media_url && downloadFile(c.media_url, `carrossel_${selectedFeed.ig_media_id}_${i + 1}.jpg`))}>
                    <Download className="h-4 w-4 mr-2" /> Baixar carrossel ({selectedFeed.children.length})
                  </Button>
                ) : selectedFeed.media_url ? (
                  <Button variant="outline" size="sm" onClick={() => downloadFile(selectedFeed.media_url!, `post_${selectedFeed.ig_media_id}.${selectedFeed.media_type === 'VIDEO' ? 'mp4' : 'jpg'}`)}>
                    <Download className="h-4 w-4 mr-2" /> Baixar conteúdo
                  </Button>
                ) : null}
                {selectedFeed.caption && (
                  <Button variant="outline" size="sm" onClick={() => copyCaption(selectedFeed.caption!)}>
                    <Copy className="h-4 w-4 mr-2" /> Copiar legenda
                  </Button>
                )}
                {selectedFeed.permalink && (
                  <Button asChild size="sm">
                    <a href={selectedFeed.permalink} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" /> Ver no Instagram
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default MidiasSociais;
