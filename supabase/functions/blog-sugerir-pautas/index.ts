// Blog da Pure: sugere as pautas do mês para o planejamento.
//
// Segue o calendário: só sugere de hoje em diante (fuso de São Paulo). Dia que
// já passou não recebe pauta, e mês passado não recebe nenhuma.
//
// Preenche só os dias que ainda não têm artigo nenhum (em qualquer etapa), um
// artigo por dia, revezando Studios, Academy e Franchising (marcas.ts). Clicar
// de novo depois de excluir sugestões preenche só os buracos. Com `dias`, sugere
// apenas para esses dias (o botão "Acrescentar" usa assim).
//
// As sugestões são gravadas como 'sugestao' em blog_artigos e só viram texto
// quando o time aprova o lote (a fila da function blog-produzir).

import { getCorsHeaders } from '../_shared/cors.ts'
import { clienteAdmin, usuarioDoTime } from '../blog-gerar-artigo/acesso.ts'
import { montarContexto, pedirJson, temChaveDoGemini } from '../blog-gerar-artigo/escrita.ts'
import { MARCAS, diasDoMes, diasPlanejaveis, ehMarca, marcaDoDia, type Marca } from '../blog-gerar-artigo/marcas.ts'

const PUBLICO_DA_MARCA: Record<Marca, string> = { studios: 'alunos', academy: 'profissionais', franchising: 'investidores' }

const FORMATO = {
  type: 'object',
  properties: {
    sugestoes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          data: { type: 'string', description: 'O dia da pauta, no formato AAAA-MM-DD, exatamente como na lista.' },
          tema: { type: 'string', description: 'O tema do artigo, numa frase clara.' },
          palavra_chave: { type: 'string', description: 'A palavra-chave principal, como as pessoas buscam no Google.' },
          categoria: { type: 'string', description: 'Uma das categorias permitidas para a marca do dia.' },
          observacoes: { type: 'string', description: 'O ângulo do artigo em uma ou duas frases, para quem vai escrever.' },
        },
        required: ['data', 'tema', 'palavra_chave', 'categoria', 'observacoes'],
      },
    },
  },
  required: ['sugestoes'],
}

const INSTRUCAO = `Você é o editor de pauta do blog da Pure Pilates (blog.purepilates.com.br).
Seu trabalho é sugerir temas de artigos com potencial real de busca no Google, em português do Brasil.

Regras da pauta:
- Um tema por dia da lista, sempre adequado à marca daquele dia.
- Studios: temas para alunos e possíveis alunos (bem-estar, dores, postura, rotina, exercícios, públicos específicos).
- Academy: temas técnicos que mostram autoridade no mundo do Pilates e falam com instrutores, fisioterapeutas e estudantes.
- Franchising: temas de negócio para quem pensa em abrir uma franquia de Pilates. Nunca prometa faturamento ou retorno.
- A palavra-chave é uma expressão que as pessoas realmente buscam, de preferência de cauda longa (três a cinco palavras).
- Escreva tema e palavra-chave em português correto, com acentos, cedilha e hífen. Nunca sem acento.
- Não repita nem parafraseie títulos que já existem no blog ou no Hub (lista abaixo). Varie os assuntos ao longo do mês.
- Aproveite datas e estações do mês no Brasil quando fizer sentido, sem forçar.
- JAMAIS sugira tema sobre aula grátis, gratuita, desconto, preço ou promoção.
- Fatos sobre a Pure só do contexto oficial abaixo. Não invente cursos, números nem novidades.
- Nunca use travessão.`

/** Títulos que já existem no blog do WordPress. Falhar aqui não impede a pauta. */
async function titulosDoBlog(): Promise<string[]> {
  const titulos: string[] = []
  for (const pagina of [1, 2, 3]) {
    try {
      const r = await fetch(
        `https://blog.purepilates.com.br/wp-json/wp/v2/posts?per_page=100&page=${pagina}&_fields=title`,
        { signal: AbortSignal.timeout(15_000) },
      )
      if (!r.ok) break
      const posts = (await r.json()) as { title: { rendered: string } }[]
      titulos.push(...posts.map((p) => p.title.rendered.replace(/&#8211;|&#8212;/g, '-').replace(/&[#a-z0-9]+;/gi, '')))
      if (posts.length < 100) break
    } catch {
      break
    }
  }
  return titulos
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'método não aceito' }, 405)
  if (!temChaveDoGemini()) return responder({ erro: 'o Blog da Pure está sem configuração de modelo' }, 503)

  const acesso = await usuarioDoTime(req)
  if ('erro' in acesso) return responder({ erro: acesso.erro }, acesso.status)

  let mes = ''
  let diasPedidos: string[] = []
  let marcaPedida: Marca | null = null
  try {
    const corpo = await req.json()
    mes = String(corpo?.mes ?? '')
    diasPedidos = Array.isArray(corpo?.dias) ? corpo.dias.map(String) : []
    if (ehMarca(corpo?.marca)) marcaPedida = corpo.marca
  } catch {
    return responder({ erro: 'pedido malformado' }, 400)
  }
  if (!/^\d{4}-\d{2}$/.test(mes)) return responder({ erro: 'mês inválido' }, 400)

  const admin = clienteAdmin()
  const todos = diasDoMes(mes)

  // Dias livres: sem artigo nenhum, em qualquer etapa.
  const { data: doMes, error } = await admin
    .from('blog_artigos')
    .select('data_prevista')
    .gte('data_prevista', todos[0])
    .lte('data_prevista', todos[todos.length - 1])
  if (error) return responder({ erro: 'não consegui ler o planejamento do mês' }, 500)
  const ocupados = new Set((doMes ?? []).map((a) => a.data_prevista))

  // Com `dias`, o time escolheu os dias, inclusive um já ocupado (dois artigos no mesmo dia).
  const planejaveis = diasPlanejaveis(mes)
  if (!planejaveis.length) return responder({ erro: 'esse mês já passou' }, 400)
  const dias = diasPedidos.length
    ? diasPedidos.filter((d) => planejaveis.includes(d))
    : planejaveis.filter((d) => !ocupados.has(d))
  if (!dias.length) {
    return diasPedidos.length
      ? responder({ erro: 'esse dia já passou; escolha de hoje em diante' }, 400)
      : responder({ sugestoes: [], mensagem: 'todos os dias de hoje até o fim do mês já têm pauta' })
  }
  const vagas = dias.map((data) => ({ data, marca: marcaPedida ?? marcaDoDia(data) }))

  const [contextos, blog, { data: doHub }] = await Promise.all([
    Promise.all((['studios', 'academy', 'franchising'] as Marca[]).map((m) => montarContexto(admin, m, false))),
    titulosDoBlog(),
    admin.from('blog_artigos').select('titulo, tema').order('created_at', { ascending: false }).limit(300),
  ])
  const existentes = [...blog, ...(doHub ?? []).map((a) => a.titulo || a.tema)].filter(Boolean)

  const tarefa = [
    `Sugira as pautas destes ${vagas.length} dias de ${mes}:`,
    ...vagas.map((v) => `- ${v.data}: ${MARCAS[v.marca].nome} (categorias permitidas: ${MARCAS[v.marca].categorias.join(', ')})`),
    '',
    '# TÍTULOS QUE JÁ EXISTEM (não repetir)',
    ...existentes.slice(0, 500).map((t) => `- ${t}`),
  ].join('\n')

  const instrucao = [
    INSTRUCAO,
    '',
    '# CONTEXTO E APRENDIZADOS POR MARCA',
    ...contextos.map((c, i) => `\n## Marca: ${MARCAS[(['studios', 'academy', 'franchising'] as Marca[])[i]].nome}\n${c}`),
  ].join('\n')

  try {
    const { sugestoes } = await pedirJson<{ sugestoes: Record<string, string>[] }>({
      instrucao,
      tarefa,
      formato: FORMATO,
      temperatura: 0.9,
      pesquisar: true,
    })

    const porDia = new Map(vagas.map((v) => [v.data, v.marca]))
    const linhas = (sugestoes ?? [])
      .filter((s) => porDia.has(s.data) && String(s.tema ?? '').trim().length > 2)
      .map((s) => {
        const marca = porDia.get(s.data)!
        porDia.delete(s.data) // um por dia: ignora repetidos
        const categoria = MARCAS[marca].categorias.includes(s.categoria) ? s.categoria : MARCAS[marca].categorias[0]
        return {
          status: 'sugestao',
          data_prevista: s.data,
          marca,
          publico: PUBLICO_DA_MARCA[marca],
          tamanho: 'medio',
          tema: String(s.tema).replace(/\s*—\s*/g, ', ').trim().slice(0, 300),
          palavra_chave: String(s.palavra_chave ?? '').trim().slice(0, 120) || null,
          categoria,
          observacoes: String(s.observacoes ?? '').replace(/\s*—\s*/g, ', ').trim().slice(0, 2000) || null,
          criado_por: acesso.user.id,
        }
      })
    if (!linhas.length) throw new Error('o Gemini não devolveu nenhuma sugestão; tente de novo')

    const { data: gravadas, error: erroGravar } = await admin.from('blog_artigos').insert(linhas).select('*')
    if (erroGravar) {
      console.error('[blog] não consegui gravar as sugestões:', erroGravar)
      throw new Error('as sugestões foram criadas, mas não consegui salvar')
    }
    return responder({ sugestoes: gravadas, faltaram: [...porDia.keys()] })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'algo deu errado'
    return responder({ erro: mensagem }, 502)
  }
})
