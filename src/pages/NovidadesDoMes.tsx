import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, MessageCircle } from 'lucide-react';
import PostCard from '@/components/feed/PostCard';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type SectorType = 'estudios' | 'franchising' | 'academy' | 'consultoras' | 'implantacao';

interface Comment {
  id: string;
  content: string;
  emoji: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface Post {
  id: string;
  title: string;
  content: string;
  sector: SectorType;
  image_url: string | null;
  pinned: boolean;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  comments: Comment[];
}

const NovidadesDoMes = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isApproved, isColaborador } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

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

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('post_type', 'novidades')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd + 'T23:59:59')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
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

      // Fetch all comments for these posts
      const postIds = postsData.map(p => p.id);
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
      const commentsMap = new Map<string, Comment[]>();
      (commentsData || []).forEach(comment => {
        const profile = profilesMap.get(comment.user_id) || null;
        const commentWithProfile: Comment = {
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
      const postsWithDetails: Post[] = postsData.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        sector: post.sector as SectorType,
        image_url: post.image_url,
        pinned: post.pinned || false,
        created_at: post.created_at,
        profiles: profilesMap.get(post.user_id) || null,
        comments: commentsMap.get(post.id) || [],
      }));

      setPosts(postsWithDetails);
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
      <div className="max-w-3xl mx-auto">
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

        {/* Posts list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
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
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onCommentAdded={fetchPosts}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default NovidadesDoMes;
