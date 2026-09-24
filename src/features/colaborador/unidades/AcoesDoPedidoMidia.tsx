import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { CircleCheck, CircleX, Loader2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validarEdicao } from '../../../../supabase/functions/midia-adicional-atualizar/pedido';
import { PLANOS, type MidiaRequest, type PlanKey, type StatusKey } from '@/features/geral/midia-adicional/tipos';

// Aprovar, recusar e editar um pedido de Campanha Aporte.
//
// APROVAR e RECUSAR são update direto, como a aprovação sempre foi. EDITAR
// passa pela Edge Function midia-adicional-atualizar, porque ao editar quem
// recebe os pedidos tem que receber um e-mail novo com os dados corrigidos, e
// o webhook do n8n não aceita chamada do navegador.
//
// Todo update pede `.select('id')` de volta: update barrado pela RLS não dá
// erro, só não muda nenhuma linha — sem isso a tela diria "aprovada" à toa.

interface Props {
  pedido: MidiaRequest;
  aoMudar: (pedido: MidiaRequest) => void;
}

export function AcoesDoPedidoMidia({ pedido, aoMudar }: Props) {
  const [emAndamento, setEmAndamento] = useState(false);
  const [dialogo, setDialogo] = useState<'editar' | 'recusar' | null>(null);
  const [motivo, setMotivo] = useState('');
  const [form, setForm] = useState({
    nome_franqueado: pedido.nome_franqueado,
    nome_unidade: pedido.nome_unidade,
    data_inauguracao: pedido.data_inauguracao,
    plano: pedido.plano as PlanKey,
    email_unidade: pedido.email_unidade,
    email_franqueado: pedido.email_franqueado ?? '',
  });

  const validacao = validarEdicao({ ...form, id: pedido.id });

  const abrirEdicao = () => {
    setForm({
      nome_franqueado: pedido.nome_franqueado,
      nome_unidade: pedido.nome_unidade,
      data_inauguracao: pedido.data_inauguracao,
      plano: pedido.plano,
      email_unidade: pedido.email_unidade,
      email_franqueado: pedido.email_franqueado ?? '',
    });
    setDialogo('editar');
  };

  const mudarStatus = async (status: StatusKey, motivoRecusa: string | null) => {
    setEmAndamento(true);
    try {
      const { data, error } = await supabase
        .from('midia_adicional_requests' as never)
        .update({ status, motivo_recusa: motivoRecusa } as never)
        .eq('id', pedido.id)
        .select('id');

      if (error) throw error;
      if (!data?.length) throw new Error('Você não tem permissão para alterar este pedido.');

      aoMudar({ ...pedido, status, motivo_recusa: motivoRecusa });
      toast.success(status === 'aprovada' ? 'Verba aprovada.' : 'Pedido recusado.');
      setDialogo(null);
      setMotivo('');
    } catch (err) {
      console.error('Erro ao mudar o status do pedido:', err);
      toast.error(err instanceof Error && err.message ? err.message : 'Não foi possível alterar o pedido.');
    } finally {
      setEmAndamento(false);
    }
  };

  const salvarEdicao = async () => {
    if (!validacao.ok) return;
    setEmAndamento(true);
    try {
      const { data, error } = await supabase.functions.invoke('midia-adicional-atualizar', {
        body: validacao.pedido,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      aoMudar({ ...pedido, ...validacao.pedido, email_franqueado: validacao.pedido.email_franqueado, plano: form.plano });
      toast.success(
        data?.aviso_enviado
          ? 'Pedido editado. Um e-mail com os dados novos foi enviado.'
          : 'Pedido editado, mas o e-mail de aviso não saiu. Avise o time.',
      );
      setDialogo(null);
    } catch (err) {
      console.error('Erro ao editar o pedido:', err);
      toast.error(err instanceof Error && err.message ? err.message : 'Não foi possível editar o pedido.');
    } finally {
      setEmAndamento(false);
    }
  };

  const girando = emAndamento ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null;

  return (
    <>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {pedido.status !== 'aprovada' && (
          <Button size="sm" disabled={emAndamento}
            onClick={() => mudarStatus('aprovada', null)}
            className="bg-green-600 hover:bg-green-700 text-white">
            {girando ?? <CircleCheck className="h-4 w-4 mr-2" />}
            Aprovar verba
          </Button>
        )}
        {pedido.status !== 'recusada' && (
          <Button size="sm" variant="outline" disabled={emAndamento}
            onClick={() => setDialogo('recusar')}
            className="border-destructive/40 text-destructive hover:bg-destructive/5">
            <CircleX className="h-4 w-4 mr-2" />
            Recusar
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={emAndamento} onClick={abrirEdicao}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <Dialog open={dialogo === 'recusar'} onOpenChange={(aberto) => !aberto && setDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar o pedido de {pedido.nome_unidade}?</DialogTitle>
            <DialogDescription>
              O franqueado vê a recusa, e o motivo, em Minha Área &gt; Minhas Solicitações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-recusa">
              Motivo <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea id="motivo-recusa" value={motivo} maxLength={500} rows={3}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: a unidade já tem campanha ativa neste período." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogo(null)} disabled={emAndamento}>Cancelar</Button>
            <Button variant="destructive" disabled={emAndamento}
              onClick={() => mudarStatus('recusada', motivo.trim() || null)}>
              {girando}Recusar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogo === 'editar'} onOpenChange={(aberto) => !aberto && setDialogo(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar pedido</DialogTitle>
            <DialogDescription>
              Ao salvar, quem recebe os pedidos leva um e-mail novo com os dados corrigidos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`franqueado-${pedido.id}`}>Nome do franqueado *</Label>
              <Input id={`franqueado-${pedido.id}`} value={form.nome_franqueado}
                onChange={(e) => setForm({ ...form, nome_franqueado: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`unidade-${pedido.id}`}>Nome da unidade *</Label>
              <Input id={`unidade-${pedido.id}`} value={form.nome_unidade}
                onChange={(e) => setForm({ ...form, nome_unidade: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`inauguracao-${pedido.id}`}>Data de inauguração *</Label>
              <Input id={`inauguracao-${pedido.id}`} type="date" value={form.data_inauguracao}
                onChange={(e) => setForm({ ...form, data_inauguracao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Plano *</Label>
              <RadioGroup value={form.plano} onValueChange={(v) => setForm({ ...form, plano: v as PlanKey })}>
                {PLANOS.map((opt) => (
                  <label key={opt.key} htmlFor={`plano-${pedido.id}-${opt.key}`}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                      form.plano === opt.key ? 'border-primary bg-primary/5' : 'border-foreground/10'
                    }`}>
                    <RadioGroupItem value={opt.key} id={`plano-${pedido.id}-${opt.key}`} className="mt-1" />
                    <span className="text-sm">
                      <strong className="font-heading">{opt.titulo}</strong>{' '}
                      <span className="text-primary font-semibold">{opt.valor}</span>
                      <span className="block text-muted-foreground">{opt.descricao}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`email-unidade-${pedido.id}`}>E-mail da unidade *</Label>
              <Input id={`email-unidade-${pedido.id}`} type="email" value={form.email_unidade}
                onChange={(e) => setForm({ ...form, email_unidade: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`email-franqueado-${pedido.id}`}>
                E-mail do franqueado <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input id={`email-franqueado-${pedido.id}`} type="email" value={form.email_franqueado}
                onChange={(e) => setForm({ ...form, email_franqueado: e.target.value })} />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row sm:items-center">
            {!validacao.ok && (
              <p role="alert" className="text-sm text-destructive sm:mr-auto">{validacao.erro}</p>
            )}
            <Button variant="outline" onClick={() => setDialogo(null)} disabled={emAndamento}>Cancelar</Button>
            <Button onClick={salvarEdicao} disabled={!validacao.ok || emAndamento}>
              {girando}Salvar e avisar por e-mail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
