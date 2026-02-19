import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Handshake } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ParceriaCard from '@/components/parcerias/ParceriaCard';
import CreateParceriaDialog from '@/components/parcerias/CreateParceriaDialog';
import ParceriaDetailsDialog from '@/components/parcerias/ParceriaDetailsDialog';

export interface Parceria {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  partner_url: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const ITEMS_PER_PAGE = 3;

const Parcerias = () => {
  const { user, isColaborador, isAdmin } = useAuth();
  const [parcerias, setParcerias] = useState<Parceria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedParceria, setSelectedParceria] = useState<Parceria | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchParcerias = async () => {
    try {
      const { data, error } = await supabase
        .from('parcerias')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const creatorIds = [...new Set(data?.map(p => p.created_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', creatorIds);

      const parceriasWithProfiles = data?.map(parceria => ({
        ...parceria,
        creator_profile: profiles?.find(p => p.user_id === parceria.created_by)
      })) as Parceria[];

      setParcerias(parceriasWithProfiles || []);
    } catch (error) {
      console.error('Error fetching parcerias:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar parcerias",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcerias();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = async (parceriaId: string) => {
    try {
      const { error } = await supabase
        .from('parcerias')
        .delete()
        .eq('id', parceriaId);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Parceria excluída com sucesso" });
      fetchParcerias();
    } catch (error) {
      console.error('Error deleting parceria:', error);
      toast({ title: "Erro", description: "Erro ao excluir parceria", variant: "destructive" });
    }
  };

  const filteredParcerias = parcerias.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(searchLower) ||
      p.content?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredParcerias.length / ITEMS_PER_PAGE);
  const paginatedParcerias = filteredParcerias.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const canCreate = isColaborador || isAdmin;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Handshake className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">Parcerias</h1>
            </div>
            {canCreate && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Parceria</span>
                <span className="sm:hidden">Nova</span>
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar parcerias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredParcerias.length === 0 ? (
          <div className="text-center py-12">
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma parceria encontrada</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Tente uma busca diferente' : 'Novas parcerias aparecerão aqui'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedParcerias.map((parceria) => {
                const canDelete = isAdmin || (isColaborador && user?.id === parceria.created_by);
                return (
                  <ParceriaCard
                    key={parceria.id}
                    parceria={parceria}
                    onClick={() => { setSelectedParceria(parceria); setDetailsOpen(true); }}
                    onDelete={() => handleDelete(parceria.id)}
                    canDelete={canDelete}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="min-w-[36px]"
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}

        <CreateParceriaDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSuccess={() => {
            fetchParcerias();
            setIsCreateOpen(false);
          }}
        />

        <ParceriaDetailsDialog
          parceria={selectedParceria}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </div>
    </MainLayout>
  );
};

export default Parcerias;
