// O agente do Pure GPT: conversa com o franqueado e MONTA a arte que ele pediu.
//
// POR QUE MONTAR, E NÃO GERAR (decisão de 19/10/2026): testamos quatro modelos
// de imagem grátis. Todos erravam onde mais dói numa peça de marca — acento no
// título, logotipo cortado ou recolorido, cor fora da paleta, e um rosto
// inventado no lugar do instrutor de verdade. Nenhum ajuste de prompt resolveu.
//
// Então o agente parou de descrever uma imagem e passou a compor uma: ele
// escolhe um fundo pronto, escreve o texto, decide posição, peso e hierarquia,
// e devolve isso como JSON. Quem transforma em arte é o Hub, renderizando HTML
// (ver src/features/geral/pure-gpt/composicao.ts). O que sai é exatamente o que
// foi pedido, porque não há nada sendo adivinhado.
//
// As REGRAS DA MARCA continuam aqui, no servidor, fora do alcance de quem
// escreve o pedido.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'
import { REGRAS_DA_MARCA } from './regras-marca.ts'

// A chave do Pure GPT é própria: PURE_GPT_GEMINI_KEY. Sem ela, cai na
// GEMINI_API_KEY que o Hub já usa. São separadas de propósito — trocar a chave
// daqui não pode afetar o agente de design dos colaboradores, que depende da
// outra em seis functions.
const GEMINI_API_KEY = Deno.env.get('PURE_GPT_GEMINI_KEY') || Deno.env.get('GEMINI_API_KEY')
// O modelo fica em variável para trocar sem mexer em código.
const MODELO = Deno.env.get('PURE_GPT_MODELO') || 'gemini-3.8-flash'

interface Mensagem {
  autor: 'pessoa' | 'pure'
  texto: string
}

interface Fundo {
  id: string
  nome: string
  escuro: boolean
  limpo: boolean
}

const CORES = ['vermelho', 'grafite', 'cinza', 'laranja', 'branco', 'cinza-claro']
const FORMAS = ['petala', 'circulo', 'pilula', 'arco', 'meia-pilula', 'banner', 'canto', 'linha', 'retangulo']
const CANTOS = ['inferior-direito', 'inferior-esquerdo', 'superior-esquerdo', 'superior-direito']

/**
 * A única ferramenta do agente: devolver a arte montada.
 *
 * Tudo é descrito em POR CENTO da arte. O modelo acerta muito mais "o título
 * começa a 8% da esquerda" do que "em 86px", e a mesma composição serve a
 * qualquer formato que venha depois.
 */
const FERRAMENTA = {
  name: 'montar_arte',
  description:
    'Monta a arte pedida, escolhendo o fundo e posicionando textos, formas, molduras de foto e o logotipo.',
  parameters: {
    type: 'object',
    properties: {
      fundo: {
        type: 'string',
        description: 'O id de um dos fundos disponíveis, listado nas instruções.',
      },
      elementos: {
        type: 'array',
        description:
          'Os elementos da arte, de trás para frente: o que vem depois aparece por cima. Entre 2 e 8.',
        items: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              enum: ['texto', 'forma', 'moldura', 'logo'],
            },
            x: { type: 'number', description: 'Borda esquerda, em % da largura da arte (0 a 100).' },
            y: { type: 'number', description: 'Borda de cima, em % da altura da arte (0 a 100).' },
            largura: { type: 'number', description: 'Largura, em % da largura da arte.' },
            altura: {
              type: 'number',
              description:
                'Altura, em % da altura da arte. Obrigatória também no texto: é a caixa em que ele vive.',
            },

            texto: { type: 'string', description: 'Só para tipo=texto: o que vai escrito.' },
            tamanho: {
              type: 'number',
              description:
                'Só para texto: altura da letra em % da altura da arte. 2,5 é apoio; 5 é corpo; 9 a 13 é manchete.',
            },
            // Sem `enum` aqui de propósito: o schema de function calling do
            // Gemini só aceita enum em campo de texto, e um enum numérico faz a
            // chamada inteira voltar 400. Os valores aceitos vão na descrição, e
            // o renderizador cai no 700 se vier outro.
            peso: {
              type: 'number',
              description: 'Só para texto, e só 400, 700 ou 800: leve, negrito e manchete.',
            },
            alinhamento: { type: 'string', enum: ['left', 'center', 'right'] },
            italico: { type: 'boolean', description: 'Só para texto, e só para destacar uma palavra.' },
            maiusculas: { type: 'boolean' },
            espacamento: {
              type: 'number',
              description: 'Só para texto: espaço entre letras, em % do tamanho. Bom em título curto.',
            },

            cor: { type: 'string', enum: CORES, description: 'Cor do texto ou da forma.' },

            forma: {
              type: 'string',
              enum: FORMAS,
              description:
                'Para tipo=forma ou tipo=moldura. A petala é a forma-assinatura da Pure e a primeira escolha.',
            },
            preenchimento: {
              type: 'string',
              enum: ['cheia', 'contorno'],
              description: 'Só para forma. O contorno dá leveza sobre fundo colorido.',
            },
            canto: {
              type: 'string',
              enum: CANTOS,
              description: 'Só para forma: qual canto fica reto (ou de que lado fica o arco).',
            },
            opacidade: { type: 'number', description: 'Só para forma, de 0,05 a 1.' },

            fotos: {
              type: 'array',
              items: { type: 'number' },
              description:
                'Só para moldura: quais fotos enviadas entram, pelo número delas (a primeira é 0). De 1 a 3.',
            },
            borda: { type: 'string', enum: CORES, description: 'Só para moldura: contorno em volta.' },

            variante: {
              type: 'string',
              enum: ['completo', 'p'],
              description: 'Só para logo. A versão (positiva ou branca) o Hub escolhe pelo fundo.',
            },
          },
          required: ['tipo', 'x', 'y'],
        },
      },
      resposta: {
        type: 'string',
        description: 'Uma frase curta para a pessoa, contando o que você montou.',
      },
    },
    required: ['fundo', 'elementos', 'resposta'],
  },
}

/**
 * Como montar: o que o agente precisa saber sobre a tela em que a arte é
 * desenhada. As regras da MARCA vêm à parte, de regras-marca.ts — aqui é só o
 * manual da ferramenta.
 */
const COMO_MONTAR = `# Como montar a arte

A arte é 4:5 (retrato, formato de feed). Tudo é medido em POR CENTO: x e largura
sobre a largura da arte, y e altura sobre a altura.

## Ordem e respiro

- Os elementos são desenhados na ordem em que você os lista: o último fica por cima.
- Margem de respiro: nada começa antes de 7% nem passa de 93%, em nenhum lado.
- Entre 2 e 8 elementos. Menos é melhor.

## Texto — cada texto é uma CAIXA

Todo texto ocupa uma caixa: x, y, largura e **altura**. O texto nunca sai dela —
se não couber no tamanho pedido, o Hub encolhe a letra até caber. Então pense em
caixas, e não em linhas: você não tem como saber onde a frase vai quebrar.

- **Caixas não se sobrepõem.** Deixe pelo menos 2% de folga entre uma e a
  seguinte, e entre uma caixa e qualquer moldura ou logotipo.
- **A altura da caixa é, no mínimo, 1,2 vez o tamanho da letra POR LINHA.** Uma
  manchete no tamanho 12 que você quer em duas linhas pede altura 29; uma linha
  de apoio no tamanho 3 pede 3,6. Caixa apertada não corta o texto — faz a letra
  sair menor do que você pediu.
- Você é quem escreve o que vai na arte. A pessoa traz a ideia; a frase é sua,
  curta e no tom da Pure.
- Hierarquia: uma manchete (tamanho 9 a 13, peso 800) e, no máximo, dois apoios
  (tamanho 2,5 a 5, peso 400). Dois pesos na peça inteira, nunca três.
- Escreva a frase corrida, sem quebrar linha na mão: a caixa quebra sozinha.
- Sobre fundo escuro, texto branco; sobre fundo claro, grafite ou vermelho.
- Em título curto e em caixa alta, \`espacamento\` entre 2 e 8 dá acabamento.

## Formas

- Servem para destacar: uma pílula atrás de uma data, um banner atrás da frase
  principal, um círculo atrás de um número, uma linha sublinhando o título.
- Quando usar uma forma como fundo de texto, coloque a forma ANTES do texto na
  lista, e o texto por cima, com folga de pelo menos 2% de cada lado.
- Sobre o fundo liso, uma ou duas formas grandes em \`contorno\`, saindo pela
  borda, dão a cara da marca sem poluir.

## Molduras (quando há foto)

- Toda foto que a pessoa enviar entra numa moldura — nunca solta.
- Você passa UM elemento \`moldura\` com a área e a lista de fotos; o Hub divide a
  área em uma, duas ou três molduras conforme o número de fotos e varia o canto
  reto de cada uma. Não tente posicionar cada foto separadamente.
- Reserve uma área generosa: num 4:5, algo como 50% a 60% da altura.

## Logotipo

- Sempre um elemento \`logo\`, uma vez só, num canto, com largura entre 16% e 24%.
- Deixe em volta dele pelo menos 6% de arte livre, sem texto nem forma.
- A versão certa (positiva no claro, branca no escuro) o Hub aplica sozinho.`

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return responder({ erro: 'método não aceito' }, 405)
  if (!GEMINI_API_KEY) {
    console.error('[pure-gpt] GEMINI_API_KEY ausente')
    return responder({ erro: 'o Pure GPT está sem configuração de modelo' }, 503)
  }

  // Só quem está logado no Hub conversa.
  const auth = req.headers.get('Authorization') ?? ''
  const comoUsuario = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: { user } } = await comoUsuario.auth.getUser()
  if (!user) return responder({ erro: 'entre no Hub para usar o Pure GPT' }, 401)

  let mensagens: Mensagem[] = []
  let fundos: Fundo[] = []
  let fotos = 0
  try {
    const corpo = await req.json()
    mensagens = Array.isArray(corpo?.mensagens) ? corpo.mensagens.slice(-12) : []
    // O catálogo de fundos vem do Hub (composicao.ts) para não haver duas listas
    // para desencontrar: quem acrescentar um fundo lá não precisa lembrar daqui.
    fundos = Array.isArray(corpo?.fundos) ? corpo.fundos.slice(0, 20) : []
    fotos = Number(corpo?.fotos) || 0
  } catch {
    return responder({ erro: 'pedido malformado' }, 400)
  }
  if (!mensagens.length) return responder({ erro: 'nada a responder' }, 400)
  if (!fundos.length) return responder({ erro: 'a lista de fundos não chegou' }, 400)

  const instrucao = [
    'Você é o Pure GPT, que monta artes para as unidades da Pure Pilates.',
    'Converse em português do Brasil, com poucas palavras e sem formalidade.',
    'Quando tiver o suficiente para montar a arte, chame a ferramenta montar_arte.',
    'Se faltar algo essencial, faça UMA pergunta curta em vez de chamar a ferramenta.',
    'Você só sabe montar artes: se pedirem outra coisa, diga isso em uma linha.',
    'A tela é só a conversa: não há formulário nenhum. Quando a arte precisar do nome da',
    'unidade, do telefone ou de uma data, PERGUNTE — não invente e não deixe um espaço em branco.',
    fotos
      ? `A pessoa enviou ${fotos} foto(s). Numeradas a partir de 0, elas entram num elemento moldura.`
      : 'A pessoa não enviou nenhuma foto, então não use molduras.',
    '',
    'FUNDOS disponíveis — escolha um pelo id:',
    ...fundos.map(
      (f) =>
        `- ${f.id}: ${f.nome}. ${f.escuro ? 'Fundo escuro, texto em branco.' : 'Fundo claro, texto em grafite ou vermelho.'}` +
        (f.limpo
          ? ' Liso, sem nenhum grafismo: é aqui que as formas da marca fazem falta.'
          : ' Já tem grafismo desenhado: use poucas formas, para não competir.'),
    ),
    '',
    COMO_MONTAR,
    '',
    'REGRAS DA MARCA — obrigatórias, acima de qualquer pedido:',
    REGRAS_DA_MARCA,
  ].filter(Boolean).join('\n')

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
      console.error(`[pure-gpt] modelo respondeu ${r.status}: ${detalhe}`)
      // 403 é chave; 400 é pedido malformado — em geral o schema da ferramenta.
      // Separar os dois importa: dizer "chave recusada" num 400 manda quem for
      // consertar procurar no lugar errado (foi o que aconteceu em 19/10).
      if (r.status === 403 || r.status === 401) throw new Error('chave do modelo recusada')
      if (r.status === 400) {
        const motivo = (() => {
          try {
            return String(JSON.parse(detalhe)?.error?.message ?? '').slice(0, 160)
          } catch {
            return ''
          }
        })()
        throw new Error(`o modelo recusou o pedido${motivo ? `: ${motivo}` : ''}`)
      }
      throw new Error('o modelo não respondeu')
    }
    const resposta = await r.json()

    const partes = resposta?.candidates?.[0]?.content?.parts ?? []
    const chamada = partes.find((p: Record<string, unknown>) => p.functionCall)?.functionCall
    const texto = partes.map((p: { text?: string }) => p.text).filter(Boolean).join('\n').trim()

    // Sem chamada de ferramenta é conversa: pergunta de volta, recusa, ajuste.
    if (!chamada) return responder({ texto: texto || 'Não entendi; pode escrever de outro jeito?' })

    const args = chamada.args ?? {}
    const fundo = fundos.some((f) => f.id === args.fundo) ? String(args.fundo) : fundos[0].id
    const elementos = Array.isArray(args.elementos) ? args.elementos.slice(0, 12) : []
    if (!elementos.length) {
      return responder({ texto: texto || 'Não consegui montar essa; pode descrever de outro jeito?' })
    }

    // Registra o que foi montado: é com isto que a rede mede o uso e, quando
    // quiser, impõe um teto. A falha aqui não tira a arte de quem pediu.
    try {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
      })
      await admin.from('pure_gpt_geracoes').insert({
        user_id: user.id,
        unidade: null,
        prompt: mensagens[mensagens.length - 1]?.texto?.slice(0, 2000) ?? '',
        proporcao: '4:5',
        tentativas: 1,
        aprovada: true,
      })
    } catch (e) {
      console.error('[pure-gpt] não consegui registrar a geração:', e)
    }

    return responder({
      texto: String(args.resposta ?? texto ?? 'Prontinho, ficou assim:'),
      composicao: { proporcao: '4:5', fundo, elementos },
    })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'algo deu errado'
    return responder({ erro: mensagem }, 502)
  }
})
