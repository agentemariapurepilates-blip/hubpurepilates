import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tv, ArrowLeft, Check, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  CRIATIVOS,
  OBJETIVOS,
  PRODUTOS,
  formatarData,
  validarPedido,
  type CriativoTipo,
  type Objetivo,
  type Produto,
} from '../../../../supabase/functions/send-midia-local/pedido';

// Pedido de MÍDIA LOCAL na TV Globo. O pedido vai por e-mail para a Rise, que
// responde DIRETO ao franqueado: por isso o e-mail e o telefone dele são
// obrigatórios. Mesmas regras do servidor (pedido.ts é compartilhado), então o
// formulário nunca aceita o que a function recusaria.

const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const SolicitarMidiaLocal = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [nomeFranqueado, setNomeFranqueado] = useState('');
  const [emailFranqueado, setEmailFranqueado] = useState(user?.email ?? '');
  const [telefone, setTelefone] = useState('');
  const [nomeUnidade, setNomeUnidade] = useState('');
  const [enderecoUnidade, setEnderecoUnidade] = useState('');
  const [cep, setCep] = useState('');
  const [objetivo, setObjetivo] = useState<Objetivo | ''>('');
  const [dataInauguracao, setDataInauguracao] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [enderecoCobranca, setEnderecoCobranca] = useState('');
  const [criativoTipo, setCriativoTipo] = useState<CriativoTipo | ''>('');
  const [criativoInfo, setCriativoInfo] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [tentou, setTentou] = useState(false);

  if (!authLoading && !user) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <h1 className="text-xl font-heading font-bold mb-2">Acesso restrito</h1>
          <p className="text-muted-foreground">Faça login para pedir mídia local na TV Globo.</p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        </div>
      </MainLayout>
    );
  }

  const limparFormulario = () => {
    setNomeFranqueado(''); setTelefone(''); setNomeUnidade(''); setEnderecoUnidade(''); setCep('');
    setObjetivo(''); setDataInauguracao(''); setPeriodoInicio(''); setPeriodoFim('');
    setCnpj(''); setRazaoSocial(''); setEnderecoCobranca('');
    setCriativoTipo(''); setCriativoInfo(''); setProdutos([]); setTentou(false);
  };

  const alternarProduto = (p: Produto) =>
    setProdutos((atual) => (atual.includes(p) ? atual.filter((x) => x !== p) : [...atual, p]));

  const validacao = validarPedido({
    nome_franqueado: nomeFranqueado,
    email_franqueado: emailFranqueado,
    telefone,
    nome_unidade: nomeUnidade,
    endereco_unidade: enderecoUnidade,
    cep,
    objetivo,
    data_inauguracao: dataInauguracao,
    periodo_inicio: periodoInicio,
    periodo_fim: periodoFim,
    cnpj,
    razao_social: razaoSocial,
    endereco_cobranca: enderecoCobranca,
    criativo_tipo: criativoTipo,
    criativo_info: criativoInfo,
    produtos,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (!validacao.ok || !user || submitting) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-midia-local', { body: validacao.pedido });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Pedido enviado com sucesso!');
      limparFormulario();
      setEnviado(true);
    } catch (err) {
      console.error('Erro ao enviar pedido de mídia local:', err);
      toast.error(err instanceof Error && err.message ? err.message : 'Não foi possível enviar o pedido. Tente novamente.');
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
              <h2 className="text-2xl font-heading font-bold mb-2">Pedido enviado</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Seu pedido de mídia local foi registrado e encaminhado à Rise, agência parceira. Ela entra em contato
                direto com você, pelo e-mail e telefone informados.
              </p>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Para acompanhar, acesse <strong>Minha Área</strong> &gt; <strong>Minhas Solicitações</strong>.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/minha-area/minhas-solicitacoes')}>
                  Ver minhas solicitações
                </Button>
                <Button onClick={() => setEnviado(false)}>Novo pedido</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const campo = (
    id: string, rotulo: string, valor: string, set: (v: string) => void,
    extra: { placeholder?: string; type?: string; inputMode?: 'numeric' | 'tel' | 'email'; min?: string } = {},
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{rotulo} *</Label>
      <Input id={id} value={valor} onChange={(e) => set(e.target.value)} required {...extra} />
    </div>
  );

  const opcao = (
    nome: string, valor: string, marcado: boolean, aoMarcar: () => void, rotulo: string, tipo: 'radio' | 'checkbox' = 'radio',
  ) => (
    <label key={valor} className="flex items-start gap-3 cursor-pointer rounded-lg border border-foreground/10 p-3 hover:border-foreground/25 transition-colors">
      <input type={tipo} name={nome} checked={marcado} onChange={aoMarcar}
        className="mt-1 h-4 w-4 border-foreground/30 text-primary focus:ring-primary" />
      <span className="text-sm text-foreground/90 leading-relaxed">{rotulo}</span>
    </label>
  );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-6">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-heading font-bold flex items-center gap-2">
            <Tv className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Mídia local · TV Globo
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Peça um plano de mídia na TV Globo da sua praça. A Rise, agência parceira, recebe o pedido e responde direto
            para você. Ainda não conhece? Veja como funciona e quanto custa em{' '}
            <Link to="/marketing-local" className="font-semibold text-primary underline hover:no-underline">
              Marketing local · TV Globo
            </Link>
            .
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Os valores variam por praça: só TV Globo costuma custar de R$ 4 a 13 mil; TV mais digital, de R$ 10 a 17 mil;
            Near Live, cerca de R$ 8 mil por 2 inserções; com as telas da GAMA, passa de R$ 50 mil. A Rise confirma o
            valor exato da sua praça.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Quem está pedindo</CardTitle>
              <CardDescription>A Rise responde por estes contatos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campo('nome-franqueado', 'Nome do franqueado', nomeFranqueado, setNomeFranqueado, { placeholder: 'Nome completo' })}
              {campo('email-franqueado', 'E-mail do franqueado', emailFranqueado, setEmailFranqueado, { type: 'email', placeholder: 'franqueado@exemplo.com' })}
              {campo('telefone', 'Telefone com DDD', telefone, setTelefone, { type: 'tel', inputMode: 'tel', placeholder: '(11) 99999-1234' })}
              <p className="text-xs text-muted-foreground">Data do pedido: {formatarData(hoje())} (registrada automaticamente).</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Unidade</CardTitle>
              <CardDescription>Onde a mídia vai passar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campo('nome-unidade', 'Nome da unidade Pure Pilates', nomeUnidade, setNomeUnidade, { placeholder: 'Ex.: Pure Pilates Moema' })}
              {campo('endereco-unidade', 'Endereço da unidade', enderecoUnidade, setEnderecoUnidade, { placeholder: 'Rua, número, bairro, cidade/UF' })}
              {campo('cep', 'CEP', cep, setCep, { inputMode: 'numeric', placeholder: '00000-000' })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Objetivo e período</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium mb-2">Objetivo *</legend>
                {(Object.keys(OBJETIVOS) as Objetivo[]).map((o) =>
                  opcao('objetivo', o, objetivo === o, () => setObjetivo(o), OBJETIVOS[o]))}
              </fieldset>
              {objetivo === 'inauguracao' && (
                <div className="space-y-2">
                  <Label htmlFor="data-inauguracao">Data prevista da inauguração *</Label>
                  <Input id="data-inauguracao" type="date" value={dataInauguracao}
                    onChange={(e) => setDataInauguracao(e.target.value)} required />
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="periodo-inicio">Veiculação desejada: início *</Label>
                  <Input id="periodo-inicio" type="date" value={periodoInicio} min={hoje()}
                    onChange={(e) => setPeriodoInicio(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodo-fim">Veiculação desejada: fim *</Label>
                  <Input id="periodo-fim" type="date" value={periodoFim} min={periodoInicio || hoje()}
                    onChange={(e) => setPeriodoFim(e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">O que contratar *</CardTitle>
              <CardDescription>Pode marcar mais de uma opção.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(PRODUTOS) as Produto[]).map((p) =>
                opcao('produtos', p, produtos.includes(p), () => alternarProduto(p), PRODUTOS[p], 'checkbox'))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Criativo</CardTitle>
              <CardDescription>O comercial que vai ao ar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium mb-2">Tipo de criativo *</legend>
                {(Object.keys(CRIATIVOS) as CriativoTipo[]).map((c) =>
                  opcao('criativo', c, criativoTipo === c, () => setCriativoTipo(c), CRIATIVOS[c]))}
              </fieldset>
              <div className="space-y-2">
                <Label htmlFor="criativo-info">Informações do criativo que precisam ser adequadas *</Label>
                <Textarea id="criativo-info" value={criativoInfo} rows={4} maxLength={1000}
                  onChange={(e) => setCriativoInfo(e.target.value)}
                  placeholder="Ex.: endereço da unidade, telefone, oferta, texto da cartela, qual comercial adaptar" required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Faturamento</CardTitle>
              <CardDescription>Dados de quem vai pagar a mídia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campo('cnpj', 'CNPJ', cnpj, setCnpj, { placeholder: '00.000.000/0000-00' })}
              {campo('razao-social', 'Razão social', razaoSocial, setRazaoSocial)}
              {campo('endereco-cobranca', 'Endereço de cobrança', enderecoCobranca, setEnderecoCobranca, { placeholder: 'Rua, número, bairro, cidade/UF, CEP' })}
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm"
                  disabled={!enderecoUnidade}
                  onClick={() => setEnderecoCobranca(cep ? `${enderecoUnidade}, CEP ${cep}` : enderecoUnidade)}>
                  Usar o endereço da unidade
                </Button>
              </div>
            </CardContent>
          </Card>

          {tentou && !validacao.ok && (
            <p role="alert" className="text-sm text-destructive text-right">{validacao.erro}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="min-w-[160px]">
              {submitting ? 'Enviando...' : 'Enviar pedido'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default SolicitarMidiaLocal;
