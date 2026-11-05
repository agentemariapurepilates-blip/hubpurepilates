// Núcleo da escrita do Blog da Pure, usado por três functions:
//   blog-gerar-artigo  (artigo avulso e "Ajustar com o Gemini")
//   blog-sugerir-pautas (sugestões do mês)
//   blog-produzir       (fila da produção mensal, chamada pelo cron)
//
// A "memória" do Gemini mora aqui. Ele não aprende sozinho entre uma chamada e
// outra; então cada pedido leva junto, montado do banco:
//   1. o contexto oficial da marca (blog_contextos, editado pelo time no Hub);
//   2. os aprendizados do time (blog_aprendizados, salvos a cada ajuste pedido);
//   3. os últimos artigos aprovados da mesma marca, como exemplo de tom.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { REGRAS_DO_BLOG, TAMANHOS } from './regras-blog.ts'
import { conferirArtigo, criarSlug, escolherPalavraChave, limparHtml, tirarTravessao } from './texto.ts'
import { MARCAS, type Marca } from './marcas.ts'

// Chave própria do Blog (a instalada no computador da usuária, que foi testada
// com o modelo e a pesquisa no Google). Sem ela, usa a GEMINI_API_KEY do Hub.
const GEMINI_API_KEY = Deno.env.get('BLOG_GEMINI_KEY') || Deno.env.get('GEMINI_API_KEY')
const MODELO = Deno.env.get('BLOG_MODELO') || 'gemini-3.8-flash'

export const temChaveDoGemini = () => !!GEMINI_API_KEY
export const modeloDoBlog = () => MODELO

export interface Pauta {
  tema: string
  palavraChave?: string
  categoria?: string
  tamanho?: string
  observacoes?: string
}

export interface Artigo {
  palavra_chave: string
  titulo: string
  slug: string
  meta_descricao: string
  tags: string[]
  conteudo_html: string
  /** A cena da foto da capa, em inglês. Não vai para o texto do blog. */
  cena_foto?: string
}

const FORMATO_DO_ARTIGO = {
  type: 'object',
  properties: {
    palavra_chave: {
      type: 'string',
      description: 'A palavra-chave principal usada no artigo, exatamente como aparece no texto.',
    },
    titulo: { type: 'string', description: 'Título do post, até 60 caracteres.' },
    slug: {
      type: 'string',
      description: 'Endereço do post: minúsculas, sem acento, palavras separadas por hífen, até 6 palavras.',
    },
    meta_descricao: {
      type: 'string',
      description: 'Descrição para o Google, entre 140 e 160 caracteres, com a palavra-chave.',
    },
    tags: { type: 'array', items: { type: 'string' }, description: 'De 3 a 6 tags curtas, em minúsculas.' },
    conteudo_html: { type: 'string', description: 'O artigo em HTML simples, seguindo as regras.' },
    cena_foto: {
      type: 'string',
      description:
        'Em INGLÊS, de 2 a 3 frases: uma cena fotográfica realista que ilustra o artigo para a capa. Quem aparece (brasileiros, idade, roupa), o que está fazendo e com qual aparelho de Pilates. Sem texto, telas legíveis ou logotipos na cena.',
    },
  },
  required: ['palavra_chave', 'titulo', 'slug', 'meta_descricao', 'tags', 'conteudo_html', 'cena_foto'],
}

const semTags = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * Monta o "projeto" da marca: contexto oficial, aprendizados e exemplos. Uma
 * falha aqui não impede a escrita: sem banco, o Gemini segue só com as regras.
 */
export async function montarContexto(admin: SupabaseClient, marca: Marca, comExemplos = true): Promise<string> {
  const partes: string[] = []
  try {
    const [{ data: contextos }, { data: aprendizados }, { data: exemplos }] = await Promise.all([
      admin.from('blog_contextos').select('chave, conteudo').in('chave', ['geral', marca]),
      admin
        .from('blog_aprendizados')
        .select('texto, marca')
        .or(`marca.is.null,marca.eq.${marca}`)
        .order('created_at', { ascending: false })
        .limit(25),
      comExemplos
        ? admin
            .from('blog_artigos')
            .select('titulo, conteudo_html')
            .eq('marca', marca)
            .in('status', ['aprovado', 'publicado'])
            .order('revisado_em', { ascending: false, nullsFirst: false })
            .limit(2)
        : Promise.resolve({ data: [] }),
    ])

    const porChave = Object.fromEntries((contextos ?? []).map((c) => [c.chave, c.conteudo]))
    partes.push(
      '# CONTEXTO OFICIAL DA PURE',
      'É a única fonte de fatos sobre a Pure Pilates. O que não estiver aqui, não afirme.',
      '',
      porChave.geral ?? '',
      '',
      porChave[marca] ?? '',
    )

    if (aprendizados?.length) {
      partes.push(
        '',
        '# APRENDIZADOS DO TIME DE MARKETING',
        'Correções que o time já pediu em artigos anteriores. Siga todas.',
        ...aprendizados.map((a) => `- ${a.texto}`),
      )
    }

    if (exemplos?.length) {
      partes.push(
        '',
        '# EXEMPLOS APROVADOS PELO TIME',
        'Artigos desta marca que o time aprovou. Use como referência de tom e estrutura, sem copiar.',
        ...exemplos.map((e) => `## ${e.titulo}\n${semTags(e.conteudo_html).slice(0, 1500)}...`),
      )
    }
  } catch (e) {
    console.error('[blog] não consegui montar o contexto; sigo só com as regras:', e)
  }
  return partes.join('\n')
}

/** Uma chamada ao Gemini que devolve JSON no formato pedido. */
export async function pedirJson<T>(opcoes: {
  instrucao: string
  tarefa: string
  formato: Record<string, unknown>
  temperatura: number
  pesquisar?: boolean
}): Promise<T> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opcoes.instrucao }] },
        contents: [{ role: 'user', parts: [{ text: opcoes.tarefa }] }],
        ...(opcoes.pesquisar ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: {
          temperature: opcoes.temperatura,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseSchema: opcoes.formato,
        },
      }),
    },
  )
  if (!r.ok) {
    const detalhe = (await r.text()).slice(0, 400)
    console.error(`[blog] modelo respondeu ${r.status}: ${detalhe}`)
    // O motivo do Gemini vai junto para a tela. Em 05/11/2026 a primeira versão
    // dizia só "não conseguiu" e ninguém sabia se era chave, modelo ou formato.
    const motivo = (() => {
      try {
        return String(JSON.parse(detalhe)?.error?.message ?? '').slice(0, 160)
      } catch {
        return ''
      }
    })()
    if (r.status === 429) throw new Error('o Gemini está no limite de uso agora; tente de novo em alguns minutos')
    if (r.status === 401 || r.status === 403) throw new Error(`a chave do Gemini foi recusada${motivo ? `: ${motivo}` : ''}`)
    throw new Error(`o Gemini recusou o pedido (${r.status})${motivo ? `: ${motivo}` : ''}`)
  }
  const resposta = await r.json()
  const texto = (resposta?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('')
  try {
    return JSON.parse(texto) as T
  } catch {
    console.error('[blog] resposta fora do formato:', texto.slice(0, 300))
    throw new Error('o Gemini devolveu a resposta fora do formato; tente de novo')
  }
}

const descreverPauta = (p: Pauta, marca: Marca) =>
  [
    `Marca: ${MARCAS[marca].nome}`,
    `Tema: ${p.tema}`,
    p.palavraChave ? `Palavra-chave principal: ${p.palavraChave}` : 'Palavra-chave principal: escolha a mais buscada para o tema.',
    p.categoria ? `Categoria do blog: ${p.categoria}` : '',
    `Para quem: ${MARCAS[marca].publico}`,
    `Tamanho: ${TAMANHOS[p.tamanho ?? 'medio'] ?? TAMANHOS.medio}.`,
    p.observacoes ? `Orientações do time de marketing: ${p.observacoes}` : '',
  ]
    .filter(Boolean)
    .join('\n')

async function pedirArtigo(instrucao: string, tarefa: string, temperatura: number, palavraDaPauta?: string): Promise<Artigo> {
  const bruto = await pedirJson<Partial<Artigo>>({ instrucao, tarefa, formato: FORMATO_DO_ARTIGO, temperatura, pesquisar: true })
  const conteudo = limparHtml(String(bruto.conteudo_html ?? ''))
  if (conteudo.length < 200) throw new Error('o artigo veio vazio; tente de novo')
  const titulo = tirarTravessao(limparHtml(String(bruto.titulo ?? '')))
  return {
    palavra_chave: escolherPalavraChave(palavraDaPauta, String(bruto.palavra_chave ?? '')),
    titulo,
    slug: criarSlug(String(bruto.slug || titulo)),
    meta_descricao: tirarTravessao(limparHtml(String(bruto.meta_descricao ?? ''))),
    tags: (Array.isArray(bruto.tags) ? bruto.tags : []).map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6),
    conteudo_html: conteudo,
    cena_foto: String(bruto.cena_foto ?? '').trim().slice(0, 1000),
  }
}

/**
 * Escreve um artigo novo, ou reescreve um existente seguindo um pedido de
 * ajuste, e confere as regras obrigatórias de SEO. Se faltou alguma, o artigo
 * volta UMA vez para o Gemini corrigir; fica a versão com menos problemas, e o
 * que sobrar vai em `avisos`.
 */
export async function escreverArtigo(
  admin: SupabaseClient,
  opcoes: { pauta: Pauta; marca: Marca; artigoAtual?: Artigo | null; pedido?: string },
): Promise<{ artigo: Artigo; avisos: string[] }> {
  const { pauta, marca, artigoAtual, pedido } = opcoes
  const inicio = Date.now()
  const instrucao = [REGRAS_DO_BLOG, '', await montarContexto(admin, marca)].join('\n')
  const palavra = pauta.palavraChave || artigoAtual?.palavra_chave

  const tarefa = artigoAtual
    ? [
        'Reescreva o artigo abaixo seguindo o pedido de ajuste. Mantenha o que não foi pedido para mudar.',
        'Devolva o artigo completo, não só o trecho alterado.',
        '',
        '## Pauta original',
        descreverPauta(pauta, marca),
        '',
        '## Pedido de ajuste',
        pedido ?? '',
        '',
        '## Artigo atual',
        JSON.stringify(artigoAtual),
      ].join('\n')
    : ['Escreva um artigo novo para o blog a partir desta pauta.', '', descreverPauta(pauta, marca)].join('\n')

  let artigo = await pedirArtigo(instrucao, tarefa, artigoAtual ? 0.5 : 0.8, palavra)
  let avisos = conferirArtigo(artigo, artigo.palavra_chave)

  // A function tem limite de tempo no Supabase. Se a primeira escrita já
  // demorou muito, não há tempo seguro para a correção: as pendências vão
  // como aviso para o time resolver no editor.
  if (avisos.length && Date.now() - inicio < 70_000) {
    const correcao = [
      'O artigo abaixo NÃO cumpre estas regras obrigatórias do blog:',
      ...avisos.map((a) => `- ${a}`),
      '',
      'Corrija todos os itens sem piorar o resto e devolva o artigo completo.',
      '',
      '## Pauta',
      descreverPauta(pauta, marca),
      '',
      '## Artigo',
      JSON.stringify(artigo),
    ].join('\n')
    try {
      const corrigido = await pedirArtigo(instrucao, correcao, 0.4, palavra || artigo.palavra_chave)
      const avisosCorrigido = conferirArtigo(corrigido, corrigido.palavra_chave)
      if (avisosCorrigido.length < avisos.length) {
        artigo = corrigido
        avisos = avisosCorrigido
      }
    } catch (e) {
      console.error('[blog] a rodada de correção falhou; fica a primeira versão:', e)
    }
  }
  return { artigo, avisos }
}
