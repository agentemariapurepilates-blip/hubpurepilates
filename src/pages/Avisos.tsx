import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AvisoCard from '@/components/avisos/AvisoCard';
import CreateAvisoDialog from '@/components/avisos/CreateAvisoDialog';
import EditAvisoDialog from '@/components/avisos/EditAvisoDialog';
import AvisoDetailsDialog from '@/components/avisos/AvisoDetailsDialog';

export interface Aviso {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  partner_name: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const Avisos = () => {
  const { user, isColaborador, isAdmin } = useAuth();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAviso, setSelectedAviso] = useState<Aviso | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 3;

  const fetchAvisos = async () => {
    try {
      const { data: avisosData, error } = await supabase
        .from('avisos')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch creator profiles
      const creatorIds = [...new Set(avisosData?.map(a => a.created_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', creatorIds);

      const avisosWithProfiles = avisosData?.map(aviso => ({
        ...aviso,
        creator_profile: profiles?.find(p => p.user_id === aviso.created_by)
      })) as Aviso[];

      setAvisos(avisosWithProfiles || []);
    } catch (error) {
      console.error('Error fetching avisos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar avisos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvisos();
  }, []);

  const handleAvisoClick = (aviso: Aviso) => {
    setSelectedAviso(aviso);
    setDetailsOpen(true);
  };

  const handleEditClick = (aviso: Aviso) => {
    setSelectedAviso(aviso);
    setEditOpen(true);
  };

  const handleDelete = async (avisoId: string) => {
    try {
      const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', avisoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Aviso excluído com sucesso"
      });
      fetchAvisos();
    } catch (error) {
      console.error('Error deleting aviso:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir aviso",
        variant: "destructive"
      });
    }
  };

  const filteredAvisos = avisos.filter(aviso => {
    const searchLower = searchTerm.toLowerCase();
    return (
      aviso.title.toLowerCase().includes(searchLower) ||
      aviso.partner_name?.toLowerCase().includes(searchLower) ||
      aviso.content?.toLowerCase().includes(searchLower)
    );
  });

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredAvisos.length / ITEMS_PER_PAGE);
  const paginatedAvisos = filteredAvisos.slice(
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
              <Megaphone className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">Parcerias e Avisos</h1>
            </div>
            {canCreate && (
              <Button 
                onClick={() => setIsCreateOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Aviso</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar avisos..."
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
        ) : filteredAvisos.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum aviso encontrado</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Tente uma busca diferente' : 'Novos avisos aparecerão aqui'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedAvisos.map((aviso) => {
                const canEditThis = isColaborador && (user?.id === aviso.created_by || isAdmin);
                return (
                  <AvisoCard
                    key={aviso.id}
                    aviso={aviso}
                    onClick={() => handleAvisoClick(aviso)}
                    onEdit={() => handleEditClick(aviso)}
                    onDelete={() => handleDelete(aviso.id)}
                    canEdit={canEditThis}
                  />
                );
              })}
            </div>

            {/* Pagination */}
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

        {/* Dialogs */}
        <CreateAvisoDialog 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
          onSuccess={() => {
            fetchAvisos();
            setIsCreateOpen(false);
          }}
        />

        <AvisoDetailsDialog
          aviso={selectedAviso}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />

        <EditAvisoDialog
          aviso={selectedAviso}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={() => {
            fetchAvisos();
            setEditOpen(false);
          }}
        />
      </div>
    </MainLayout>
  );
};

export default Avisos;
