import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Key, Ban, Trash2 } from 'lucide-react';

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

interface ApprovedUsersTabProps {
  users: UserProfile[];
  loading: boolean;
  currentUserId?: string;
  onUpdateType: (userId: string, newType: UserType) => void;
  onSetPassword: (user: { user_id: string; email: string; full_name: string | null }) => void;
  onDeactivate: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

export function ApprovedUsersTab({
  users,
  loading,
  currentUserId,
  onUpdateType,
  onSetPassword,
  onDeactivate,
  onDelete,
}: ApprovedUsersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = users.filter((user) => {
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

  return (
    <div className="space-y-4">
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
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user) => {
                  const isCurrentUser = currentUserId === user.user_id;
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
                        <Badge variant={user.user_type === 'colaborador' ? 'default' : 'secondary'}>
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
                          onValueChange={(value) => onUpdateType(user.user_id, value as UserType)}
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
                              <DropdownMenuItem onClick={() => onSetPassword(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Definir senha temporária
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDeactivate(user)} className="text-amber-600">
                                <Ban className="mr-2 h-4 w-4" />
                                Desativar acesso
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive">
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
    </div>
  );
}
