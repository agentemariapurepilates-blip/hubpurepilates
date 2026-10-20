// Pure GPT — conversa para o franqueado pedir a arte que precisa.
//
// POR QUE É UM CHAT, E SÓ UM CHAT: o franqueado já sabe conversar com um GPT.
// Pedir a arte escrevendo, como quem fala com alguém, dispensa explicação. Os
// ajustes que havia aqui (tipo de peça, formato, elementos da marca) saíram em
// 19/10/2026: com o agente MONTANDO a arte, o logotipo é desenhado pelo Hub e o
// formato é um só, então cada um daqueles campos era uma escolha sem efeito.
// O que não é a conversa é o clipe de anexar foto.
//
// A ARTE NÃO É UMA IMAGEM GERADA: o agente devolve a composição em JSON e quem
// desenha é composicao.ts, aqui no navegador. Por isso o que aparece na bolha é
// HTML, e o PNG sai dele — ver `baixar`.

import { useEffect, useRef, useState } from 'react';
import { domToBlob } from 'modern-screenshot';
import { Download, Info, Loader2, Paperclip, Send, Sparkles, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { getMontserratFontFaceCss } from '@/features/colaborador/academy/montserratEmbed';
import { TAMANHOS, renderizar, type Composicao } from './composicao';
import {
  GERACAO_LIGADA,
  ImagemRecusada,
  conversar,
  lerImagem,
  type ImagemDaUnidade,
} from './pureGptStore';

/** Exemplos que mostram o nível de detalhe que faz diferença no resultado. */
const EXEMPLOS = [
  'Convite para conhecer a unidade nesta semana, com destaque para o telefone.',
  'Chamada para a turma das 6h da manhã, falando de energia para começar o dia.',
  'Arte de aniversário para o instrutor Kleber, que faz 32 anos.',
];

interface Mensagem {
  id: string;
  autor: 'pessoa' | 'pure';
  texto?: string;
  imagens?: ImagemDaUnidade[];
  /** A arte montada pelo agente, quando ele teve o suficiente para montar. */
  composicao?: Composicao;
  /**
   * As fotos como estavam neste ponto da conversa. Ficam guardadas na mensagem
   * para que uma arte de dez minutos atrás continue mostrando as fotos que ela
   * usou, mesmo depois de a pessoa anexar outras.
   */
  fotos?: string[];
  /** Resposta que não deu certo: aparece na conversa, não como alerta solto. */
  problema?: string;
  pensando?: boolean;
}

let sequencia = 0;
const novoId = () => `msg-${++sequencia}`;

const PureGpt = () => {
  const [imagens, setImagens] = useState<ImagemDaUnidade[]>([]);
  const [texto, setTexto] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [gerando, setGerando] = useState(false);
  const [baixando, setBaixando] = useState('');
  // Todas as fotos já enviadas na conversa, na ordem. É esta numeração que o
  // agente usa ("a foto 0 vai na moldura"), então ela não pode mudar quando a
  // pessoa anexa mais uma no meio do caminho.
  const [fotos, setFotos] = useState<string[]>([]);
  // @font-face do Montserrat embutido: fonte de <link> cross-origin não entra
  // no SVG do modern-screenshot e o PNG sairia com a fonte errada.
  const [fonte, setFonte] = useState('');
  const fimDaConversa = useRef<HTMLDivElement>(null);

  const pronto = texto.trim().length > 0 && !gerando;

  useEffect(() => {
    getMontserratFontFaceCss().then(setFonte).catch(() => {});
  }, []);

  useEffect(() => {
    // Nem todo ambiente tem scrollIntoView (jsdom, por exemplo): sem ele a
    // conversa só não rola sozinha, o resto continua funcionando.
    fimDaConversa.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  const subirImagens = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    for (const arquivo of Array.from(arquivos)) {
      try {
        const imagem = await lerImagem(arquivo);
        // Mesmo arquivo duas vezes não ajuda e ainda pesa no envio.
        setImagens((atuais) => (atuais.some((i) => i.id === imagem.id) ? atuais : [...atuais, imagem]));
      } catch (erro) {
        toast({
          title: 'Imagem não aceita',
          description: erro instanceof ImagemRecusada ? erro.message : 'Tente outro arquivo.',
          variant: 'destructive',
        });
      }
    }
  };

  const enviar = async () => {
    if (!pronto) return;
    const escrito = texto.trim();
    const anexadas = [...imagens];
    const idResposta = novoId();
    const acervo = [...fotos, ...anexadas.map((i) => i.dataUrl)];

    // O agente recebe a conversa inteira: é assim que ele lembra do que já foi
    // dito e não repete a mesma pergunta.
    const historico = [
      ...mensagens.filter((m) => m.texto).map((m) => ({ autor: m.autor, texto: m.texto as string })),
      { autor: 'pessoa' as const, texto: escrito },
    ];

    setMensagens((atuais) => [
      ...atuais,
      { id: novoId(), autor: 'pessoa', texto: escrito, imagens: anexadas },
      { id: idResposta, autor: 'pure', pensando: true },
    ]);
    setTexto('');
    setImagens([]);
    setFotos(acervo);
    setGerando(true);

    try {
      const resposta = await conversar({ mensagens: historico, fotos: acervo.length });
      setMensagens((atuais) =>
        atuais.map((m) =>
          m.id === idResposta
            ? { ...m, pensando: false, texto: resposta.texto, composicao: resposta.composicao, fotos: acervo }
            : m,
        ),
      );
    } catch (erro) {
      setMensagens((atuais) =>
        atuais.map((m) =>
          m.id === idResposta
            ? {
                ...m,
                pensando: false,
                problema: erro instanceof Error ? erro.message : 'Não consegui montar a arte agora.',
              }
            : m,
        ),
      );
    } finally {
      setGerando(false);
    }
  };

  /**
   * O PNG sai do mesmo HTML da prévia, só que num nó em tamanho real, fora da
   * tela. É o que garante que o arquivo é igual ao que a pessoa viu: a prévia e
   * a exportação são a mesma composição, medida em % da própria arte.
   */
  const baixar = async (m: Mensagem) => {
    if (!m.composicao) return;
    setBaixando(m.id);
    const { largura, altura } = TAMANHOS[m.composicao.proporcao] ?? TAMANHOS['4:5'];
    const palco = document.createElement('div');
    palco.style.cssText = `position:fixed;left:-99999px;top:0;width:${largura}px;height:${altura}px;`;
    palco.innerHTML = `<style>${fonte}</style>${renderizar(m.composicao, m.fotos ?? [])}`;
    document.body.appendChild(palco);

    try {
      // As imagens precisam estar carregadas antes da captura, senão entram
      // vazias no PNG.
      await Promise.all(
        Array.from(palco.querySelectorAll('img')).map(
          (img) =>
            img.complete ||
            new Promise<void>((ok) => {
              img.addEventListener('load', () => ok(), { once: true });
              img.addEventListener('error', () => ok(), { once: true });
            }),
        ),
      );
      const blob = await domToBlob(palco, { type: 'image/png', scale: 1, backgroundColor: null });
      if (!blob) throw new Error('não consegui gerar o arquivo');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pure-gpt-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: 'Não consegui baixar',
        description: 'Tente de novo em instantes.',
        variant: 'destructive',
      });
    } finally {
      palco.remove();
      setBaixando('');
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Para a sua unidade</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Pure GPT
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Peça a arte conversando, como você já faz com um GPT. O que sair daqui já vem no padrão visual
            da Pure Pilates.
          </p>
        </div>

        {!GERACAO_LIGADA && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Em teste.</strong> A conversa já funciona, mas a arte ainda não está sendo montada.
            </AlertDescription>
          </Alert>
        )}

        <Card className="flex min-h-[70vh] flex-col overflow-hidden">
          {/* ── a conversa ── */}
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {mensagens.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles className="h-8 w-8 text-primary/40" />
                <p className="mt-3 font-semibold">O que você precisa criar?</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Escreva com as suas palavras. Se tiver foto do instrutor ou do estúdio, anexe que ela entra
                  na arte.
                </p>
                <div className="mt-5 w-full max-w-md space-y-2">
                  {EXEMPLOS.map((exemplo) => (
                    <button
                      key={exemplo}
                      type="button"
                      onClick={() => setTexto(exemplo)}
                      className="w-full rounded-lg border border-border/60 p-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
                    >
                      {exemplo}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              mensagens.map((m) =>
                m.autor === 'pessoa' ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] space-y-2">
                      <div className="rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                        {m.texto}
                      </div>
                      {m.imagens && m.imagens.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {m.imagens.map((i) => (
                            <img
                              key={i.id}
                              src={i.dataUrl}
                              alt={i.nome}
                              className="h-14 w-14 rounded-lg border object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {m.pensando && (
                        <p className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Montando a sua arte…
                        </p>
                      )}
                      {m.problema && (
                        <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm">
                          {m.problema}
                        </div>
                      )}
                      {m.texto && !m.problema && (
                        <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">
                          {m.texto}
                        </div>
                      )}
                      {m.composicao && (
                        <div className="mt-2 space-y-2">
                          <div
                            className="aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-xl border"
                            // A composição é montada por composicao.ts, que escapa todo
                            // texto e só escreve as propriedades que ele mesmo conhece —
                            // o agente devolve dados, nunca marcação.
                            dangerouslySetInnerHTML={{ __html: renderizar(m.composicao, m.fotos ?? []) }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={baixando === m.id}
                            onClick={() => void baixar(m)}
                          >
                            {baixando === m.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Baixar a arte
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )
            )}
            <div ref={fimDaConversa} />
          </div>

          {/* ── o campo de escrever ── */}
          <div className="border-t bg-muted/20 p-3">
            {imagens.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {imagens.map((imagem) => (
                  <div key={imagem.id} className="relative">
                    <img
                      src={imagem.dataUrl}
                      alt={imagem.nome}
                      className="h-14 w-14 rounded-lg border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImagens((atuais) => atuais.filter((i) => i.id !== imagem.id))}
                      aria-label={`Tirar ${imagem.nome}`}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-foreground p-0.5 text-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <label
                htmlFor="pure-gpt-imagens"
                title="Anexar uma imagem sua"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Anexar uma imagem sua</span>
              </label>
              <input
                id="pure-gpt-imagens"
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  void subirImagens(e.target.files);
                  e.target.value = '';
                }}
              />
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  // Enter envia, Shift+Enter quebra linha — como num chat.
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void enviar();
                  }
                }}
                placeholder="Ex.: convite para conhecer a unidade nesta semana, com destaque para o telefone."
                rows={2}
                className="min-h-[40px] resize-none bg-background"
              />
              <Button
                onClick={() => void enviar()}
                disabled={!pronto || !GERACAO_LIGADA}
                size="icon"
                className="h-10 w-10 shrink-0"
                aria-label="Enviar o pedido"
              >
                {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PureGpt;
