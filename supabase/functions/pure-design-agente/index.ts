// O agente do Pure Design: conversa com o franqueado e PREENCHE um modelo pronto.
//
// POR QUE PREENCHER, E NÃO MONTAR (decisão de 16/11/2026): o Pure GPT montava a
// arte do zero (fundo + textos + formas em %), e a qualidade ficava presa ao que
// dava para descrever em JSON. Os modelos do Pure Design já são peças desenhadas
// pelo time, com layout, fonte e cor certos. O agente agora só faz o que um
// atendente faria: entende o pedido, escolhe o modelo que mais combina (com
// moldura se veio foto, só texto se não veio) e escreve o texto de cada campo.
// Quem desenha continua sendo o editor do Pure Design, no navegador — e a pessoa
// ainda pode ajustar tudo à mão antes de baixar.
//
// O catálogo de modelos viaja no pedido (ele mora em src/data/pureDesignTemplates.ts,
// junto do HTML de cada modelo). Aqui ficam só o tom de voz e as regras do agente,
// fora do alcance de quem escreve o pedido.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

// Mesma chave e mesmo modelo do Pure GPT: é o mesmo agente, com outra ferramenta.
const GEMINI_API_KEY = Deno.env.get('PURE_GPT_GEMINI_KEY') || Deno.env.get('GEMINI_API_KEY')
const MODELO = Deno.env.get('PURE_GPT_MODELO') || 'gemini-3.8-flash'

interface Mensagem {
  autor: 'pessoa' | 'pure'
  texto: string
}

interface CampoDoModelo {
  id: string
  rotulo: string
  tipo: 'texto' | 'texto-longo' | 'foto'
  limite?: number
  exemplo?: string
}

interface ModeloDoCatalogo {
  id: string
  nome: string
  categoria: string
  /** Modelo genérico, para quando nenhum específico combinar com o pedido. */
  coringa?: boolean
  campos: CampoDoModelo[]
  /** Partes que o agente não preenche (tabela de preços, lista de datas): a pessoa ajusta no editor. */
  observacao?: string
}

/** A única ferramenta do agente: dizer qual modelo usar e o que vai em cada campo. */
const FERRAMENTA = {
  name: 'preencher_modelo',
  description: 'Escolhe um modelo do Pure Design e preenche os campos dele com o texto e as fotos do pedido.',
  parameters: {
    type: 'object',
    properties: {
      modelo: { type: 'string', description: 'O id de um dos modelos do catálogo.' },
      textos: {
        type: 'array',
        description: 'Um item por campo de texto do modelo escolhido. Respeite o limite de caracteres de cada um.',
        items: {
          type: 'object',
          properties: {
            campo: { type: 'string', description: 'O id do campo.' },
            valor: { type: 'string', description: 'O texto que vai no campo.' },
          },
          required: ['campo', 'valor'],
        },
      },
      fotos: {
        type: 'array',
        description: 'Quais fotos enviadas entram em quais campos de foto. A primeira foto enviada é a 0.',
        items: {
          type: 'object',
          properties: {
            campo: { type: 'string', description: 'O id do campo de foto.' },
            foto: { type: 'number', description: 'O número da foto enviada.' },
          },
          required: ['campo', 'foto'],
        },
      },
      resposta: {
        type: 'string',
        description: 'Uma ou duas frases curtas para a pessoa: qual modelo você usou e o que ela pode ajustar no editor.',
      },
    },
    required: ['modelo', 'textos', 'resposta'],
  },
}

const TOM_DA_MARCA = `# Como escrever para a Pure Pilates

- Português do Brasil, acolhedor, próximo e direto. Frases curtas.
- A Pure fala de "a melhor hora do seu dia", de cuidado, constância e bem-estar.
- Nada de promessa de resultado rápido, emagrecimento ou comparação de corpo.
- Nada de preço inventado, desconto inventado ou data inventada.
- Use o nome das pessoas e da unidade exatamente como a pessoa escreveu.
- Respeite o limite de caracteres de cada campo: texto que estoura quebra o layout.
- Emojis só se a pessoa pedir.`

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'método não aceito' }, 405)
  if (!GEMINI_API_KEY) {
    console.error('[pure-design-agente] GEMINI_API_KEY ausente')
    return responder({ erro: 'o assistente está sem configuração de modelo' }, 503)
  }

  const auth = req.headers.get('Authorization') ?? ''
  const comoUsuario = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: { user } } = await comoUsuario.auth.getUser()
  if (!user) return responder({ erro: 'entre no Hub para usar o assistente' }, 401)

  let mensagens: Mensagem[] = []
  let modelos: ModeloDoCatalogo[] = []
  let fotos = 0
  try {
    const corpo = await req.json()
    mensagens = Array.isArray(corpo?.mensagens) ? corpo.mensagens.slice(-12) : []
    modelos = Array.isArray(corpo?.modelos) ? corpo.modelos.slice(0, 80) : []
    fotos = Number(corpo?.fotos) || 0
  } catch {
    return responder({ erro: 'pedido malformado' }, 400)
  }
  if (!mensagens.length) return responder({ erro: 'nada a responder' }, 400)
  if (!modelos.length) return responder({ erro: 'o catálogo de modelos não chegou' }, 400)

  const catalogo = modelos.map((m) => {
    const fotosNoModelo = m.campos.filter((c) => c.tipo === 'foto').length
    const linhas = [
      `## ${m.id} — ${m.nome} (${m.categoria}) · ${fotosNoModelo ? `${fotosNoModelo} foto(s)` : 'só texto, sem foto'}${m.coringa ? ' · CORINGA' : ''}`,
      ...m.campos.map(
        (c) =>
          `- ${c.id}: ${c.rotulo} [${c.tipo}${c.limite ? `, até ${c.limite} caracteres` : ''}]` +
          (c.tipo !== 'foto' && c.exemplo ? ` — exemplo: "${c.exemplo.slice(0, 160)}"` : ''),
      ),
    ]
    if (m.observacao) linhas.push(`- Obs.: ${m.observacao}`)
    return linhas.join('\n')
  })

  const instrucao = [
    'Você é o assistente de artes do Pure Design, da Pure Pilates. Você ajuda franqueados a criar artes',
    'PREENCHENDO modelos prontos da marca — você não desenha nada, só escolhe o modelo e escreve os textos.',
    'Converse em português do Brasil, com poucas palavras e sem formalidade.',
    '',
    'Como agir:',
    '1. Entenda que arte a pessoa quer e escolha o modelo do catálogo que mais combina.',
    '2. ANTES de escolher o modelo, confirme a foto. Se a pessoa ainda não anexou nenhuma foto e não disse',
    '   se quer foto, pergunte primeiro, de forma simpática e curta, por exemplo:',
    '   "Oi! Você quer a arte de Natal com foto ou sem foto? Se for com foto, é só anexar aqui no clipe."',
    '   Se ela anexou foto(s), use um modelo com o mesmo número de fotos e coloque cada foto num campo.',
    '   Se ela disse que é sem foto, use um modelo só de texto. Não pergunte de novo o que ela já respondeu.',
    '3. Se faltar algo essencial que você não pode inventar (nome da pessoa, nome da unidade, data,',
    '   horário, telefone), faça UMA pergunta curta em vez de chamar a ferramenta.',
    '4. Quando tiver o suficiente, chame preencher_modelo. Preencha TODOS os campos de texto do modelo:',
    '   o que a pessoa não disse e não for informação factual, escreva você, no tom da marca.',
    '   Informação factual que a pessoa não deu (telefone, endereço, e-mail): mantenha o exemplo do campo.',
    '5. Modelos marcados CORINGA servem para qualquer assunto. Se nenhum modelo específico combinar com o',
    '   pedido (Natal, Black Friday, aula aberta, boas-vindas…), use um CORINGA: escreva título e texto para',
    '   o tema pedido, no tom da marca. Prefira sempre o modelo específico quando ele existir.',
    '   Com o coringa valem as mesmas regras: nada de desconto, preço ou data que a pessoa não deu.',
    '6. Só diga que não dá quando o pedido não for uma arte, ou se não houver coringa no catálogo.',
    'Você só cria artes a partir destes modelos: se pedirem outra coisa, diga isso em uma linha.',
    '',
    fotos
      ? `A pessoa já enviou ${fotos} foto(s) nesta conversa, numeradas a partir de 0.`
      : 'A pessoa não enviou nenhuma foto até agora.',
    '',
    '# Catálogo de modelos',
    ...catalogo,
    '',
    TOM_DA_MARCA,
  ].join('\n')

  const contents = mensagens.map((m) => ({
    role: m.autor === 'pessoa' ? 'user' : 'model',
    parts: [{ text: m.texto }],
  }))

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: instrucao }] },
          tools: [{ functionDeclarations: [FERRAMENTA] }],
        }),
      },
    )
    if (!r.ok) {
      const detalhe = (await r.text()).slice(0, 400)
      console.error(`[pure-design-agente] modelo respondeu ${r.status}: ${detalhe}`)
      if (r.status === 403 || r.status === 401) throw new Error('chave do modelo recusada')
      throw new Error('o assistente não respondeu')
    }
    const resposta = await r.json()
    const partes = resposta?.candidates?.[0]?.content?.parts ?? []
    const chamada = partes.find((p: Record<string, unknown>) => p.functionCall)?.functionCall
    const texto = partes.map((p: { text?: string }) => p.text).filter(Boolean).join('\n').trim()

    // Sem chamada de ferramenta é conversa: pergunta de volta, recusa, ajuste.
    if (!chamada) return responder({ texto: texto || 'Não entendi; pode escrever de outro jeito?' })

    const args = chamada.args ?? {}
    const modelo = modelos.find((m) => m.id === args.modelo)
    if (!modelo) return responder({ texto: texto || 'Não achei um modelo para esse pedido; pode detalhar?' })

    // Só passam campos que existem no modelo, cortados no limite de cada um.
    const textos: Record<string, string> = {}
    for (const t of Array.isArray(args.textos) ? args.textos : []) {
      const campo = modelo.campos.find((c) => c.id === t?.campo && c.tipo !== 'foto')
      if (!campo || typeof t.valor !== 'string') continue
      textos[campo.id] = campo.limite ? t.valor.slice(0, campo.limite) : t.valor
    }
    const fotosNosCampos: Record<string, number> = {}
    for (const f of Array.isArray(args.fotos) ? args.fotos : []) {
      const campo = modelo.campos.find((c) => c.id === f?.campo && c.tipo === 'foto')
      const n = Number(f?.foto)
      if (campo && Number.isInteger(n) && n >= 0 && n < fotos) fotosNosCampos[campo.id] = n
    }

    // Registra o uso: é com isto que a rede mede quem usa e o quê. A falha aqui
    // não tira a arte de quem pediu.
    try {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
      })
      await admin.from('pure_gpt_geracoes').insert({
        user_id: user.id,
        unidade: null,
        prompt: mensagens[mensagens.length - 1]?.texto?.slice(0, 2000) ?? '',
        proporcao: `pure-design:${modelo.id}`.slice(0, 60),
        tentativas: 1,
        aprovada: true,
      })
    } catch (e) {
      console.error('[pure-design-agente] não consegui registrar o uso:', e)
    }

    return responder({
      texto: String(args.resposta || texto || 'Prontinho! Confira e ajuste o que quiser no editor.'),
      preenchimento: { modelo: modelo.id, textos, fotos: fotosNosCampos },
    })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'algo deu errado'
    return responder({ erro: mensagem }, 502)
  }
})
