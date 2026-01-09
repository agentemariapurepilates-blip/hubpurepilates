import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, MessageCircle } from 'lucide-react';
import NewsCard, { NewsPost } from '@/components/novidades/NewsCard';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
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

const POSTS_PER_PAGE = 4;

const NovidadesDoMes = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isApproved, isColaborador } = useAuth();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);

  // Generate last 12 months for filter
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      months.push({
        date,
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
        value: format(date, 'yyyy-MM'),
      });
    }
    return months;
  };

  const monthOptions = generateMonthOptions();

  const fetchPosts = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      // First try to filter by target_month
      let query = supabase
        .from('posts')
        .select('*')
        .eq('post_type', 'novidades');

      // Filter by target_month if set, otherwise fall back to created_at
      const { data: postsData, error: postsError } = await query
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Filter posts by target_month or created_at (for backward compatibility)
      const filteredPosts = postsData.filter(post => {
        if (post.target_month) {
          const targetDate = parseISO(post.target_month);
          return format(targetDate, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM');
        }
        // Fall back to created_at for old posts without target_month
        const createdDate = new Date(post.created_at);
        return format(createdDate, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM');
      });

      if (filteredPosts.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all post authors
      const userIds = [...new Set(filteredPosts.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url }])
      );

      // Fetch all comments for these posts
      const postIds = filteredPosts.map(p => p.id);
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id, content, emoji, created_at, user_id, post_id')
        .in('post_id', postIds)
        .order('created_at', { ascending: true });

      // Fetch profiles for comment authors
      const commentUserIds = [...new Set((commentsData || []).map(c => c.user_id))];
      if (commentUserIds.length > 0) {
        const { data: commentProfilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url')
          .in('user_id', commentUserIds);

        (commentProfilesData || []).forEach(p => {
          if (!profilesMap.has(p.user_id)) {
            profilesMap.set(p.user_id, { full_name: p.full_name, email: p.email, avatar_url: p.avatar_url });
          }
        });
      }

      // Group comments by post_id
      const commentsMap = new Map<string, NewsPost['comments']>();
      (commentsData || []).forEach(comment => {
        const profile = profilesMap.get(comment.user_id) || null;
        const commentWithProfile = {
          id: comment.id,
          content: comment.content,
          emoji: comment.emoji,
          created_at: comment.created_at,
          profiles: profile,
        };
        
        if (!commentsMap.has(comment.post_id)) {
          commentsMap.set(comment.post_id, []);
        }
        commentsMap.get(comment.post_id)!.push(commentWithProfile);
      });

      // Combine everything
      const postsWithDetails: NewsPost[] = filteredPosts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        sector: post.sector as NewsPost['sector'],
        image_url: post.image_url,
        cover_image_url: post.cover_image_url,
        short_description: post.short_description,
        target_month: post.target_month,
        pinned: post.pinned || false,
        created_at: post.created_at,
        user_id: post.user_id,
        profiles: profilesMap.get(post.user_id) || null,
        comments: commentsMap.get(post.id) || [],
      }));

      setPosts(postsWithDetails);
      setCurrentPage(1); // Reset to first page when month changes
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth]);

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

  // Pagination logic
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

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
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Novidades do Mês
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atualizações e comunicados importantes
            </p>
          </div>

          {isColaborador && (
            <CreatePostDialog 
              onPostCreated={fetchPosts} 
              defaultPostType="novidades"
            />
          )}
        </div>

        {/* Month filter */}
        <ScrollArea className="w-full mb-6">
          <div className="flex gap-2 pb-2">
            {monthOptions.map((month) => {
              const isSelected = format(selectedMonth, 'yyyy-MM') === month.value;
              return (
                <Button
                  key={month.value}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="whitespace-nowrap capitalize"
                  onClick={() => setSelectedMonth(month.date)}
                >
                  {month.label}
                </Button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Posts grid */}
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
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma novidade neste mês</h3>
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
    </MainLayout>
  );
};

export default NovidadesDoMes;
