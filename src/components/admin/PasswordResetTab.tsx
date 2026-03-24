import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { KeyRound, Key, CheckCircle } from 'lucide-react';

interface PasswordResetRequest {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
  user_id: string | null;
}

interface ApprovedUser {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface PasswordResetTabProps {
  requests: PasswordResetRequest[];
  loading: boolean;
  approvedUsers: ApprovedUser[];
  onSetPassword: (user: { user_id: string; email: string; full_name: string | null }) => void;
  onMarkResolved: (requestId: string) => void;
}

export function PasswordResetTab({ requests, loading, approvedUsers, onSetPassword, onMarkResolved }: PasswordResetTabProps) {
  return (
    <Card className="card-pure">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Solicitações de Senha Temporária
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Data da Solicitação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação de senha pendente
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => {
                const matchedUser = approvedUsers.find(u => u.email.toLowerCase() === request.email.toLowerCase());
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.full_name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {matchedUser ? (
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => onSetPassword({
                              user_id: matchedUser.user_id,
                              email: matchedUser.email,
                              full_name: matchedUser.full_name
                            })}
                          >
                            <Key className="h-4 w-4" />
                            Definir Senha
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Usuário não encontrado
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onMarkResolved(request.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolvido
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
