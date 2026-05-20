// Card que vai na tela /minha-area/midia-adicional/:slug (Editar Unidade, admin only).
// Lista usuários atribuídos à unidade e permite adicionar/remover.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Users, UserPlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Assignment = {
  id: string;
  user_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

export function UsuariosComAcessoCard({ unitId }: { unitId: string }) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['dpp_user_units', unitId],
    queryFn: async (): Promise<Assignment[]> => {
      const { data, error } = await supabase
        .from('dpp_user_units' as never)
        .select('id, user_id, profiles!inner (full_name, email)')
        .eq('unit_id', unitId);
      if (error) throw error;
      return (data ?? []) as unknown as Assignment[];
    },
  });

  const { data: candidates } = useQuery({
    queryKey: ['profiles_candidates', unitId, assignments?.length ?? 0],
    queryFn: async (): Promise<Profile[]> => {
      const assignedIds = (assignments ?? []).map((a) => a.user_id);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('is_approved', true)
        .order('full_name');
      if (error) throw error;
      return (data as Profile[]).filter((p) => !assignedIds.includes(p.user_id));
    },
    enabled: pickerOpen,
  });

  const addMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('dpp_user_units' as never)
        .insert({ user_id: userId, unit_id: unitId, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Usuário adicionado.');
      queryClient.invalidateQueries({ queryKey: ['dpp_user_units', unitId] });
      setPickerOpen(false);
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const removeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('dpp_user_units' as never)
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Acesso removido.');
      queryClient.invalidateQueries({ queryKey: ['dpp_user_units', unitId] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários com acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-2 flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando...
            </div>
          ) : (assignments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum usuário com acesso ainda. Adicione abaixo.
            </p>
          ) : (
            <div className="space-y-1">
              {assignments!.map((a) => (
                <div key={a.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="text-sm">
                    <div className="font-medium">{a.profiles?.full_name ?? '(sem nome)'}</div>
                    <div className="text-xs text-muted-foreground">{a.profiles?.email}</div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {a.profiles?.full_name ?? a.profiles?.email} vai parar de ver o relatório dessa unidade.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeMutation.mutate(a.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1" /> Adicionar usuário
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Adicionar usuário</DialogTitle>
          </DialogHeader>
          <Command>
            <CommandInput placeholder="Buscar por nome ou e-mail..." />
            <CommandList>
              <CommandEmpty>Nenhum usuário disponível.</CommandEmpty>
              <CommandGroup>
                {(candidates ?? []).map((p) => (
                  <CommandItem
                    key={p.user_id}
                    value={`${p.full_name ?? ''} ${p.email ?? ''}`}
                    onSelect={() => addMutation.mutate(p.user_id)}
                  >
                    <div>
                      <div className="text-sm font-medium">{p.full_name ?? '(sem nome)'}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {addMutation.isPending && (
            <div className="px-4 pb-3 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Adicionando...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
