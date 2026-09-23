// Página privada do evento: confirmação de presença e sorteio da turma.
//
// Rota /colaborador/evento, protegida por requireColaborador — franqueado
// logado não entra. A turma vem do banco (ver eventoStore), aqui é só a tela.
//
// A estética segue o convite da Jornada do Franqueado: escape room, madeira
// escura, placas de latão e luz de lanterna. As cores são fixas no arquivo
// porque a página é uma peça só, como as edições da timeline.

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Check, Clock, KeyRound, Loader2, MapPin, Users } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  EVENTO,
  buscarMinhaConfirmacao,
  confirmarPresenca,
  contarPorTurma,
  formatarWhatsapp,
  listarConfirmacoes,
  whatsappValido,
  type Confirmacao,
  type Turma,
} from './eventoStore';

const NOITE = '#140d09'; // madeira no escuro
const MADEIRA = '#1f1510'; // painel
const LATAO = '#DB9828'; // dourado da marca, que faz as vezes do latão
const BRONZE = 'rgba(219, 152, 40, 0.35)'; // borda das placas

/** Textura de tábua: listras verticais bem discretas por cima da madeira. */
const MADEIRA_TEXTURA =
  'repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 7px)';

/** Placa de latão parafusada, como as do convite. */
const Placa = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn('relative rounded-md px-5 py-4 sm:px-7 sm:py-5', className)}
    style={{
      background: 'linear-gradient(145deg, rgba(219,152,40,0.16), rgba(219,152,40,0.05) 55%, rgba(0,0,0,0.25))',
      border: `1px solid ${BRONZE}`,
      boxShadow: 'inset 0 1px 0 rgba(255,220,170,0.18), 0 14px 30px -18px rgba(0,0,0,0.9)',
    }}
  >
    {/* os quatro parafusos */}
    {[
      'left-2 top-2',
      'right-2 top-2',
      'left-2 bottom-2',
      'right-2 bottom-2',
    ].map((posicao) => (
      <span
        key={posicao}
        aria-hidden
        className={cn('absolute h-1.5 w-1.5 rounded-full', posicao)}
        style={{ background: 'radial-gradient(circle at 30% 30%, #f3d7a4, #8a5a1f)' }}
      />
    ))}
    {children}
  </div>
);

/** A fechadura do convite, em traço de latão. */
const Fechadura = ({ className, tamanho = 120 }: { className?: string; tamanho?: number }) => (
  <svg
    viewBox="0 0 100 150"
    width={tamanho}
    height={tamanho * 1.5}
    className={className}
    aria-hidden
    fill="none"
  >
    <circle cx="50" cy="48" r="26" stroke={LATAO} strokeWidth="3" opacity="0.55" />
    <path d="M38 66 L30 120 h40 L62 66 Z" stroke={LATAO} strokeWidth="3" opacity="0.55" />
    <circle cx="50" cy="48" r="13" fill={LATAO} opacity="0.25" />
  </svg>
);

/** Cada turma tem a sua cor, para achar o próprio nome na lista. */
const CORES_TURMA: Record<Turma, { texto: string; borda: string; fundo: string }> = {
  A: { texto: '#DB9828', borda: 'rgba(219,152,40,0.45)', fundo: 'rgba(219,152,40,0.12)' },
  B: { texto: '#E4566E', borda: 'rgba(228,86,110,0.45)', fundo: 'rgba(228,86,110,0.12)' },
};

const ChipTurma = ({ turma }: { turma: Turma }) => (
  <span
    className="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
    style={{
      color: CORES_TURMA[turma].texto,
      borderColor: CORES_TURMA[turma].borda,
      background: CORES_TURMA[turma].fundo,
    }}
  >
    Turma {turma}
  </span>
);

/** Painel escuro de conteúdo (formulário, lista). */
const Painel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn('relative overflow-hidden rounded-xl p-5 sm:p-7', className)}
    style={{
      background: MADEIRA,
      backgroundImage: MADEIRA_TEXTURA,
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 18px 40px -28px rgba(0,0,0,0.9)',
    }}
  >
    {children}
  </div>
);

const EventoConfirmacao = () => {
  const { user } = useAuth();
  const [carregando, setCarregando] = useState(true);
  const [minha, setMinha] = useState<Confirmacao | null>(null);
  const [lista, setLista] = useState<Confirmacao[]>([]);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregarLista = useCallback(() => {
    listarConfirmacoes()
      .then(setLista)
      .catch(() => {
        /* a lista é secundária: se falhar, a confirmação continua funcionando */
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    let ativo = true;

    (async () => {
      try {
        const [confirmacao, todas, perfil] = await Promise.all([
          buscarMinhaConfirmacao(user.id),
          listarConfirmacoes(),
          supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
        ]);
        if (!ativo) return;
        setMinha(confirmacao);
        setLista(todas);
        // Já chega preenchido com o nome do Hub; dá para corrigir na hora.
        setNome(confirmacao?.nome ?? perfil.data?.full_name ?? '');
        if (confirmacao) setWhatsapp(confirmacao.whatsapp);
      } catch {
        if (ativo) {
          toast({
            title: 'Não foi possível abrir o convite',
            description: 'Atualize a página e tente de novo.',
            variant: 'destructive',
          });
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [user]);

  // A lista anda sozinha conforme o pessoal confirma.
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout>;
    const canal = supabase
      .channel('evento-confirmacoes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evento_confirmacoes' }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(carregarLista, 1200);
      })
      .subscribe();

    return () => {
      clearTimeout(debounce);
      supabase.removeChannel(canal);
    };
  }, [carregarLista]);

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (nome.trim().length < 2) {
      toast({ title: 'Faltou o nome', description: 'Escreva seu nome completo.', variant: 'destructive' });
      return;
    }
    if (!whatsappValido(whatsapp)) {
      toast({
        title: 'WhatsApp incompleto',
        description: 'Use DDD + número, como (11) 98888-7777.',
        variant: 'destructive',
      });
      return;
    }

    setEnviando(true);
    try {
      const confirmacao = await confirmarPresenca(nome, whatsapp);
      setMinha(confirmacao);
      carregarLista();
      toast({
        title: 'Presença confirmada!',
        description: `Você está na Turma ${confirmacao.turma}.`,
      });
    } catch (erro) {
      toast({
        title: 'Não deu para confirmar',
        description: erro instanceof Error ? erro.message : 'Tente de novo em instantes.',
        variant: 'destructive',
      });
    } finally {
      setEnviando(false);
    }
  };

  const contagem = contarPorTurma(lista);
  const campo =
    'w-full rounded-md px-3 py-2.5 text-base text-white placeholder:text-white/35 outline-none transition-colors focus:border-[rgba(219,152,40,0.7)]';
  const estiloCampo = { background: 'rgba(0,0,0,0.35)', border: `1px solid ${BRONZE}` };

  return (
    <MainLayout>
      <div
        className="relative -mx-4 -my-6 min-h-screen overflow-hidden px-4 py-8 sm:-mx-6 sm:px-6 sm:py-10"
        style={{ background: NOITE, backgroundImage: MADEIRA_TEXTURA }}
      >
        {/* luz da lanterna, no alto */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{ background: 'radial-gradient(60% 100% at 30% 0%, rgba(255,196,110,0.22), transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-3xl space-y-5">
          {/* ── convite ── */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: LATAO }}>
              Só para colaboradores
            </p>

            <Placa className="mt-3 text-center">
              <p
                className="font-heading text-xs uppercase tracking-[0.35em] sm:text-sm"
                style={{ color: '#f0d4a4' }}
              >
                Jornada do
              </p>
              <p
                className="font-heading text-3xl font-black uppercase leading-none tracking-[0.06em] sm:text-5xl"
                style={{ color: LATAO, textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}
              >
                Franqueado
              </p>
            </Placa>

            <Fechadura className="mx-auto mt-6" tamanho={76} />

            {EVENTO.subtitulo && (
              <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/65">{EVENTO.subtitulo}</p>
            )}

            <Placa className="mt-6 text-left">
              <div className="space-y-2.5 text-sm text-white/85 sm:text-base">
                {EVENTO.data && (
                  <p className="flex items-start gap-2.5">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" style={{ color: LATAO }} />
                    <span>{EVENTO.data}</span>
                  </p>
                )}
                {EVENTO.horario && (
                  <p className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: LATAO }} />
                    <span className="font-semibold">{EVENTO.horario}</span>
                  </p>
                )}
                {EVENTO.local && (
                  <p className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: LATAO }} />
                    <span>{EVENTO.local}</span>
                  </p>
                )}
              </div>
            </Placa>
          </div>

          {carregando ? (
            <Painel className="space-y-3">
              <Skeleton className="h-5 w-44 bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
            </Painel>
          ) : minha ? (
            /* ── já confirmou: a turma sorteada ── */
            <Painel className="text-center" aria-live="polite">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ color: LATAO, border: `1px solid ${BRONZE}`, background: 'rgba(219,152,40,0.1)' }}
              >
                <Check className="h-3.5 w-3.5" />
                Presença confirmada
              </div>

              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.28em] text-white/45">
                Você entra com a
              </p>
              <p
                className="font-heading text-5xl font-black leading-none tracking-tight sm:text-7xl"
                style={{ color: CORES_TURMA[minha.turma].texto }}
              >
                TURMA {minha.turma}
              </p>

              <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-white/60">
                Cada turma entra em uma sala. Lá dentro é o time que resolve: os mistérios só abrem a porta se
                vocês trabalharem juntos.
              </p>
              <p className="mt-4 text-xs text-white/45">
                Confirmado como <span className="font-semibold text-white/75">{minha.nome}</span>
                <span className="whitespace-nowrap"> · {minha.whatsapp}</span>
              </p>
            </Painel>
          ) : (
            /* ── ainda não confirmou: o formulário ── */
            <Painel>
              <h2 className="flex items-center gap-2 font-heading text-lg font-black text-white">
                <KeyRound className="h-5 w-5" style={{ color: LATAO }} />
                Confirmar presença
              </h2>
              {EVENTO.convite && <p className="mt-2 text-sm leading-relaxed text-white/60">{EVENTO.convite}</p>}

              <form onSubmit={enviar} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="nome" className="text-xs font-semibold uppercase tracking-wider text-white/55">
                    Nome completo
                  </label>
                  <input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como você quer aparecer na lista"
                    autoComplete="name"
                    required
                    className={campo}
                    style={estiloCampo}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="whatsapp" className="text-xs font-semibold uppercase tracking-wider text-white/55">
                    WhatsApp
                  </label>
                  <input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatarWhatsapp(e.target.value))}
                    placeholder="(11) 98888-7777"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    className={campo}
                    style={estiloCampo}
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3 font-heading text-base font-black uppercase tracking-wide text-[#2b1a06] transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(160deg, #f0c072, #DB9828 55%, #a86d16)' }}
                >
                  {enviando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sorteando sua turma…
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Confirmar presença
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-white/40">
                  A turma é sorteada automaticamente no momento da confirmação.
                </p>
              </form>
            </Painel>
          )}

          {/* ── quem já confirmou ── */}
          <Painel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-heading font-black text-white">
                <Users className="h-4 w-4" style={{ color: LATAO }} />
                Quem já confirmou
              </h2>
              <div className="flex items-center gap-2 text-xs font-semibold">
                {(['A', 'B'] as const).map((turma) => (
                  <span
                    key={turma}
                    className="rounded-full border px-2.5 py-0.5"
                    style={{
                      color: CORES_TURMA[turma].texto,
                      borderColor: CORES_TURMA[turma].borda,
                      background: CORES_TURMA[turma].fundo,
                    }}
                  >
                    Turma {turma} · {contagem[turma]}
                  </span>
                ))}
              </div>
            </div>

            {lista.length === 0 ? (
              <p className="mt-4 text-sm text-white/50">
                Ninguém confirmou ainda. Seja a primeira pessoa a entrar.
              </p>
            ) : (
              <>
                <ul className="mt-4 divide-y divide-white/10">
                  {lista.map((confirmacao) => (
                    <li key={confirmacao.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span
                        className={cn(
                          'min-w-0 truncate text-sm text-white/80',
                          confirmacao.userId === user?.id && 'font-semibold text-white',
                        )}
                      >
                        {confirmacao.nome}
                        {confirmacao.userId === user?.id && (
                          <span className="ml-2 text-xs text-white/45">(você)</span>
                        )}
                      </span>
                      <ChipTurma turma={confirmacao.turma} />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-white/40">
                  {contagem.total} {contagem.total === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}.
                </p>
              </>
            )}
          </Painel>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventoConfirmacao;
