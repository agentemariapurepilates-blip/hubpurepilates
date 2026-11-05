import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from '@/integrations/supabase/client';
import { CapaBlog, LARGURA_CAPA, type CapaBlogHandle } from './CapaBlog';
import { MARCAS, type ArtigoBlog } from './blogTipos';

// Aprovado vai direto para a agenda do WordPress (pedido de 05/11/2026).
//
// A capa final (foto + título) é montada AQUI, no navegador, com o mesmo
// componente que o time vê no editor: o servidor não tem navegador para isso.
// A imagem pronta vai para a function blog-agendar, que cria o post agendado.

type DadosDaCapa = Pick<ArtigoBlog, 'marca' | 'titulo' | 'tema' | 'categoria' | 'foto_url'>;

const ESPERA_MAXIMA = 20_000;

/** Monta a capa fora da tela e devolve o JPEG, no tamanho real. */
export async function gerarJpegDaCapa(a: DadosDaCapa): Promise<Blob> {
  if (!a.foto_url) throw new Error('a foto da capa ainda não está pronta');
  const palco = document.createElement('div');
  palco.style.cssText = `position:fixed;left:-${LARGURA_CAPA * 3}px;top:0;width:${LARGURA_CAPA}px;pointer-events:none;`;
  document.body.appendChild(palco);
  const raiz = createRoot(palco);
  const ref = createRef<CapaBlogHandle>();
  try {
    await new Promise<void>((pronto, falhou) => {
      const limite = setTimeout(() => falhou(new Error('a capa demorou demais para carregar')), ESPERA_MAXIMA);
      raiz.render(
        <CapaBlog
          ref={ref}
          marca={a.marca}
          titulo={a.titulo || a.tema}
          etiqueta={a.categoria ?? MARCAS[a.marca]?.nome ?? 'Blog Pure Pilates'}
          fotoUrl={a.foto_url}
          onPronto={() => {
            clearTimeout(limite);
            pronto();
          }}
        />,
      );
    });
    // Um quadro a mais para o navegador pintar o título no tamanho final.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    return await ref.current!.gerarJpeg();
  } finally {
    raiz.unmount();
    palco.remove();
  }
}

const paraBase64 = (blob: Blob) =>
  new Promise<string>((pronto, falhou) => {
    const leitor = new FileReader();
    leitor.onload = () => pronto(String(leitor.result).split(',')[1] ?? '');
    leitor.onerror = () => falhou(new Error('não consegui ler a imagem da capa'));
    leitor.readAsDataURL(blob);
  });

async function chamarAgendar(body: unknown) {
  const { data, error } = await supabase.functions.invoke('blog-agendar', { body });
  if (error) {
    const resposta = (error as { context?: Response }).context;
    if (resposta?.status === 404) throw new Error('a função blog-agendar ainda não está publicada');
    let motivo = '';
    try {
      motivo = (await resposta?.json())?.erro ?? '';
    } catch {
      /* sem corpo legível */
    }
    throw new Error(motivo || 'não consegui falar com o WordPress');
  }
  if (data?.erro) throw new Error(data.erro);
  return data as { ok: true; agendado_para: string; adiado: boolean };
}

/** Agenda um artigo aprovado: monta a capa e cria o post agendado no blog. */
export async function agendarArtigo(id: string) {
  const { data, error } = await supabase.from('blog_artigos').select('marca, titulo, tema, categoria, foto_url').eq('id', id).maybeSingle();
  if (error || !data) throw new Error('não encontrei o artigo');
  const jpeg = await gerarJpegDaCapa(data as DadosDaCapa);
  return chamarAgendar({ id, capa: await paraBase64(jpeg), tipoCapa: 'image/jpeg' });
}

/** Tira o post da agenda do WordPress e devolve o artigo para edição. */
export const desagendarArtigo = (id: string) => chamarAgendar({ id, acao: 'desagendar' });

/**
 * Agenda vários, três ao mesmo tempo. Nunca lança: devolve quantos deram certo
 * e o motivo de cada um que falhou, para a tela contar ao time.
 */
export async function agendarVarios(ids: string[], aoAvancar?: (feitos: number, total: number) => void) {
  const falhas: { id: string; motivo: string }[] = [];
  let feitos = 0;
  const fila = [...ids];
  const trabalhar = async () => {
    for (let id = fila.shift(); id; id = fila.shift()) {
      try {
        await agendarArtigo(id);
      } catch (e) {
        falhas.push({ id, motivo: e instanceof Error ? e.message : 'falhou' });
      }
      feitos += 1;
      aoAvancar?.(feitos, ids.length);
    }
  };
  await Promise.all([trabalhar(), trabalhar(), trabalhar()]);
  return { agendados: ids.length - falhas.length, falhas };
}
