// Chat do Pure Design: o franqueado pede a arte escrevendo e o assistente devolve
// um modelo da marca já preenchido, com prévia. "Abrir no editor" leva ao editor
// do Pure Design com os campos preenchidos, onde dá para ajustar e baixar.
//
// A conversa é a do Pure GPT (mesmo visual, mesmo anexo de fotos); o que mudou
// é a resposta, que deixou de ser uma arte montada do zero.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Paperclip, PencilLine, Send, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { buildRenderedHTML, pureDesignTemplates } from '@/data/pureDesignTemplates';
import {
  ImagemRecusada,
  conversar,
  lerImagem,
  valoresDoPreenchimento,
  type ImagemDaUnidade,
  type Preenchimento,
} from './assistenteStore';

const EXEMPLOS = [
  'Arte de aniversário para a instrutora Kelly, com a foto dela.',
  'Aviso de horário especial no feriado de 20 de novembro.',
  'Vem aí: inauguração da nova unidade no Jardim Botânico.',
];

interface Mensagem {
  id: string;
  autor: 'pessoa' | 'pure';
  texto?: string;
  imagens?: ImagemDaUnidade[];
  preenchimento?: Preenchimento;
  /** As fotos como estavam neste ponto da conversa (a numeração do agente). */
  fotos?: string[];
  problema?: string;
  pensando?: boolean;
}

let sequencia = 0;
const novoId = () => `pd-${++sequencia}`;

const LARGURA_PREVIA = 260;

/** Miniatura da arte preenchida, desenhada pelo mesmo HTML do editor. */
function Previa({ p, fotos }: { p: Preenchimento; fotos: string[] }) {
  const modelo = pureDesignTemplates.find((t) => t.id === p.modelo);
  if (!modelo) return null;
  const valores: Record<string, string> = {};
  modelo.fields.forEach((f) => (valores[f.id] = f.defaultValue));
  Object.assign(valores, valoresDoPreenchimento(p, fotos));
  const escala = LARGURA_PREVIA / modelo.width;
  return (
    <div
      className="overflow-hidden rounded-xl border bg-muted"
      style={{ width: LARGURA_PREVIA, height: modelo.height * escala }}
    >
      <iframe
        title={`Prévia — ${modelo.name}`}
        srcDoc={buildRenderedHTML(modelo, valores)}
        sandbox=""
        style={{
          width: modelo.width,
          height: modelo.height,
          border: 0,
          transform: `scale(${escala})`,
          transformOrigin: '0 0',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default function AssistentePureDesign() {
  const navigate = useNavigate();
  const [imagens, setImagens] = useState<ImagemDaUnidade[]>([]);
  const [texto, setTexto] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [gerando, setGerando] = useState(false);
  // Todas as fotos já enviadas na conversa, na ordem: é a numeração que o agente usa.
  const [fotos, setFotos] = useState<string[]>([]);
  const fimDaConversa = useRef<HTMLDivElement>(null);

  const pronto = texto.trim().length > 0 && !gerando;

  useEffect(() => {
    fimDaConversa.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [mensagens]);

  const subirImagens = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    for (const arquivo of Array.from(arquivos)) {
      try {
        const imagem = await lerImagem(arquivo);
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
    const historico = [
      ...mensagens.filter((m) => m.texto).map((m) => ({ autor: m.autor, texto: m.texto as string })),
      {
        autor: 'pessoa' as const,
        texto: anexadas.length ? `${escrito}\n(anexei ${anexadas.length} foto(s))` : escrito,
      },
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
            ? { ...m, pensando: false, texto: resposta.texto, preenchimento: resposta.preenchimento, fotos: acervo }
            : m,
        ),
      );
    } catch (erro) {
      setMensagens((atuais) =>
        atuais.map((m) =>
          m.id === idResposta
            ? { ...m, pensando: false, problema: erro instanceof Error ? erro.message : 'Não consegui agora.' }
            : m,
        ),
      );
    } finally {
      setGerando(false);
    }
  };

  const abrirNoEditor = (m: Mensagem) => {
    if (!m.preenchimento) return;
    navigate(`/pure-design/${m.preenchimento.modelo}`, {
      state: { valores: valoresDoPreenchimento(m.preenchimento, m.fotos ?? []) },
    });
  };

  return (
    <Card className="flex max-h-[75vh] min-h-[420px] flex-col overflow-hidden">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {mensagens.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-4 text-center">
            <Sparkles className="h-8 w-8 text-primary/40" />
            <p className="mt-3 font-semibold">Que arte você precisa?</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Escreva com as suas palavras. Se tiver foto, anexe no clipe: eu escolho o modelo da marca e
              preencho para você.
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
                        <img key={i.id} src={i.dataUrl} alt={i.nome} className="h-14 w-14 rounded-lg border object-cover" />
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
                      Escolhendo o modelo e preenchendo…
                    </p>
                  )}
                  {m.problema && (
                    <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm">{m.problema}</div>
                  )}
                  {m.texto && !m.problema && (
                    <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap">
                      {m.texto}
                    </div>
                  )}
                  {m.preenchimento && (
                    <div className="mt-2 space-y-2">
                      <Previa p={m.preenchimento} fotos={m.fotos ?? []} />
                      <Button size="sm" onClick={() => abrirNoEditor(m)}>
                        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                        Abrir no editor para ajustar e baixar
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

      <div className="border-t bg-muted/20 p-3">
        {imagens.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {imagens.map((imagem) => (
              <div key={imagem.id} className="relative">
                <img src={imagem.dataUrl} alt={imagem.nome} className="h-14 w-14 rounded-lg border object-cover" />
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
            htmlFor="pure-design-imagens"
            title="Anexar uma foto"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Anexar uma foto</span>
          </label>
          <input
            id="pure-design-imagens"
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
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void enviar();
              }
            }}
            placeholder="Ex.: arte de aniversário para o instrutor João, com a foto dele."
            rows={2}
            className="min-h-[40px] resize-none bg-background"
          />
          <Button
            onClick={() => void enviar()}
            disabled={!pronto}
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-label="Enviar o pedido"
          >
            {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
