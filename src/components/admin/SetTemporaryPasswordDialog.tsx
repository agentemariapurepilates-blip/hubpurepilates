import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Key, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SetTemporaryPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    user_id: string;
    email: string;
    full_name: string | null;
  } | null;
  onSuccess?: () => void;
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function SetTemporaryPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: SetTemporaryPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleGeneratePassword = () => {
    setPassword(generateTemporaryPassword());
    setCopied(false);
  };

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Senha copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!user || !password) return;

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-temporary-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            userId: user.user_id,
            newPassword: password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao definir senha');
      }

      setSuccess(true);
      toast.success('Senha temporária definida com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao definir senha temporária');
      console.error('Error setting temporary password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setSuccess(false);
    setCopied(false);
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Definir Senha Temporária
          </DialogTitle>
          <DialogDescription>
            Defina uma senha temporária para{' '}
            <strong>{user.full_name || user.email}</strong>. O usuário deverá
            alterar essa senha após o primeiro acesso.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                ✅ Senha definida com sucesso!
              </p>
              <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                Informe a senha abaixo ao usuário. Ele poderá alterá-la no perfil
                após fazer login.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Senha temporária</Label>
              <div className="flex gap-2">
                <Input
                  value={password}
                  readOnly
                  className="font-mono text-lg tracking-wider"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="temp-password">Nova senha</Label>
              <div className="flex gap-2">
                <Input
                  id="temp-password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite ou gere uma senha"
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={handleGeneratePassword}
                  type="button"
                >
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {success ? (
            <Button onClick={handleClose}>Fechar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !password}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Definir Senha'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
