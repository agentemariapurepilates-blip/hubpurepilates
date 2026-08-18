import { useState, Fragment } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  HelpCircle,
  Package,
  Shirt,
  Table as TableIcon,
  LayoutGrid,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Ruler,
  Truck,
  RefreshCcw,
  Globe,
  Lock,
  Search,
  BookOpen,
  Copy,
  Check,
  Link2,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { precosStore, PRECOS_REFERENCIA, type PrecoStore } from '@/data/pureStorePrecos';
import { catalogoProdutos } from '@/data/pureStoreCatalogo';

// ————————————————————————————————————————————————————————————————
// Contatos e links da Pure Store.
// TODO (detalhes depois): preencher Catálogo Digital, Site e e-mail oficiais.
// ————————————————————————————————————————————————————————————————
const WHATSAPP = '5511995557538';
const WHATSAPP_DISPLAY = '(11) 99555-7538';
const waLink = (msg?: string) =>
  `https://wa.me/${WHATSAPP}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
const SITE_URL = 'https://loja.purepilates.com.br/';
const STORE_EMAIL = ''; // TODO

type TabId = 'central' | 'catalogo' | 'faq' | 'purebox' | 'uniformes' | 'precos';

const TABS: { id: TabId; label: string; icon: typeof ShoppingBag }[] = [
  { id: 'central', label: 'Central', icon: LayoutGrid },
  { id: 'catalogo', label: 'Catálogo digital', icon: BookOpen },
  { id: 'faq', label: 'Perguntas frequentes', icon: HelpCircle },
  { id: 'purebox', label: 'Pure Box', icon: Package },
  { id: 'uniformes', label: 'Uniformes', icon: Shirt },
  { id: 'precos', label: 'Tabela de preços', icon: TableIcon },
];

// ————————————————————————————————————————————————————————————————
// Conteúdo — bloco de resposta pode ser parágrafo, lista ou destaque.
// ————————————————————————————————————————————————————————————————
type Block = { p: string } | { ul: string[] } | { note: string };

const Blocks = ({ blocks }: { blocks: Block[] }) => (
  <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
    {blocks.map((b, i) => {
      if ('ul' in b) {
        return (
          <ul key={i} className="list-disc space-y-1 pl-5">
            {b.ul.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        );
      }
      if ('note' in b) {
        return (
          <p
            key={i}
            className="rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-foreground"
          >
            <strong>Importante:</strong> {b.note}
          </p>
        );
      }
      return <p key={i}>{b.p}</p>;
    })}
  </div>
);

const FAQ_CATEGORIES: {
  id: string;
  title: string;
  icon: typeof ShoppingBag;
  items: { q: string; a: Block[] }[];
}[] = [
  {
    id: 'compras',
    title: 'Compras e descontos',
    icon: ShoppingBag,
    items: [
      {
        q: 'Sou franqueado. Onde encontro meu cupom de desconto exclusivo?',
        a: [
          { p: 'Os descontos da Pure Store são definidos de acordo com o calendário comercial e as campanhas vigentes.' },
          { p: 'Antes de finalizar sua compra, entre em contato com a equipe da Pure Store pelo WhatsApp para solicitar o cupom de desconto exclusivo para franqueados referente à campanha vigente.' },
          { p: 'Assim, garantimos que você sempre utilize a melhor condição disponível.' },
        ],
      },
      {
        q: 'Como compartilho os produtos com meus alunos?',
        a: [
          { p: 'Você pode utilizar o Catálogo Digital, disponível na Central Pure Store.' },
          { p: 'Além das fotos e descrições dos produtos, o catálogo conta com links diretos para cada item no site, facilitando o compartilhamento com seus alunos, principalmente quando o produto não estiver disponível para pronta entrega em sua unidade.' },
        ],
      },
      {
        q: 'Como solicito um orçamento?',
        a: [
          { p: 'Entre em contato com a equipe da Pure Store pelo WhatsApp ou e-mail, informando os produtos desejados e as respectivas quantidades.' },
          { p: 'Nossa equipe retornará com o orçamento o mais breve possível.' },
        ],
      },
    ],
  },
  {
    id: 'medidas',
    title: 'Produtos e medidas',
    icon: Ruler,
    items: [
      {
        q: 'Onde encontro a tabela de medidas?',
        a: [
          { p: 'A tabela de medidas está disponível na página de cada produto da Pure Store.' },
          { p: 'Caso tenha alguma dúvida ou não encontre a informação desejada, entre em contato com o WhatsApp oficial da loja e solicite as medidas do produto.' },
        ],
      },
    ],
  },
  {
    id: 'entrega',
    title: 'Pedidos e entrega',
    icon: Truck,
    items: [
      {
        q: 'Como funciona o frete?',
        a: [
          { p: 'O valor do frete é calculado automaticamente durante a compra, considerando o CEP de entrega, o peso dos produtos e a modalidade de envio selecionada no momento da compra.' },
          { p: 'Caso prefira, você também pode solicitar uma simulação de frete entrando em contato com nossa equipe pelo WhatsApp.' },
        ],
      },
      {
        q: 'Qual é o prazo de entrega?',
        a: [
          { p: 'O prazo de entrega varia de acordo com o CEP informado e a modalidade de frete escolhida no momento da compra.' },
          { p: 'Após a postagem do pedido, você poderá acompanhar a entrega por meio do código de rastreamento enviado por e-mail.' },
          { p: 'Caso não tenha recebido o código ou precise de uma atualização sobre o envio, entre em contato com nossa equipe pelo WhatsApp, informando o número do seu pedido.' },
        ],
      },
      {
        q: 'Onde encontro minha NF?',
        a: [
          { p: 'Sua nota fiscal é enviada automaticamente para o mesmo e-mail informado no cadastro realizado no momento da compra pelo site.' },
          { p: 'Caso não receba a nota fiscal, entre em contato com nossa equipe pelo WhatsApp para solicitar ajuda ou verificar as informações do pedido.' },
        ],
      },
    ],
  },
  {
    id: 'trocas',
    title: 'Trocas e devoluções',
    icon: RefreshCcw,
    items: [
      {
        q: 'Como solicitar uma troca?',
        a: [
          { p: 'Entre em contato com a equipe da Pure Store pelo WhatsApp ou e-mail, informando o número do pedido e o motivo da solicitação.' },
          { p: 'Para que a troca seja aprovada, o produto deverá:' },
          {
            ul: [
              'Estar nas mesmas condições em que foi recebido;',
              'Conter a embalagem original e todas as etiquetas afixadas;',
              'Não apresentar indícios de uso, lavagem, odores ou avarias causadas pelo consumidor;',
              'Atender aos critérios estabelecidos em nossa Política de Trocas e Devoluções.',
            ],
          },
          { note: 'produtos com danos serão aceitos para troca ou devolução somente quando o problema for caracterizado como defeito de fabricação, mediante análise da equipe da Pure Store.' },
          { p: 'Após o recebimento do produto em nosso centro de distribuição (sede), será realizada uma avaliação de qualidade.' },
          { p: 'Assim que a análise for concluída, entraremos em contato para informar o resultado da solicitação e a melhor solução para o caso.' },
        ],
      },
    ],
  },
];

const PURE_BOX_BENEFITS = [
  'Mantém o padrão visual e comercial da rede Pure Pilates;',
  'Apresenta aos alunos o portfólio oficial da Pure Store desde o primeiro contato;',
  'Estimula compras por impulso e amplia as oportunidades de venda;',
  'Fortalece a presença da marca na região;',
  'Transforma os próprios alunos em promotores da Pure Pilates por meio do uso dos produtos no dia a dia;',
  'Agrega valor à experiência dos alunos, oferecendo um ambiente mais completo e profissional;',
  'Gera uma fonte de receita complementar, que pode contribuir para despesas operacionais da unidade.',
];

// Faixas de desconto da tabela de preços.
const DISCOUNTS = [
  { id: 'todos', label: 'Todos' },
  { id: 'off20', label: '20% OFF' },
  { id: 'off25', label: '25% OFF' },
  { id: 'off30', label: '30% OFF' },
] as const;
type DiscId = (typeof DISCOUNTS)[number]['id'];

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const normalize = (s: string) =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

// Tabelas de medidas dos uniformes — reconstruídas nativamente no Hub (sem Drive).
// Para adicionar um produto: inclua um objeto abaixo. Medida da peça (largura L,
// altura A), não do corpo.
interface MedidaGrupo {
  titulo?: string;
  linhas: { tam: string; largura: string; altura: string }[];
}
interface MedidaTabela {
  produto: string;
  obs?: string;
  diagram?: 'camiseta' | 'bata';
  grupos: MedidaGrupo[];
}

const TABELAS_MEDIDAS: MedidaTabela[] = [
  {
    produto: 'Camiseta Básica',
    obs: 'As medidas têm variação de + ou – 3%.',
    diagram: 'camiseta',
    grupos: [
      {
        linhas: [
          { tam: 'PP', largura: '49 cm', altura: '67 cm' },
          { tam: 'P', largura: '50 cm', altura: '69 cm' },
          { tam: 'M', largura: '52 cm', altura: '71 cm' },
          { tam: 'G', largura: '54 cm', altura: '73 cm' },
          { tam: 'GG', largura: '56 cm', altura: '75 cm' },
          { tam: 'EXGG', largura: '58 cm', altura: '77 cm' },
        ],
      },
      {
        titulo: 'Tamanhos especiais',
        linhas: [
          { tam: 'G2', largura: '61 cm', altura: '80 cm' },
          { tam: 'G3', largura: '64 cm', altura: '84 cm' },
          { tam: 'G4', largura: '72 cm', altura: '86 cm' },
          { tam: 'G5', largura: '77 cm', altura: '90 cm' },
        ],
      },
    ],
  },
  {
    produto: 'Bata Básica',
    diagram: 'bata',
    grupos: [
      {
        linhas: [
          { tam: 'P', largura: '43 cm', altura: '60 cm' },
          { tam: 'M', largura: '45 cm', altura: '62 cm' },
          { tam: 'G', largura: '47 cm', altura: '64 cm' },
          { tam: 'GG', largura: '59 cm', altura: '66 cm' },
          { tam: 'XGG', largura: '61 cm', altura: '68 cm' },
        ],
      },
    ],
  },
];

const PureStore = () => {
  const [tab, setTab] = useState<TabId>('central');

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pure Store</h1>
            <p className="text-sm text-muted-foreground">
              Central de apoio ao franqueado: compras, descontos, produtos, uniformes, pedidos e orientações da loja.
            </p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors',
                  active
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'central' && <CentralTab onNavigate={setTab} />}
        {tab === 'catalogo' && <CatalogoTab />}
        {tab === 'faq' && <FaqTab />}
        {tab === 'purebox' && <PureBoxTab />}
        {tab === 'uniformes' && <UniformesTab />}
        {tab === 'precos' && <PrecosTab />}
      </div>
    </MainLayout>
  );
};

// ————————————————————————————————————————————————————————————————
// Central — acesso rápido a tudo da Pure Store.
// ————————————————————————————————————————————————————————————————
const CentralTab = ({ onNavigate }: { onNavigate: (t: TabId) => void }) => {
  const cards: {
    title: string;
    desc: string;
    icon: typeof ShoppingBag;
    onClick?: () => void;
    href?: string;
    soon?: boolean;
  }[] = [
    {
      title: 'Catálogo Digital',
      desc: 'Monte o catálogo da sua unidade com todos os produtos e o seu WhatsApp para pedidos.',
      icon: BookOpen,
      onClick: () => onNavigate('catalogo'),
    },
    {
      title: 'Uniformes Oficiais',
      desc: 'Como comprar e tabelas de medidas dos uniformes da rede.',
      icon: Shirt,
      onClick: () => onNavigate('uniformes'),
    },
    {
      title: 'Tabela de Preços',
      desc: 'Preços de referência com desconto de franqueado (20%, 25% e 30%).',
      icon: TableIcon,
      onClick: () => onNavigate('precos'),
    },
    {
      title: 'Perguntas Frequentes',
      desc: 'Compras, descontos, medidas, frete, entrega, trocas e devoluções.',
      icon: HelpCircle,
      onClick: () => onNavigate('faq'),
    },
    {
      title: 'Site Pure Store',
      desc: 'Acesse a loja oficial para comprar e consultar produtos.',
      icon: Globe,
      href: SITE_URL || undefined,
      soon: !SITE_URL,
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Encontre rapidamente tudo o que precisa relacionado à Pure Store, em um só lugar.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const inner = (
            <Card className="h-full p-5 bg-card hover:shadow-md transition-shadow group">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                    {c.soon && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        em breve
                      </Badge>
                    )}
                    {c.href && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground leading-snug">{c.desc}</p>
                </div>
                {!c.href && !c.soon && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
                )}
              </div>
            </Card>
          );

          if (c.href) {
            return (
              <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer" className="block">
                {inner}
              </a>
            );
          }
          return (
            <button
              key={c.title}
              type="button"
              onClick={c.onClick}
              disabled={c.soon}
              className={cn('text-left block', c.soon && 'opacity-70 cursor-default')}
            >
              {inner}
            </button>
          );
        })}
      </div>

      <ContactBar />
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Catálogo digital — gera o link exclusivo da unidade (WhatsApp embutido no link).
// ————————————————————————————————————————————————————————————————
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizarWhats = (s: string) => {
  let d = s.replace(/\D/g, '');
  if (d && !d.startsWith('55') && (d.length === 10 || d.length === 11)) d = `55${d}`;
  return d;
};

const CATALOGO_LS_KEY = 'pureStore:meuCatalogo';
type CatalogoSalvo = { slug: string; nome: string; whats: string };

// Link limpo: o slug fica salvo na tabela `catalogos` (slug -> nome + WhatsApp).
// Base configurável via VITE_CATALOGO_BASE_URL — permite trocar pro domínio público
// (ex.: catalogo.purepilates.com.br) sem re-trabalho. Sem a env, usa o domínio atual.
const CATALOGO_BASE = (
  (import.meta.env as Record<string, string | undefined>).VITE_CATALOGO_BASE_URL ||
  window.location.origin
).replace(/\/$/, '');
const buildCatalogoLink = (slug: string) => `${CATALOGO_BASE}/catalogo/${slug}`;

const CatalogoTab = () => {
  const [saved, setSaved] = useState<CatalogoSalvo | null>(() => {
    try {
      const raw = localStorage.getItem(CATALOGO_LS_KEY);
      const p = raw ? JSON.parse(raw) : null;
      return p && p.slug && p.whats ? (p as CatalogoSalvo) : null;
    } catch {
      return null;
    }
  });
  const [editando, setEditando] = useState(!saved);
  const [nome, setNome] = useState(saved?.nome ?? '');
  const [tel, setTel] = useState(saved?.whats ?? '');
  const [copiado, setCopiado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const whats = normalizarWhats(tel);
  const whatsOk = whats.length === 12 || whats.length === 13;
  const valido = slugify(nome).length >= 2 && whatsOk;
  const link = saved ? buildCatalogoLink(saved.slug) : '';

  const persist = (dados: CatalogoSalvo) => {
    try {
      localStorage.setItem(CATALOGO_LS_KEY, JSON.stringify(dados));
    } catch {
      /* localStorage indisponível — segue só em memória nesta sessão */
    }
  };

  const gerar = async () => {
    if (!valido || salvando) return;
    setSalvando(true);
    setErro('');
    try {
      if (saved?.slug) {
        // Editar: atualiza o próprio registro (RLS garante que é o dono).
        const { error } = await supabase
          .from('catalogos')
          .update({ nome: nome.trim(), whatsapp: whats, updated_at: new Date().toISOString() })
          .eq('slug', saved.slug);
        if (error) throw error;
        const dados: CatalogoSalvo = { slug: saved.slug, nome: nome.trim(), whats };
        persist(dados);
        setSaved(dados);
      } else {
        // Novo: encontra um slug livre a partir do nome da unidade.
        const base = slugify(nome);
        let slug = base;
        for (let i = 2; i <= 30; i += 1) {
          const { data, error } = await supabase.from('catalogos').select('slug').eq('slug', slug).maybeSingle();
          if (error) throw error;
          if (!data) break;
          slug = `${base}-${i}`;
        }
        const { error } = await supabase.from('catalogos').insert({ slug, nome: nome.trim(), whatsapp: whats });
        if (error) throw error;
        const dados: CatalogoSalvo = { slug, nome: nome.trim(), whats };
        persist(dados);
        setSaved(dados);
      }
      setEditando(false);
      setCopiado(false);
    } catch {
      setErro('Não consegui salvar o catálogo agora. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const editar = () => {
    setNome(saved?.nome ?? '');
    setTel(saved?.whats ?? '');
    setErro('');
    setEditando(true);
  };

  const copiar = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — o usuário pode copiar manualmente */
    }
  };

  // Catálogo já gerado
  if (saved && !editando) {
    return (
      <div className="space-y-4">
        <Card className="p-6 bg-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Meu catálogo digital</h2>
              <p className="text-sm text-muted-foreground">Unidade: {saved.nome}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            <Check className="h-4 w-4 shrink-0" />
            Catálogo gerado. Compartilhe o link abaixo com seus alunos.
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Link2 className="h-4 w-4 text-primary" />
              Link exclusivo da sua unidade
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input readOnly value={link} className="flex-1 text-xs" onFocus={(e) => e.currentTarget.select()} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="gap-2" onClick={copiar}>
                  {copiado ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copiado ? 'Copiado' : 'Copiar'}
                </Button>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <Button type="button" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Ver catálogo
                  </Button>
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Atualiza sozinho:</strong> este é o seu link fixo. Quando a loja ganha novos produtos, muda preços ou esgota itens, o catálogo é atualizado automaticamente — você não precisa gerar outro link.
          </div>

          <button
            type="button"
            onClick={editar}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            Editar nome ou WhatsApp
          </button>
        </Card>
      </div>
    );
  }

  // Criar / editar
  return (
    <div className="space-y-4">
      <Card className="p-6 bg-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Criar meu catálogo digital</h2>
            <p className="text-sm text-muted-foreground">
              Um link exclusivo da sua unidade com os {catalogoProdutos.length} produtos da Pure Store. Seus alunos pedem direto no seu WhatsApp — e o catálogo se atualiza sozinho.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome da unidade</label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Pure Pilates Vila Mariana" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">WhatsApp para pedidos</label>
            <Input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Ex.: (11) 99999-9999" inputMode="tel" />
            {tel && !whatsOk && (
              <p className="text-xs text-destructive">Informe DDD + número (com o 9). Ex.: (11) 99999-9999.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" className="gap-2" disabled={!valido || salvando} onClick={gerar}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            {salvando ? 'Gerando...' : saved ? 'Salvar alterações' : 'Gerar meu catálogo'}
          </Button>
          {saved && !salvando && (
            <Button type="button" variant="ghost" onClick={() => { setEditando(false); setErro(''); }}>
              Cancelar
            </Button>
          )}
          {!valido && !salvando && (
            <span className="text-xs text-muted-foreground">Preencha o nome e o WhatsApp para gerar.</span>
          )}
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </Card>
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// FAQ
// ————————————————————————————————————————————————————————————————
const FaqTab = () => (
  <div className="space-y-6">
    <p className="text-sm text-muted-foreground">
      Dúvidas mais comuns sobre a Pure Store, organizadas por tema.
    </p>
    {FAQ_CATEGORIES.map((cat) => {
      const Icon = cat.icon;
      return (
        <section key={cat.id} className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground border-b pb-2">
            <Icon className="h-4 w-4 text-primary" />
            {cat.title}
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {cat.items.map((item, i) => (
              <AccordionItem
                key={i}
                value={`${cat.id}-${i}`}
                className="rounded-lg border border-border bg-card px-4"
              >
                <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <Blocks blocks={item.a} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      );
    })}
    <ContactBar />
  </div>
);

// ————————————————————————————————————————————————————————————————
// Pure Box
// ————————————————————————————————————————————————————————————————
const PureBoxTab = () => (
  <div className="space-y-5">
    <Card className="p-6 bg-card space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Pure Box — Kit Inauguração Arara de Vendas
          </h2>
          <p className="text-sm text-muted-foreground">Item obrigatório para novas unidades</p>
        </div>
      </div>

      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p className="rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-foreground font-medium">
          Sim. A aquisição do Pure Box – Kit Inauguração Arara de Vendas é obrigatória para todas as novas unidades da rede Pure Pilates.
        </p>
        <p>
          O kit foi desenvolvido para garantir que todas as inaugurações aconteçam dentro do padrão estabelecido pela franqueadora, proporcionando uma experiência completa e alinhada à identidade da marca desde o primeiro dia de operação.
        </p>
        <p>
          Mais do que compor o ambiente do estúdio, a arara de vendas é uma ferramenta estratégica para fortalecer a marca, enriquecer a experiência dos alunos e impulsionar os resultados da unidade.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Ao iniciar sua operação com o Pure Box, sua unidade:</p>
        <ul className="space-y-1.5">
          {PURE_BOX_BENEFITS.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground border-t pt-4">
        <p className="font-medium text-foreground">Uma inauguração forte é o primeiro passo para uma operação de sucesso.</p>
        <p>
          Por isso, o Pure Box faz parte da estratégia da rede, garantindo que todas as unidades iniciem suas atividades com uma operação padronizada, fortalecendo a marca e criando novas oportunidades de faturamento desde os primeiros dias.
        </p>
      </div>
    </Card>

    <ContactBar
      titulo="Adquirir o Pure Box ou tirar dúvidas"
      descricao="Fale com a equipe da Pure Store para adesão do Kit Inauguração Arara de Vendas."
    />
  </div>
);

// ————————————————————————————————————————————————————————————————
// Uniformes
// ————————————————————————————————————————————————————————————————
// Desenho esquemático da peça com as setas de Largura (L) e Altura (A).
const GarmentDiagram = ({ type }: { type: 'camiseta' | 'bata' }) => {
  const uid = `arw-${type}`;
  const d =
    type === 'camiseta'
      ? 'M100,34 L80,36 L40,60 L54,84 L76,74 L76,182 L164,182 L164,74 L186,84 L200,60 L160,36 L140,34 Q120,50 100,34 Z'
      : 'M100,34 L82,36 L58,62 L72,72 L86,64 L80,150 Q80,182 120,186 Q160,182 160,150 L154,64 L168,72 L182,62 L158,36 L140,34 L120,54 Z';
  const Ly = type === 'camiseta' ? 112 : 96;
  const Lx1 = type === 'camiseta' ? 78 : 88;
  const Lx2 = type === 'camiseta' ? 162 : 152;
  const Ax = 120;
  const Ay1 = 46;
  const Ay2 = type === 'camiseta' ? 180 : 184;
  return (
    <svg
      viewBox="0 0 240 220"
      className="w-full h-auto max-h-52"
      fill="none"
      role="img"
      aria-label={`Onde medir — ${type}`}
    >
      <defs>
        <marker
          id={uid}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--primary))" />
        </marker>
      </defs>
      <path d={d} stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinejoin="round" opacity="0.5" />
      {/* Largura (L) */}
      <line x1={Lx1} y1={Ly} x2={Lx2} y2={Ly} stroke="hsl(var(--primary))" strokeWidth="1.5" markerStart={`url(#${uid})`} markerEnd={`url(#${uid})`} />
      <text x={Lx2 + 6} y={Ly + 5} fill="hsl(var(--primary))" fontSize="15" fontWeight="700">L</text>
      {/* Altura (A) */}
      <line x1={Ax} y1={Ay1} x2={Ax} y2={Ay2} stroke="hsl(var(--primary))" strokeWidth="1.5" markerStart={`url(#${uid})`} markerEnd={`url(#${uid})`} />
      <text x={Ax + 8} y={(Ay1 + Ay2) / 2 + 24} fill="hsl(var(--primary))" fontSize="15" fontWeight="700">A</text>
    </svg>
  );
};

const MedidaCard = ({ t }: { t: MedidaTabela }) => (
  <Card className="p-5 bg-card space-y-3">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Shirt className="h-4 w-4 text-primary" />
      {t.produto}
    </h3>
    <div className="flex flex-col sm:flex-row gap-4">
      {t.diagram && (
        <div className="sm:w-44 shrink-0 flex items-center justify-center rounded-lg bg-muted/30 p-3">
          <GarmentDiagram type={t.diagram} />
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-2 text-left font-semibold">Tamanho</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Largura (L)</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Altura (A)</th>
              </tr>
            </thead>
            <tbody>
              {t.grupos.map((g, gi) => (
                <Fragment key={gi}>
                  {g.titulo && (
                    <tr className="bg-muted/60">
                      <td colSpan={3} className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {g.titulo}
                      </td>
                    </tr>
                  )}
                  {g.linhas.map((l) => (
                    <tr key={l.tam} className="border-t border-border">
                      <td className="px-3 py-2 font-semibold text-foreground">{l.tam}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{l.largura}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{l.altura}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {t.obs && <p className="text-xs text-muted-foreground italic">{t.obs}</p>}
      </div>
    </div>
  </Card>
);

const UniformesTab = () => (
  <div className="space-y-5">
    <Card className="p-6 bg-card space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shirt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Uniformes oficiais</h2>
          <p className="text-sm text-muted-foreground">Compra e tabelas de medidas dos uniformes da rede</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground">Como comprar os uniformes?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          As compras de uniformes oficiais devem ser realizadas diretamente com a equipe da Pure Store pelo WhatsApp:
        </p>
        <a href={waLink('Olá! Gostaria de comprar uniformes oficiais.')} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
          <Button className="gap-2">
            <MessageCircle className="h-4 w-4" />
            {WHATSAPP_DISPLAY}
          </Button>
        </a>
      </div>
    </Card>

    <div className="space-y-3">
      <div className="border-b pb-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Ruler className="h-4 w-4 text-primary" />
          Tabelas de medidas
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Confira e confirme as numerações antes de fazer o pedido. Os valores se referem à medida da peça (largura L e altura A), não do corpo.
        </p>
      </div>
      <div className="space-y-4">
        {TABELAS_MEDIDAS.map((t) => (
          <MedidaCard key={t.produto} t={t} />
        ))}
      </div>
    </div>
  </div>
);

// ————————————————————————————————————————————————————————————————
// Tabela de preços (estrutura; valores na próxima etapa)
// ————————————————————————————————————————————————————————————————
const PrecoRow = ({ p, disc }: { p: PrecoStore; disc: DiscId }) => {
  const discKey = disc === 'todos' ? null : disc;
  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2 text-foreground">
        <span>{p.produto}</span>
        {p.status && (
          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 text-muted-foreground">
            {p.status}
          </Badge>
        )}
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">{brl(p.revenda)}</td>
      {discKey ? (
        <td className="px-3 py-2 text-right whitespace-nowrap font-semibold text-primary">
          {brl(p[discKey])}
        </td>
      ) : (
        <>
          <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">{brl(p.off20)}</td>
          <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">{brl(p.off25)}</td>
          <td className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">{brl(p.off30)}</td>
        </>
      )}
    </tr>
  );
};

const PrecosTab = () => {
  const [disc, setDisc] = useState<DiscId>('todos');
  const [q, setQ] = useState('');
  const nq = normalize(q);
  const rows = precosStore.filter((p) => !nq || normalize(p.produto).includes(nq));
  const discLabel = DISCOUNTS.find((d) => d.id === disc)!.label;
  const cols = disc === 'todos' ? 5 : 3;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <Lock className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Área com condições comerciais da rede — de uso exclusivo dos franqueados. Não compartilhe estes valores externamente.
        </span>
      </div>

      <Card className="p-5 bg-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TableIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Tabela de preços</h2>
            <p className="text-sm text-muted-foreground">
              Preços de referência por faixa de desconto de franqueado.
            </p>
          </div>
        </div>

        {/* Aviso de vigência + WhatsApp */}
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted-foreground">
            Valores de referência — <strong className="text-foreground">{PRECOS_REFERENCIA}</strong>. Consulte a tabela vigente com a equipe da Pure Store.
          </span>
          <a href={waLink('Olá! Gostaria de confirmar a tabela de preços vigente da Pure Store.')} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              {WHATSAPP_DISPLAY}
            </Button>
          </a>
        </div>

        {/* Filtro por desconto + busca */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1">
            {DISCOUNTS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDisc(d.id)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                  disc === d.id ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar produto..."
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-3 py-2 text-left font-semibold">Produto</th>
                <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">Revenda</th>
                {disc === 'todos' ? (
                  <>
                    <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">20% OFF</th>
                    <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">25% OFF</th>
                    <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">30% OFF</th>
                  </>
                ) : (
                  <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">{discLabel}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <PrecoRow key={p.produto} p={p} disc={disc} />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={cols} className="px-3 py-6 text-center text-muted-foreground">
                    Nenhum produto encontrado para "{q}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          {rows.length} produto(s). A coluna <strong>Revenda</strong> é o preço no site; as demais são o valor que o franqueado paga com desconto.
        </p>
      </Card>
    </div>
  );
};

// ————————————————————————————————————————————————————————————————
// Barra de contato reutilizável
// ————————————————————————————————————————————————————————————————
const ContactBar = ({
  titulo = 'Falar com a equipe da Pure Store',
  descricao = 'Cupom, orçamento, medidas, frete, NF, trocas — é por aqui.',
}: {
  titulo?: string;
  descricao?: string;
}) => (
  <Card className="p-4 bg-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <MessageCircle className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <p className="text-xs text-muted-foreground">
          {descricao}
          {STORE_EMAIL ? ` E-mail: ${STORE_EMAIL}` : ''}
        </p>
      </div>
    </div>
    <a href={waLink()} target="_blank" rel="noopener noreferrer" className="shrink-0">
      <Button className="gap-2 w-full sm:w-auto">
        <MessageCircle className="h-4 w-4" />
        {WHATSAPP_DISPLAY}
      </Button>
    </a>
  </Card>
);

export default PureStore;
