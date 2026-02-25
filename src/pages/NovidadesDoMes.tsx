import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, MessageCircle } from 'lucide-react';
import NewsCard, { NewsPost } from '@/components/novidades/NewsCard';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import TimelineLandingPage, { hasLandingPage } from '@/components/timeline/TimelineLandingPage';

const POSTS_PER_PAGE = 4;

// Months that always appear even without DB posts (landing pages)
const FIXED_MONTHS = ['2026-03'];

const NovidadesDoMes = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isApproved } = useAuth();
  const [allPosts, setAllPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Generate month options from posts + fixed landing pages
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>(FIXED_MONTHS);

    allPosts.forEach(post => {
      const monthKey = post.target_month
        ? format(parseISO(post.target_month), 'yyyy-MM')
        : format(new Date(post.created_at), 'yyyy-MM');
      monthsSet.add(monthKey);
    });

    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map(value => {
        const [year, month] = value.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return { date, label: format(date, 'MMMM yyyy', { locale: ptBR }), value };
      });
  }, [allPosts]);

  // Auto-select first month
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0].value);
    }
  }, [availableMonths, selectedMonth]);

  // Filter posts for legacy feed view
  const filteredPosts = useMemo(() => {
    if (!selectedMonth) return [];
    return allPosts.filter(post => {
      const monthKey = post.target_month
        ? format(parseISO(post.target_month), 'yyyy-MM')
        : format(new Date(post.created_at), 'yyyy-MM');
      return monthKey === selectedMonth;
    });
  }, [allPosts, selectedMonth]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .eq('post_type', 'novidades')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!postsData?.length) { setAllPosts([]); setLoading(false); return; }

      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url }])
      );

      setAllPosts(postsData.map(post => ({
        id: post.id, title: post.title, content: post.content,
        sector: post.sector as NewsPost['sector'],
        image_url: post.image_url, cover_image_url: post.cover_image_url,
        short_description: post.short_description, target_month: post.target_month,
        video_url: post.video_url, pinned: post.pinned || false,
        created_at: post.created_at, user_id: post.user_id,
        profiles: profilesMap.get(post.user_id) || null,
        comments: [],
      })));
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Auth guards
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    if (!authLoading && user && !isApproved) navigate('/aguardando-aprovacao');
  }, [user, authLoading, isApproved, navigate]);

  useEffect(() => {
    if (user && isApproved) fetchPosts();
  }, [user, isApproved, fetchPosts]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('novidades-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchPosts]);

  useEffect(() => { setCurrentPage(1); }, [selectedMonth]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  const handlePageChange = (page: number) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const showLandingPage = selectedMonth && hasLandingPage(selectedMonth);

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
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Timeline do Mês
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Nossa timeline agora mudou e está muito mais fácil de acessar. Através do nosso hub, você consegue ver todos os conteúdos do mês atual e os anteriores, garantindo mais transparência e facilidade.
          </p>
        </div>

        {/* Month filter */}
        {availableMonths.length > 0 && (
          <ScrollArea className="w-full mb-6">
            <div className="flex gap-2 pb-2">
              {availableMonths.map(month => (
                <Button
                  key={month.value}
                  variant={selectedMonth === month.value ? 'default' : 'outline'}
                  size="sm"
                  className="whitespace-nowrap capitalize"
                  onClick={() => setSelectedMonth(month.value)}
                >
                  {month.label}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Content */}
        {showLandingPage ? (
          <TimelineLandingPage monthKey={selectedMonth!} />
        ) : (
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
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
                  <h3 className="text-lg font-medium mb-2">Nenhuma novidade neste mês</h3>
                  <p className="text-muted-foreground text-center">
                    Volte mais tarde para conferir as atualizações.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-6">
                  {paginatedPosts.map(post => (
                    <NewsCard key={post.id} post={post} onPostUpdated={fetchPosts} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <Pagination className="mt-6">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
        )}
      </div>
    </MainLayout>
  );
};

export default NovidadesDoMes;
