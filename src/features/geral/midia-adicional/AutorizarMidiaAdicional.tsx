import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Megaphone, ArrowLeft, AlertTriangle, Check, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type PlanKey = '1500_3m' | '2000_3m' | '2500';

interface PlanOption {
  key: PlanKey;
  valor: string;
  titulo: string;
  descricao: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    key: '1500_3m',
    valor: 'R$ 1.500,00',
    titulo: 'Plano A',
    descricao: '3 meses de campanha de aula experimental.',
  },
  {
    key: '2000_3m',
    valor: 'R$ 2.000,00',
    titulo: 'Plano B',
    descricao: '3 meses de campanha de aula experimental.',
  },
  {
    key: '2500',
    valor: 'R$ 2.500,00',
    titulo: 'Plano C',
    descricao: 'Campanha de aula experimental.',
  },
];

const SolicitarMidiaAdicional = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [nomeFranqueado, setNomeFranqueado] = useState('');
  const [nomeUnidade, setNomeUnidade] = useState('');
  const [dataInauguracao, setDataInauguracao] = useState('');
  const [plano, setPlano] = useState<PlanKey | ''>('');
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
          <p className="text-muted-foreground">Faça login para solicitar mídia adicional.</p>
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
    setPlano('');
    setEmailUnidade('');
    setEmailFranqueado('');
    setAceitouRegras(false);
  };

  const camposObrigatoriosPreenchidos =
    nomeFranqueado.trim() &&
    nomeUnidade.trim() &&
    dataInauguracao &&
    plano &&
    emailUnidade.trim() &&
    aceitouRegras;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!camposObrigatoriosPreenchidos || !user || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-midia-adicional', {
        body: {
          nome_franqueado: nomeFranqueado.trim(),
          nome_unidade: nomeUnidade.trim(),
          data_inauguracao: dataInauguracao,
          plano,
          email_unidade: emailUnidade.trim(),
          email_franqueado: emailFranqueado.trim() || null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Solicitação enviada com sucesso!');
      limparFormulario();
      setEnviado(true);
    } catch (err: any) {
      console.error('Erro ao enviar solicitação:', err);
      toast.error(err?.message || 'Não foi possível enviar a solicitação. Tente novamente.');
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
                Sua solicitação de mídia adicional foi registrada. O time de marketing entrará em contato pelos
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
            <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Solicitar Mídia Adicional
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Preencha os dados abaixo para solicitar autorização de investimento adicional em campanha de aula
            experimental para sua unidade.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Se você já solicitou mídia adicional, acesse{' '}
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
              <CardTitle className="text-base font-heading">Plano de investimento *</CardTitle>
              <CardDescription>Selecione uma das opções abaixo.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={plano} onValueChange={(v) => setPlano(v as PlanKey)}>
                <div className="space-y-3">
                  {PLAN_OPTIONS.map((opt) => (
                    <label key={opt.key} htmlFor={`plano-${opt.key}`}
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all hover:border-primary/50 ${
                        plano === opt.key ? 'border-primary bg-primary/5' : 'border-foreground/10'
                      }`}>
                      <RadioGroupItem value={opt.key} id={`plano-${opt.key}`} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-heading font-bold text-base">{opt.titulo}</span>
                          <span className="text-primary font-semibold">{opt.valor}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{opt.descricao}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
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
                  <strong>[Texto placeholder]</strong> Substitua este bloco pelo texto definitivo das regras de
                  faturamento e aplicação da campanha de mídia adicional.
                </p>
                <p>
                  O valor solicitado será faturado pela unidade conforme as regras vigentes. A campanha será
                  veiculada pelo time central de marketing, após análise e aprovação da solicitação.
                  Os prazos, formatos e canais de veiculação seguem as diretrizes da Pure Pilates para o período
                  selecionado.
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

export default SolicitarMidiaAdicional;
