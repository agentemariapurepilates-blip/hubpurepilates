import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, ArrowLeft, AlertTriangle, Check, Info, Image, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  formatarReais,
  lerReais,
  validarPedido,
} from '../../../../supabase/functions/send-verba-professores/pedido';

// CÓPIA DE midia-adicional/AutorizarMidiaAdicional.tsx, do começo ao fim, a
// pedido do usuário (16/09/2026): mesmo banner, mesmos campos, mesmo bloco de
// regras, mesma tela de sucesso. A ÚNICA diferença é o bloco "Plano de
// investimento", que aqui vira "Verba da campanha" (valor livre). Ao mudar uma
// das duas telas, mude a outra.

const SolicitarVerbaProfessores = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [nomeFranqueado, setNomeFranqueado] = useState('');
  const [nomeUnidade, setNomeUnidade] = useState('');
  const [dataInauguracao, setDataInauguracao] = useState('');
  const [valorDigitado, setValorDigitado] = useState('');
  const [emailUnidade, setEmailUnidade] = useState('');
  const [emailFranqueado, setEmailFranqueado] = useState('');
  const [aceitouRegras, setAceitouRegras] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (!authLoading && !user) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <h1 className="text-xl font-heading font-bold mb-2">Acesso restrito</h1>
          <p className="text-muted-foreground">Faça login para solicitar verba para novos professores.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        </div>
      </MainLayout>
    );
  }

  const limparFormulario = () => {
    setNomeFranqueado('');
    setNomeUnidade('');
    setDataInauguracao('');
    setValorDigitado('');
    setEmailUnidade('');
    setEmailFranqueado('');
    setAceitouRegras(false);
  };

  const valorVerba = lerReais(valorDigitado);

  const validacao = validarPedido({
    nome_franqueado: nomeFranqueado,
    nome_unidade: nomeUnidade,
    data_inauguracao: dataInauguracao,
    valor_verba: valorVerba,
    email_unidade: emailUnidade,
    email_franqueado: emailFranqueado,
  });

  const camposObrigatoriosPreenchidos = validacao.ok && aceitouRegras;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camposObrigatoriosPreenchidos || !validacao.ok || !user || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-verba-professores', {
        body: validacao.pedido,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Solicitação enviada com sucesso!');
      limparFormulario();
      setEnviado(true);
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err);
      toast.error(err instanceof Error && err.message ? err.message : 'Não foi possível enviar a solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (enviado) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Check className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-heading font-bold mb-2">Solicitação enviada</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Sua solicitação de verba para novos professores foi registrada. O time de marketing entrará em contato pelos
                e-mails informados.
              </p>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Para acompanhar suas solicitações, acesse <strong>Minha Área</strong> &gt; <strong>Minhas Solicitações</strong>.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/minha-area/minhas-solicitacoes')}>
                  Ver minhas solicitações
                </Button>
                <Button onClick={() => setEnviado(false)}>
                  Nova solicitação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
            <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Solicitar Verba para Novos Professores
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Preencha os dados abaixo para solicitar autorização de investimento em campanha de recrutamento
            de novos professores para sua unidade.
          </p>
        </div>

        <Card className="mb-6 overflow-hidden border-primary/30 bg-primary/5">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
                <Image className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Antes de preencher, veja os criativos usados nas campanhas
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
                  Anúncios reais, mapa de cobertura e o caminho até a aula marcada — no capítulo
                  "Criativos das Campanhas de Aporte" do Tutorial do Marketing.
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="w-full sm:w-auto shrink-0">
              <a
                href="/tutorial-marketing#criativos"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image className="h-4 w-4 mr-2" />
                Ver os criativos
                <ExternalLink className="h-3.5 w-3.5 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Se você já solicitou verba para novos professores, acesse{' '}
            <button
              type="button"
              onClick={() => navigate('/minha-area/minhas-solicitacoes')}
              className="font-semibold underline hover:no-underline"
            >
              Minha Área &gt; Minhas Solicitações
            </button>{' '}
            para ver o espelho dos seus pedidos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Dados da unidade</CardTitle>
              <CardDescription>Quem está solicitando e qual unidade será beneficiada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome-franqueado">Nome do franqueado *</Label>
                <Input id="nome-franqueado" value={nomeFranqueado}
                  onChange={(e) => setNomeFranqueado(e.target.value)}
                  placeholder="Nome completo" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome-unidade">Nome da unidade Pure Pilates *</Label>
                <Input id="nome-unidade" value={nomeUnidade}
                  onChange={(e) => setNomeUnidade(e.target.value)}
                  placeholder="Ex.: Pure Pilates Vila Olímpia" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-inauguracao">Data de inauguração *</Label>
                <Input id="data-inauguracao" type="date" value={dataInauguracao}
                  onChange={(e) => setDataInauguracao(e.target.value)} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Verba da campanha *</CardTitle>
              <CardDescription>Informe quanto a unidade quer investir na campanha.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valor-verba">Valor da verba (R$) *</Label>
                <Input id="valor-verba" inputMode="numeric" value={valorDigitado}
                  onChange={(e) => {
                    const reais = lerReais(e.target.value);
                    setValorDigitado(reais === null ? '' : reais.toLocaleString('pt-BR'));
                  }}
                  placeholder="Ex.: 2.000" required />
                <p className="text-xs text-muted-foreground">
                  {valorVerba ? formatarReais(valorVerba) : 'Valor em reais, sem centavos.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Contatos para retorno</CardTitle>
              <CardDescription>O time de marketing entrará em contato pelos e-mails abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-unidade">E-mail da unidade *</Label>
                <Input id="email-unidade" type="email" value={emailUnidade}
                  onChange={(e) => setEmailUnidade(e.target.value)}
                  placeholder="unidade@purepilates.com.br" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-franqueado">
                  E-mail do franqueado <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Input id="email-franqueado" type="email" value={emailFranqueado}
                  onChange={(e) => setEmailFranqueado(e.target.value)}
                  placeholder="franqueado@exemplo.com" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-300/40 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Regras de faturamento e aplicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-foreground/80 leading-relaxed space-y-2">
                <p>
                  O valor solicitado será faturado pela unidade conforme as regras vigentes. A solicitação é
                  analisada pela equipe de RH e direcionada ao marketing, que veicula a campanha de recrutamento
                  após a aprovação.
                </p>
                <p>
                  Os candidatos captados pela campanha são repassados para a unidade. Os prazos, formatos e canais
                  de veiculação seguem as diretrizes da Pure Pilates.
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={aceitouRegras}
                  onChange={(e) => setAceitouRegras(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-foreground/30 text-primary focus:ring-primary"
                  required />
                <span className="text-sm text-foreground/85 leading-relaxed">
                  Li e concordo com as regras de faturamento e aplicação descritas acima.
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Única diferença de comportamento em relação à Mídia Adicional: aqui
              há regras de valor e quantidade, e um botão desabilitado sem
              motivo deixou a pessoa sem saber o que corrigir. O aviso só
              aparece depois do aceite, quando ela já acha que terminou. */}
          {aceitouRegras && !validacao.ok && (
            <p role="alert" className="text-sm text-destructive text-right">
              {validacao.erro}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>Cancelar</Button>
            <Button type="submit"
              disabled={!camposObrigatoriosPreenchidos || submitting}
              className="min-w-[160px]">
              {submitting ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default SolicitarVerbaProfessores;
