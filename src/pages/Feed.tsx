import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import PostCard from '@/components/feed/PostCard';
import CreatePostDialog from '@/components/feed/CreatePostDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SectorType = 'estudios' | 'franchising' | 'academy' | 'marketing' | 'tecnologia' | 'expansao';

interface Comment {
  id: string;
  content: string;
  emoji: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
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
  } | null;
  comments: Comment[];
}

const sectors = [
  { value: 'estudios', label: 'Estúdios' },
  { value: 'franchising', label: 'Franchising' },
  { value: 'academy', label: 'Academy' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'expansao', label: 'Expansão' },
];

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<SectorType[]>([]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (full_name, email),
        comments (
          id,
          content,
          emoji,
          created_at,
          profiles:user_id (full_name, email)
        )
      `)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (selectedSectors.length > 0) {
      query = query.in('sector', selectedSectors);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data as unknown as Post[]);
    }
    setLoading(false);
  }, [searchQuery, selectedSectors]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const toggleSector = (sector: SectorType) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold">Feed</h1>
            <p className="text-muted-foreground">Acompanhe as novidades da Pure Pilates</p>
          </div>
          <CreatePostDialog onPostCreated={fetchPosts} />
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
            Array.from({ length: 3 }).map((_, i) => (
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
      </div>
    </MainLayout>
  );
};

export default Feed;
