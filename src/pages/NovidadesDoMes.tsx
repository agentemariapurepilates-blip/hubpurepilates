import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, MessageCircle, Filter } from 'lucide-react';
import NewsCard, { NewsPost } from '@/components/novidades/NewsCard';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

const POSTS_PER_PAGE = 4;

const SECTORS = [
  { value: 'all', label: 'Todos' },
  { value: 'estudios', label: 'Estúdios' },
  { value: 'franchising', label: 'Franchising' },
  { value: 'academy', label: 'Academy' },
  { value: 'consultoras', label: 'Consultoras' },
  { value: 'implantacao', label: 'Implantação' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'expansao', label: 'Expansão' },
  { value: 'pure_store', label: 'Pure Store' },
];

const NovidadesDoMes = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isApproved, isColaborador } = useAuth();
  const [allPosts, setAllPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Generate month options based on posts that have content
  const availableMonths = useMemo(() => {
    if (allPosts.length === 0) return [];
    
    const monthsSet = new Set<string>();
    
    allPosts.forEach(post => {
      let monthKey: string;
      if (post.target_month) {
        monthKey = format(parseISO(post.target_month), 'yyyy-MM');
      } else {
        monthKey = format(new Date(post.created_at), 'yyyy-MM');
      }
      monthsSet.add(monthKey);
    });
    
    // Convert to array and sort descending (newest first)
    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map(monthKey => {
        const [year, month] = monthKey.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return {
          date,
          label: format(date, 'MMMM yyyy', { locale: ptBR }),
          value: monthKey,
        };
      });
  }, [allPosts]);

  // Get sectors that have posts in the current month
  const availableSectors = useMemo(() => {
    if (!selectedMonth) return SECTORS;
    
    const sectorsWithPosts = new Set<string>();
    allPosts.forEach(post => {
      let monthKey: string;
      if (post.target_month) {
        monthKey = format(parseISO(post.target_month), 'yyyy-MM');
      } else {
        monthKey = format(new Date(post.created_at), 'yyyy-MM');
      }
      if (monthKey === selectedMonth) {
        sectorsWithPosts.add(post.sector);
      }
    });

    return SECTORS.filter(s => s.value === 'all' || sectorsWithPosts.has(s.value));
  }, [allPosts, selectedMonth]);

  // Auto-select first available month when data loads
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].value);
    }
  }, [availableMonths, selectedMonth]);

  // Filter posts by selected month and sector
  const filteredPosts = useMemo(() => {
    if (!selectedMonth) return [];
    
    return allPosts.filter(post => {
      // Filter by month
      let monthKey: string;
      if (post.target_month) {
        monthKey = format(parseISO(post.target_month), 'yyyy-MM');
      } else {
        monthKey = format(new Date(post.created_at), 'yyyy-MM');
      }
      if (monthKey !== selectedMonth) return false;

      // Filter by sector
      if (selectedSector !== 'all' && post.sector !== selectedSector) {
        return false;
      }

      return true;
    });
  }, [allPosts, selectedMonth, selectedSector]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('post_type', 'novidades')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setAllPosts([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all post authors
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url }])
      );

      // Combine everything
      const postsWithDetails: NewsPost[] = postsData.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        sector: post.sector as NewsPost['sector'],
        image_url: post.image_url,
        cover_image_url: post.cover_image_url,
        short_description: post.short_description,
        target_month: post.target_month,
        video_url: post.video_url,
        pinned: post.pinned || false,
        created_at: post.created_at,
        user_id: post.user_id,
        profiles: profilesMap.get(post.user_id) || null,
        comments: [],
      }));

      setAllPosts(postsWithDetails);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (!authLoading && user && !isApproved) {
      navigate('/aguardando-aprovacao');
    }
  }, [user, authLoading, isApproved, navigate]);

  useEffect(() => {
    if (user && isApproved) {
      fetchPosts();
    }
  }, [user, isApproved, fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('novidades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
        },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPosts]);

  // Reset page when month or sector changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedSector]);

  // Reset sector filter when month changes if current sector has no posts
  useEffect(() => {
    if (selectedSector !== 'all' && !availableSectors.find(s => s.value === selectedSector)) {
      setSelectedSector('all');
    }
  }, [availableSectors, selectedSector]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Timeline do Mês
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Nossa timeline agora mudou e está muito mais fácil de acessar. Através do nosso hub, você consegue ver todos os conteúdos do mês atual e os anteriores, garantindo mais transparência e facilidade.
            </p>
          </div>

          {isColaborador && (
            <CreatePostDialog 
              onPostCreated={fetchPosts} 
              defaultPostType="novidades"
            />
          )}
        </div>

        {/* Month filter - only show if there are months with content */}
        {availableMonths.length > 0 && (
          <ScrollArea className="w-full mb-6">
            <div className="flex gap-2 pb-2">
              {availableMonths.map((month) => {
                const isSelected = selectedMonth === month.value;
                return (
                  <Button
                    key={month.value}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="whitespace-nowrap capitalize"
                    onClick={() => setSelectedMonth(month.value)}
                  >
                    {month.label}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Main content with sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sector filter sidebar */}
          <aside className="lg:w-56 shrink-0">
            <div className="sticky top-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Filtrar por setor</span>
              </div>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {availableSectors.map((sector) => {
                  const isSelected = selectedSector === sector.value;
                  const postCount = sector.value === 'all' 
                    ? filteredPosts.length 
                    : allPosts.filter(p => {
                        let monthKey: string;
                        if (p.target_month) {
                          monthKey = format(parseISO(p.target_month), 'yyyy-MM');
                        } else {
                          monthKey = format(new Date(p.created_at), 'yyyy-MM');
                        }
                        return monthKey === selectedMonth && p.sector === sector.value;
                      }).length;

                  return (
                    <Button
                      key={sector.value}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-start h-auto py-2 px-3",
                        isSelected 
                          ? "bg-primary/10 text-primary hover:bg-primary/20" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => setSelectedSector(sector.value)}
                    >
                      <span className="flex-1 text-left">{sector.label}</span>
                      <span className={cn(
                        "text-xs rounded-full px-2 py-0.5 ml-2",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {postCount}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Posts content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-5">
                      <Skeleton className="h-5 w-24 mb-3" />
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <Skeleton className="h-8 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {availableMonths.length === 0 
                      ? 'Nenhuma novidade cadastrada'
                      : selectedSector !== 'all'
                        ? `Nenhuma novidade de ${SECTORS.find(s => s.value === selectedSector)?.label} neste mês`
                        : 'Nenhuma novidade neste mês'}
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {isColaborador 
                      ? 'Seja o primeiro a postar uma novidade!'
                      : 'Volte mais tarde para conferir as atualizações.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-6">
                  {paginatedPosts.map((post) => (
                    <NewsCard
                      key={post.id}
                      post={post}
                      onPostUpdated={fetchPosts}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === currentPage}
                            onClick={() => handlePageChange(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NovidadesDoMes;
