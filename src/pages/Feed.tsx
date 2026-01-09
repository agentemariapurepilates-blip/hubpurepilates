import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import CreateFeedPostDialog from '@/components/feed/CreateFeedPostDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, ShieldAlert } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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

const sectors = [
  { value: 'estudios', label: 'Estúdios' },
  { value: 'franchising', label: 'Franchising' },
  { value: 'academy', label: 'Academy' },
  { value: 'consultoras', label: 'Consultoras' },
  { value: 'implantacao', label: 'Implantação' },
];

const POSTS_PER_PAGE = 4;

const Feed = () => {
  const { isColaborador, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<SectorType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    // First get total count
    let countQuery = supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('post_type', 'feed');

    if (selectedSectors.length > 0) {
      countQuery = countQuery.in('sector', selectedSectors);
    }

    if (searchQuery) {
      countQuery = countQuery.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { count } = await countQuery;
    setTotalPosts(count || 0);

    // Build paginated query for posts
    const from = (currentPage - 1) * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    let query = supabase
      .from('posts')
      .select('*')
      .eq('post_type', 'feed')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (selectedSectors.length > 0) {
      query = query.in('sector', selectedSectors);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { data: postsData, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      setLoading(false);
      return;
    }

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
    setLoading(false);
  }, [searchQuery, selectedSectors, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSectors]);

  // Realtime subscription for automatic updates
  useEffect(() => {
    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => fetchPosts()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post_likes' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const toggleSector = (sector: SectorType) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  // Restrict access to colaboradores only
  if (!authLoading && !isColaborador) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground text-center">
            O Feed é exclusivo para colaboradores.
          </p>
          <Button onClick={() => navigate('/')}>Voltar ao Dashboard</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold">Feed da Sede</h1>
            <p className="text-muted-foreground">Acompanhe as novidades da sede Pure Pilates</p>
          </div>
          <CreateFeedPostDialog onPostCreated={fetchPosts} />
        </div>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar publicações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtrar
                {selectedSectors.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {selectedSectors.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {sectors.map((sector) => (
                <DropdownMenuCheckboxItem
                  key={sector.value}
                  checked={selectedSectors.includes(sector.value as SectorType)}
                  onCheckedChange={() => toggleSector(sector.value as SectorType)}
                >
                  {sector.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-4">
          {loading ? (
            Array.from({ length: POSTS_PER_PAGE }).map((_, i) => (
              <div key={i} className="card-pure p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma publicação encontrada</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onCommentAdded={fetchPosts} />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(prev => Math.max(1, prev - 1));
                      }}
                    />
                  </PaginationItem>
                )}
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      }}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Feed;
