import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Users, UserCheck, Building2, Clock, CheckCircle, XCircle, Ban, Trash2, MoreHorizontal, Loader2, Key } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SetTemporaryPasswordDialog } from '@/components/admin/SetTemporaryPasswordDialog';

type UserType = 'colaborador' | 'franqueado';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  user_type: UserType | null;
  requested_user_type: UserType | null;
  is_approved: boolean;
  created_at: string;
  isAdmin: boolean;
}

// Component for pending user row with its own state
const PendingUserRow = ({
  user,
  onApprove,
  onReject,
}: {
  user: UserProfile;
  onApprove: (userId: string, type: UserType) => void;
  onReject: (userId: string) => void;
}) => {
  const [selectedType, setSelectedType] = useState<UserType>(
    user.requested_user_type || 'colaborador'
  );

  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.full_name || 'Sem nome'}
      </TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant="outline">
          {user.requested_user_type === 'franqueado' ? 'Franqueado' : 'Colaborador'}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(user.created_at).toLocaleDateString('pt-BR')}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center gap-2 justify-end">
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as UserType)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="colaborador">Colaborador</SelectItem>
              <SelectItem value="franqueado">Franqueado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            size="sm"
            className="gap-1 bg-green-600 hover:bg-green-700"
            onClick={() => onApprove(user.user_id, selectedType)}
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={() => onReject(user.user_id)}
          >
            <XCircle className="h-4 w-4" />
            Reprovar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminUsuarios = () => {
  const { isAdmin, loading: authLoading, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<UserProfile | null>(null);
  const [userToSetPassword, setUserToSetPassword] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    setLoading(true);

    // Fetch all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      setLoading(false);
      return;
    }

    // Fetch admin roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin');

    const adminUserIds = new Set((rolesData || []).map((r) => r.user_id));

    const usersWithRoles: UserProfile[] = (profilesData || []).map((profile) => ({
      id: profile.id,
      user_id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      user_type: profile.user_type as UserType | null,
      requested_user_type: profile.requested_user_type as UserType | null,
      is_approved: profile.is_approved ?? false,
      created_at: profile.created_at,
      isAdmin: adminUserIds.has(profile.user_id),
    }));

    setUsers(usersWithRoles);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const updateUserType = async (userId: string, newType: UserType) => {
    const { error } = await supabase
      .from('profiles')
      .update({ user_type: newType })
      .eq('user_id', userId);

    if (error) {
      toast.error('Erro ao atualizar tipo de usuário');
      console.error('Error updating user type:', error);
      return;
    }

    toast.success('Tipo de usuário atualizado');
    setUsers((prev) =>
      prev.map((u) => (u.user_id === userId ? { ...u, user_type: newType } : u))
    );
  };

  const approveUser = async (userId: string, approvedType: UserType) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        is_approved: true,
        user_type: approvedType
      })
      .eq('user_id', userId)
      .select();

    if (error) {
      toast.error('Erro ao aprovar usuário');
      console.error('Error approving user:', error);
      return;
    }

    // Verificar se realmente atualizou alguma linha
    if (!data || data.length === 0) {
      toast.error('Não foi possível aprovar o usuário. Verifique suas permissões.');
      console.error('No rows updated - RLS may be blocking the update');
      return;
    }

    toast.success('Usuário aprovado com sucesso!');
    // Recarregar dados do banco para garantir consistência
    await fetchUsers();
  };

  const rejectUser = async (userId: string) => {
    // For pending users, just set is_approved to false (they already aren't approved)
    // and we can simply remove their profile since they haven't been approved yet
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      toast.error('Erro ao rejeitar usuário');
      console.error('Error rejecting user:', error);
      return;
    }

    toast.success('Solicitação rejeitada');
    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  const deactivateUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: false })
      .eq('user_id', userId);

    if (error) {
      toast.error('Erro ao desativar usuário');
      console.error('Error deactivating user:', error);
      return;
    }

    toast.success('Usuário desativado com sucesso');
    await fetchUsers();
    setUserToDeactivate(null);
  };

  const deleteUserPermanently = async (userId: string) => {
    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao excluir usuário');
      }

      toast.success('Usuário excluído permanentemente');
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));
      setUserToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir usuário');
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingUsers = users.filter((u) => !u.is_approved);
  const approvedUsers = users.filter((u) => u.is_approved);

  const filteredApprovedUsers = approvedUsers.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'colaborador' && user.user_type === 'colaborador') ||
      (filterType === 'franqueado' && user.user_type === 'franqueado') ||
      (filterType === 'admin' && user.isAdmin);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: approvedUsers.length,
    colaboradores: approvedUsers.filter((u) => u.user_type === 'colaborador').length,
    franqueados: approvedUsers.filter((u) => u.user_type === 'franqueado').length,
    pendentes: pendingUsers.length,
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

  if (!isAdmin) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie os usuários da plataforma
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-pure">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Aprovados
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="card-pure">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Colaboradores
              </CardTitle>
              <UserCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.colaboradores}</div>
            </CardContent>
          </Card>

          <Card className="card-pure">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Franqueados
              </CardTitle>
              <Building2 className="h-4 w-4 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.franqueados}</div>
            </CardContent>
          </Card>

          <Card className={`card-pure ${stats.pendentes > 0 ? 'border-amber-500' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
              <Clock className={`h-4 w-4 ${stats.pendentes > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.pendentes > 0 ? 'text-amber-500' : ''}`}>
                {stats.pendentes}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Pending and Approved Users */}
        <Tabs defaultValue={pendingUsers.length > 0 ? 'pending' : 'approved'} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pedidos de Acesso
              {pendingUsers.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingUsers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Usuários Aprovados</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card className="card-pure">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo Solicitado</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : pendingUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma solicitação pendente
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingUsers.map((user) => (
                        <PendingUserRow
                          key={user.id}
                          user={user}
                          onApprove={approveUser}
                          onReject={rejectUser}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="colaborador">Colaboradores</SelectItem>
                  <SelectItem value="franqueado">Franqueados</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <Card className="card-pure">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Alterar Tipo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredApprovedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredApprovedUsers.map((user) => {
                        const isCurrentUser = currentUser?.id === user.user_id;
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || 'Sem nome'}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                              )}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge
                                variant={user.user_type === 'colaborador' ? 'default' : 'secondary'}
                              >
                                {user.user_type === 'colaborador' ? 'Colaborador' : 'Franqueado'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.isAdmin && (
                                <Badge variant="outline" className="border-primary text-primary">
                                  Admin
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.user_type || 'colaborador'}
                                onValueChange={(value) =>
                                  updateUserType(user.user_id, value as UserType)
                                }
                                disabled={isCurrentUser}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="colaborador">Colaborador</SelectItem>
                                  <SelectItem value="franqueado">Franqueado</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              {!isCurrentUser && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => setUserToSetPassword(user)}
                                    >
                                      <Key className="mr-2 h-4 w-4" />
                                      Definir senha temporária
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setUserToDeactivate(user)}
                                      className="text-amber-600"
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Desativar acesso
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setUserToDelete(user)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir permanentemente
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Deactivate User Dialog */}
        <AlertDialog open={!!userToDeactivate} onOpenChange={() => setUserToDeactivate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a desativar o acesso de{' '}
                <strong>{userToDeactivate?.full_name || userToDeactivate?.email}</strong>.
                <br /><br />
                O usuário não poderá mais acessar a plataforma, mas você pode reativá-lo a qualquer momento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => userToDeactivate && deactivateUser(userToDeactivate.user_id)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Ban className="mr-2 h-4 w-4" />
                Desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir usuário permanentemente</AlertDialogTitle>
              <AlertDialogDescription>
                <span className="text-destructive font-semibold">⚠️ Esta ação é irreversível!</span>
                <br /><br />
                Você está prestes a excluir permanentemente{' '}
                <strong>{userToDelete?.full_name || userToDelete?.email}</strong>.
                <br /><br />
                Todos os dados do usuário serão removidos do sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => userToDelete && deleteUserPermanently(userToDelete.user_id)}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir permanentemente
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Set Temporary Password Dialog */}
        <SetTemporaryPasswordDialog
          open={!!userToSetPassword}
          onOpenChange={() => setUserToSetPassword(null)}
          user={userToSetPassword}
        />
      </div>
    </MainLayout>
  );
};

export default AdminUsuarios;
