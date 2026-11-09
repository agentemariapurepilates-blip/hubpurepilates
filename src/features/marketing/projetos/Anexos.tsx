import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, File, FileSpreadsheet, FileText, Film, Loader2, Presentation, Trash2, UploadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { BUCKET_ANEXOS, db, nomeDeCanal, nomeSeguro, tamanhoLegivel, tipoDoArquivo, type Anexo, type TipoArquivo } from './projetos';

// Arquivos do item: PDF, Word, Excel, fotos, vídeos... Arrastar e soltar ou clicar
// para enviar. Ficam no bucket privado marketing-anexos; para ver ou baixar, o
// Hub gera um link temporário. Foto vira miniatura; vídeo toca ali mesmo.

// O limite global de arquivo do Supabase do Hub (09/11/2026). Maior que isso o
// envio falha; avisamos antes de tentar.
const LIMITE_MB = 50;

const ICONE: Record<TipoArquivo, typeof File> = {
  imagem: File,
  video: Film,
  pdf: FileText,
  documento: FileText,
  planilha: FileSpreadsheet,
  apresentacao: Presentation,
  outro: File,
};
const COR: Record<TipoArquivo, string> = {
  imagem: '#0ea5e9',
  video: '#8b5cf6',
  pdf: '#dc2626',
  documento: '#2563eb',
  planilha: '#16a34a',
  apresentacao: '#ea580c',
  outro: '#64748b',
};

export function Anexos({ itemId }: { itemId: string }) {
  const { user } = useAuth();
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<string[]>([]);
  const [sobre, setSobre] = useState(false);
  const [vendo, setVendo] = useState<Anexo | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    const { data } = await db.from('marketing_anexos').select('*').eq('item_id', itemId).order('created_at');
    const lista = (data ?? []) as Anexo[];
    setAnexos(lista);
    if (lista.length) {
      const { data: urls } = await db.storage.from(BUCKET_ANEXOS).createSignedUrls(lista.map((a) => a.caminho), 60 * 60);
      setLinks(Object.fromEntries((urls ?? []).map((u, i) => [lista[i].id, u.signedUrl ?? ''])));
    }
  }, [itemId]);

  useEffect(() => {
    carregar();
    const canal = db
      .channel(nomeDeCanal(`marketing-anexos-${itemId}`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'marketing_anexos', filter: `item_id=eq.${itemId}` }, carregar)
      .subscribe();
    return () => {
      db.removeChannel(canal);
    };
  }, [itemId, carregar]);

  const enviar = async (arquivos: FileList | File[]) => {
    for (const arq of Array.from(arquivos)) {
      if (arq.size > LIMITE_MB * 1024 * 1024) {
        toast.error(`"${arq.name}" tem ${tamanhoLegivel(arq.size)}: o limite é ${LIMITE_MB} MB por arquivo.`);
        continue;
      }
      setEnviando((e) => [...e, arq.name]);
      const caminho = `${itemId}/${Date.now()}-${nomeSeguro(arq.name)}`;
      const { error } = await db.storage.from(BUCKET_ANEXOS).upload(caminho, arq, { contentType: arq.type || undefined });
      if (error) {
        toast.error(`Não consegui enviar "${arq.name}".`);
      } else {
        const { error: e2 } = await db
          .from('marketing_anexos')
          .insert({ item_id: itemId, nome: arq.name, caminho, tipo: arq.type || null, tamanho: arq.size, enviado_por: user?.id });
        if (e2) toast.error(`"${arq.name}" subiu, mas não consegui registrar.`);
      }
      setEnviando((e) => e.filter((n) => n !== arq.name));
    }
    carregar();
  };

  const apagar = async (a: Anexo) => {
    if (!window.confirm(`Excluir "${a.nome}"?`)) return;
    setAnexos((l) => l.filter((x) => x.id !== a.id));
    await db.storage.from(BUCKET_ANEXOS).remove([a.caminho]);
    await db.from('marketing_anexos').delete().eq('id', a.id);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setSobre(true);
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSobre(false);
          enviar(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors',
          sobre ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40',
        )}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm">
          <span className="font-semibold text-primary">Clique para enviar</span> ou arraste os arquivos aqui
        </p>
        <p className="text-xs text-muted-foreground">PDF, Word, Excel, fotos e vídeos · até {LIMITE_MB} MB cada</p>
        <input ref={input} type="file" multiple className="hidden" onChange={(e) => e.target.files && enviar(e.target.files)} />
      </div>

      {(anexos.length > 0 || enviando.length > 0) && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {anexos.map((a) => {
            const tipo = tipoDoArquivo(a.nome, a.tipo);
            const Icone = ICONE[tipo];
            const url = links[a.id];
            return (
              <div key={a.id} className="group overflow-hidden rounded-lg border border-border bg-card">
                <button type="button" onClick={() => (tipo === 'imagem' || tipo === 'video' || tipo === 'pdf' ? setVendo(a) : url && window.open(url, '_blank'))} className="block w-full">
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
                    {tipo === 'imagem' && url ? (
                      <img src={url} alt={a.nome} className="h-full w-full object-cover" />
                    ) : tipo === 'video' && url ? (
                      <video src={`${url}#t=0.5`} className="h-full w-full object-cover" preload="metadata" muted />
                    ) : (
                      <Icone className="h-10 w-10" style={{ color: COR[tipo] }} />
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium" title={a.nome}>
                      {a.nome}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{tamanhoLegivel(a.tamanho)}</p>
                  </div>
                  {url && (
                    <a href={url} download={a.nome} target="_blank" rel="noreferrer" className="rounded p-1 hover:bg-muted" title="Baixar">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button type="button" onClick={() => apagar(a)} className="rounded p-1 opacity-0 hover:bg-muted group-hover:opacity-100" title="Excluir">
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
          {enviando.map((n) => (
            <div key={n} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="max-w-[90%] truncate">{n}</span>
            </div>
          ))}
        </div>
      )}

      {/* Visualizador */}
      {vendo && links[vendo.id] && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/90" onClick={() => setVendo(null)}>
          <div className="flex items-center gap-3 px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
            <span className="min-w-0 flex-1 truncate text-sm">{vendo.nome}</span>
            <a href={links[vendo.id]} download={vendo.nome} target="_blank" rel="noreferrer" className="rounded p-2 hover:bg-white/10" title="Baixar">
              <Download className="h-5 w-5" />
            </a>
            <button type="button" onClick={() => setVendo(null)} className="rounded p-2 hover:bg-white/10" title="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            {tipoDoArquivo(vendo.nome, vendo.tipo) === 'imagem' && <img src={links[vendo.id]} alt={vendo.nome} className="max-h-full max-w-full object-contain" />}
            {tipoDoArquivo(vendo.nome, vendo.tipo) === 'video' && <video src={links[vendo.id]} controls autoPlay className="max-h-full max-w-full" />}
            {tipoDoArquivo(vendo.nome, vendo.tipo) === 'pdf' && <iframe src={links[vendo.id]} title={vendo.nome} className="h-full w-full max-w-5xl rounded bg-white" />}
          </div>
        </div>
      )}
    </div>
  );
}
