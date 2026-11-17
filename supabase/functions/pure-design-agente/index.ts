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
  tipo: 'texto' | 'texto-longo' | 'foto' | 'logo'
  limite?: number
  /** Só para tipo 'logo': de quais unidades da biblioteca de marca o logo pode vir. */
  unidadesLogo?: string[]
  /** Foto obrigatória: peça antes de gerar. */
  obrigatoria?: boolean
  /** Pode ser escondido na arte. */
  removivel?: boolean
  exemplo?: string
}

interface ModeloDoCatalogo {
  id: string
  nome: string
  categoria: string
  /** Modelo genérico, para quando nenhum específico combinar com o pedido. */
  coringa?: boolean
  campos: CampoDoModelo[]
  /** Palavras do pedido que apontam para este modelo (minúsculas, sem acento). */
  palavrasChave?: string[]
  /** Quando usar este modelo (decide entre modelos do mesmo tema). */
  dica?: string
  /** Lista repetível que o agente preenche (ex.: as datas do aviso de feriado). */
  lista?: { rotulo: string; variantes: { id: string; nome: string }[]; exemplo?: { text: string; variant: string }[] }
  /** Galeria de fotos que se reorganiza conforme a quantidade (1 a máximo). */
  galeria?: { campos: string[]; maximo: number }
  /** Parte que o agente não preenche (tabela de preços): a pessoa ajusta no editor. */
  observacao?: string
}

interface CategoriaDoCatalogo {
  nome: string
  /** O que a categoria cobre, em linguagem de gente. */
  descricao: string
  modelos: string[]
  comFoto: number
  semFoto: number
}

/** minúsculas e sem acento, para comparar o pedido com as palavras-chave */
const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * Quais modelos combinam com o que a pessoa escreveu, pelas palavras-chave.
 * Devolve os específicos (não coringa) com pelo menos uma palavra no pedido,
 * do que mais combina para o que menos combina.
 */
function modelosQueCombinam(modelos: ModeloDoCatalogo[], pedido: string) {
  const texto = normalizar(pedido)
  return modelos
    .filter((m) => !m.coringa && m.palavrasChave?.length)
    .map((m) => {
      const achadas = m.palavrasChave!.filter((p) => texto.includes(normalizar(p)))
      return { modelo: m, achadas }
    })
    .filter((r) => r.achadas.length > 0)
    .sort((a, b) => b.achadas.length - a.achadas.length)
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
      esconder: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Ids dos campos que NÃO devem aparecer na arte (só campos marcados "pode esconder"). Lista completa: o que não estiver aqui aparece.',
      },
      ajustes: {
        type: 'array',
        description:
          'Ajustes finos pedidos pela pessoa: tamanho_texto (valor de 0.7 a 1.4, 1 = normal), posicao_logo (sup-esq, sup-dir, inf-esq, inf-dir), tamanho_logo (0.3 a 3, 1 = normal).',
        items: {
          type: 'object',
          properties: {
            campo: { type: 'string' },
            tipo: { type: 'string', enum: ['tamanho_texto', 'posicao_logo', 'tamanho_logo'] },
            valor: { type: 'string' },
          },
          required: ['campo', 'tipo', 'valor'],
        },
      },
      quantidade_fotos: {
        type: 'number',
        description:
          'Só para modelo com GALERIA: quantas fotos a arte terá (1 até o máximo). Se a pessoa anexou fotos, é o número que ela mandou.',
      },
      logos: {
        type: 'array',
        description:
          'Para cada campo de LOGO do modelo, qual asset da biblioteca de marca usar (pelo id), escolhido pelo contexto da arte.',
        items: {
          type: 'object',
          properties: {
            campo: { type: 'string', description: 'O id do campo de logo.' },
            asset: { type: 'string', description: 'O id do asset da biblioteca de marca.' },
          },
          required: ['campo', 'asset'],
        },
      },
      itens: {
        type: 'array',
        description:
          'Só para modelo com LISTA (ex.: datas do aviso de feriado): os itens, em ordem. Cada um com o texto (ex.: "20/11 - Fechado") e a variante (id).',
        items: {
          type: 'object',
          properties: {
            texto: { type: 'string', description: 'O texto do item, curto.' },
            variante: { type: 'string', description: 'O id da variante (ex.: fechado ou aberto).' },
          },
          required: ['texto', 'variante'],
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

/** A segunda ferramenta: entregar um arquivo pronto (ex.: a tag do mês), sem editar nada. */
const FERRAMENTA_PRONTA = {
  name: 'entregar_arte_pronta',
  description:
    'Entrega uma arte pronta (arquivo final, como as tags impressas) da lista "Artes prontas", do jeito que está, para a pessoa baixar.',
  parameters: {
    type: 'object',
    properties: {
      arte: { type: 'string', description: 'O id de uma das artes prontas da lista.' },
      resposta: { type: 'string', description: 'Uma ou duas frases curtas para a pessoa: qual arte você está entregando.' },
    },
    required: ['arte', 'resposta'],
  },
}

interface ArteProntaDoCatalogo {
  id: string
  campanha: string
  titulo: string
  formato: string
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
  let categorias: CategoriaDoCatalogo[] = []
  let prontas: ArteProntaDoCatalogo[] = []
  let fotos = 0
  let arteAtual: {
    modelo: string
    textos?: Record<string, string>
    fotos?: Record<string, number>
    logos?: Record<string, string>
    removidos?: string[]
    ajustes?: { campo: string; tipo: string; valor: string }[]
    itens?: { text: string; variant: string }[]
  } | null = null
  try {
    const corpo = await req.json()
    mensagens = Array.isArray(corpo?.mensagens) ? corpo.mensagens.slice(-12) : []
    modelos = Array.isArray(corpo?.modelos) ? corpo.modelos.slice(0, 80) : []
    categorias = Array.isArray(corpo?.categorias) ? corpo.categorias.slice(0, 40) : []
    prontas = Array.isArray(corpo?.prontas) ? corpo.prontas.slice(0, 120) : []
    fotos = Number(corpo?.fotos) || 0
    arteAtual = corpo?.arteAtual && typeof corpo.arteAtual.modelo === 'string' ? corpo.arteAtual : null
  } catch {
    return responder({ erro: 'pedido malformado' }, 400)
  }
  if (!mensagens.length) return responder({ erro: 'nada a responder' }, 400)
  if (!modelos.length) return responder({ erro: 'o catálogo de modelos não chegou' }, 400)

  // Biblioteca de marca (só o time a vê no Hub; aqui o agente lê com service role).
  // Se a tabela ainda não existir ou falhar, segue sem logos: o modelo usa o padrão.
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  let assets: { id: string; unidade: string; subpasta: string | null; nome: string; descricao: string; url: string }[] = []
  try {
    const { data } = await admin
      .from('marca_assets')
      .select('id, unidade, subpasta, nome, descricao, url')
      .eq('ativo', true)
      .eq('tipo', 'logo')
      .limit(80)
    assets = data ?? []
  } catch (e) {
    console.error('[pure-design-agente] biblioteca de marca indisponível:', e)
  }

  // O que a pessoa pediu até aqui (só as falas dela) vira pista de quais modelos combinam.
  const pedido = mensagens.filter((m) => m.autor === 'pessoa').map((m) => m.texto).join(' \n ')
  const combinam = modelosQueCombinam(modelos, pedido)

  const catalogo = modelos.map((m) => {
    const fotosNoModelo = m.campos.filter((c) => c.tipo === 'foto').length
    const linhas = [
      `## ${m.id} — ${m.nome} (${m.categoria}) · ${fotosNoModelo ? `${fotosNoModelo} foto(s)` : 'só texto, sem foto'}${m.coringa ? ' · CORINGA' : ''}`,
      ...m.campos.map(
        (c) =>
          `- ${c.id}: ${c.rotulo} [${c.tipo}${c.obrigatoria ? ', OBRIGATÓRIA' : ''}${c.removivel ? ', pode esconder' : ''}${c.limite ? `, até ${c.limite} caracteres` : ''}${c.tipo === 'logo' && c.unidadesLogo?.length ? `, logos de: ${c.unidadesLogo.join(', ')}` : ''}]` +
          (c.tipo !== 'foto' && c.exemplo ? ` — exemplo: "${c.exemplo.slice(0, 160)}"` : ''),
      ),
    ]
    if (m.dica) linhas.push(`- SOBRE ESTE MODELO: ${m.dica}`)
    if (m.galeria) {
      linhas.push(
        `- GALERIA de 1 a ${m.galeria.maximo} fotos (campos ${m.galeria.campos.join(', ')}): o layout se reorganiza conforme a quantidade. Informe quantidade_fotos.`,
      )
    }
    if (m.lista) {
      linhas.push(
        `- LISTA de "${m.lista.rotulo}" (preencha em itens): variantes ${m.lista.variantes.map((v) => `${v.id} (${v.nome})`).join(', ')}` +
          (m.lista.exemplo?.length ? ` — exemplo: ${m.lista.exemplo.map((e) => `"${e.text}" [${e.variant}]`).join(', ')}` : ''),
      )
    }
    if (m.observacao) linhas.push(`- Obs.: ${m.observacao}`)
    return linhas.join('\n')
  })

  // Categorias: o que cada uma cobre e quantos modelos com/sem foto ela tem.
  const blocoCategorias = categorias.length
    ? categorias.map(
        (c) =>
          `- ${c.nome}: ${c.descricao || '(sem descrição)'} · ${c.comFoto} modelo(s) com foto, ${c.semFoto} sem foto`,
      )
    : ['- (as categorias não vieram; use a categoria de cada modelo no catálogo)']

  const instrucao = [
    'Você é o assistente de artes do Pure Design, da Pure Pilates. Você ajuda franqueados a criar artes',
    'PREENCHENDO modelos prontos da marca: você não desenha nada, só escolhe o modelo e escreve os textos.',
    'Converse como uma pessoa simpática do marketing, em português do Brasil, frases curtas, sem formalidade.',
    '',
    '## Quem pede e o que é comum',
    'Quem conversa com você é franqueado ou equipe de uma unidade (estúdio) da Pure Pilates. Use esse',
    'contexto para entender o pedido sem perguntar o óbvio:',
    '- "vaga", "contratando", "trabalhe conosco" = vaga de INSTRUTOR(A) DE PILATES na unidade. Não pergunte',
    '  o cargo; só mude se a pessoa disser outro (ex.: recepcionista).',
    '- "aula experimental", "conheça", "venha fazer uma aula" = convite para conhecer o estúdio.',
    '- "abertura", "estúdio novo", "vamos abrir" = inauguração da unidade.',
    '- "feriado", "vamos fechar", "horário especial" = aviso de funcionamento.',
    '- "parabéns", "aniversário" de alguém da equipe = homenagem a instrutor(a).',
    'Leia as descrições das categorias: elas dizem o que é o padrão em cada uma. Pergunte só o que falta de',
    'verdade e o que você não pode inventar (dados da unidade, datas, horários, contato).',
    '',
    '## Como trabalhar',
    'Você é inteligente: explore as categorias e os modelos abaixo e decida sozinho o que melhor atende a',
    'pessoa. Não existem regras fixas de qual modelo usar — use o bom senso, como um designer usaria.',
    '- Entenda a INTENÇÃO, não só as palavras ("arte pro meu estúdio dia 19/11" pode ser inauguração).',
    '- Antes de preencher, você precisa saber o que a arte vai comunicar, qual categoria/modelo serve, se',
    '  vai foto ou não (quando houver escolha) e os dados que não dá para inventar (nomes, datas, horários).',
    '- Quando tiver DÚVIDA sobre qualquer um desses pontos, PERGUNTE — de forma leve, uma coisa por vez',
    '  (ou juntando o que for natural numa pergunta só), oferecendo opções quando ajudar. Ex.: "Oi, tudo bem?',
    '  Você quer anunciar a inauguração do seu estúdio?"; "Quer mandar uma foto ou prefere sem foto?";',
    '  "O que você quer comunicar: que vai fechar no feriado ou desejar um bom feriado?".',
    '- Quando NÃO tiver dúvida, não pergunte: siga e preencha. Não repita o que a pessoa já respondeu; se',
    '  ela disser "tanto faz", decida você.',
    '- Se ela mandou um texto, use o texto dela. O que não for informação factual, escreva você, no tom da',
    '  marca. Dados factuais que ela não deu (telefone, endereço, e-mail): mantenha o exemplo do campo.',
    '- Se ela mandou foto(s), prefira um modelo que use essa quantidade de fotos; se o melhor modelo não',
    '  usar foto, tudo bem, só avise.',
    '- Se nenhuma categoria própria servir bem, os modelos Coringa servem para qualquer assunto.',
    '- Modelo com LISTA (ex.: datas do feriado): preencha "itens".',
    '- Modelo com GALERIA (1 a N fotos): se a pessoa não anexou fotos nem disse quantas quer, PERGUNTE',
    '  "Quantas fotos você quer na arte? Pode ser de 1 a N." e informe quantidade_fotos. Se ela anexou, use',
    '  as fotos dela, na ordem, nos campos da galeria (a primeira é a principal).',
    '- Modelo com campo de LOGO: escolha em "logos" o asset da biblioteca de marca que combina com a arte',
    '  (ex.: peças da Coleção Move = logo da Coleção Move; promoção geral da loja = logo da Pure Store),',
    '  respeitando as unidades permitidas no campo. Na dúvida, pergunte ou use o logo principal da unidade.',
    '- Quando tiver o suficiente, chame preencher_modelo e preencha TODOS os campos de texto do modelo.',
    '- Campo de foto OBRIGATÓRIA: se a pessoa ainda não anexou foto, peça a foto antes de gerar esse modelo.',
    '',
    '## Ajustes na arte que já existe (veja "Arte atual")',
    '- Pedidos como "muda esse texto", "tira a etiqueta", "coloca X em negrito", "aumenta o título", "logo',
    '  embaixo", "logo maior" são AJUSTES: chame preencher_modelo com o MESMO modelo e repita exatamente',
    '  tudo o que não foi pedido (todos os textos, fotos, logos, campos escondidos e ajustes atuais),',
    '  mudando só o que a pessoa pediu. Não reescreva o que ela não pediu.',
    '- Negrito: marque o trecho com **dois asteriscos** dentro do texto (ex.: "A **MOVE** chegou").',
    '- Tamanho de texto, posição e tamanho do logo: use "ajustes". Esconder/mostrar partes: use "esconder".',
    '- Se o pedido for vago ("muda o texto"), pergunte o que ela quer escrever.',
    '- Nada de desconto, preço ou data que a pessoa não deu. Você só cria artes destes modelos: se pedirem',
    '  outra coisa, diga isso em uma linha.',
    '',
    fotos
      ? `A pessoa já enviou ${fotos} foto(s) nesta conversa, numeradas a partir de 0.`
      : 'A pessoa não enviou nenhuma foto até agora.',
    '',
    '# Categorias',
    ...blocoCategorias,
    '',
    '# Pistas pelas palavras do pedido (só pistas; a decisão é sua)',
    ...(combinam.length
      ? combinam.slice(0, 6).map((r) => `- ${r.modelo.categoria} › ${r.modelo.id} (palavras: ${r.achadas.join(', ')})`)
      : ['- nenhuma palavra conhecida: entenda pela intenção e, na dúvida, pergunte.']),
    '',
    ...(arteAtual
      ? [
          '# Arte atual (a última que você gerou nesta conversa)',
          `- modelo: ${arteAtual.modelo}`,
          ...Object.entries(arteAtual.textos ?? {}).map(([k, v]) => `- texto ${k}: ${JSON.stringify(v)}`),
          ...Object.entries(arteAtual.fotos ?? {}).map(([k, v]) => `- foto ${k}: foto enviada nº ${v}`),
          ...Object.entries(arteAtual.logos ?? {}).map(([k, v]) => `- logo ${k}: asset ${assets.find((a) => a.url === v)?.id ?? v}`),
          ...(arteAtual.removidos?.length ? [`- escondidos: ${arteAtual.removidos.join(', ')}`] : []),
          ...(arteAtual.ajustes ?? []).map((a) => `- ajuste: ${a.campo} ${a.tipo} = ${a.valor}`),
          ...(arteAtual.itens?.length ? [`- itens da lista: ${arteAtual.itens.map((i) => `${i.text} [${i.variant}]`).join('; ')}`] : []),
          '',
        ]
      : []),
    '# Artes prontas (arquivos finais, entregues do jeito que estão)',
    `Hoje é ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
    '- Quando pedirem algo que existe pronto aqui (ex.: "a tag", "tag do mês", "tag de Natal", "tag do',
    '  Outubro Rosa"), entregue com entregar_arte_pronta em vez de montar um modelo. Não se edita: é o arquivo final.',
    '- "Tag" sem dizer qual: entregue a da data comemorativa mais próxima de hoje (ou do mês atual); se não',
    '  houver uma clara, pergunte qual, citando as opções.',
    '- Se pedirem para mudar o texto de uma arte pronta, explique que ela vem fechada e ofereça um modelo editável.',
    ...(prontas.length
      ? prontas.map((a) => `- ${a.id} · ${a.campanha} › ${a.titulo} (${a.formato})`)
      : ['- (nenhuma arte pronta disponível)']),
    '',
    '# Biblioteca de marca — logos disponíveis (id · unidade › subpasta · nome: quando usar)',
    ...(assets.length
      ? assets.map((a) => `- ${a.id} · ${a.unidade}${a.subpasta ? ` › ${a.subpasta}` : ''} · ${a.nome}: ${a.descricao}`)
      : ['- (biblioteca vazia: os campos de logo ficam com o logo padrão do modelo)']),
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
          tools: [{ functionDeclarations: [FERRAMENTA, FERRAMENTA_PRONTA] }],
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

    if (chamada.name === 'entregar_arte_pronta') {
      const arte = prontas.find((a) => a.id === args.arte)
      if (!arte) return responder({ texto: texto || 'Não achei essa arte pronta; pode dizer qual você quer?' })
      try {
        await admin.from('pure_gpt_geracoes').insert({
          user_id: user.id,
          unidade: null,
          prompt: mensagens[mensagens.length - 1]?.texto?.slice(0, 2000) ?? '',
          proporcao: `arte-pronta:${arte.id}`.slice(0, 60),
          tentativas: 1,
          aprovada: true,
        })
      } catch (e) {
        console.error('[pure-design-agente] não consegui registrar o uso:', e)
      }
      return responder({ texto: String(args.resposta || texto || `Aqui está: ${arte.titulo}.`), artePronta: arte.id })
    }

    const modelo = modelos.find((m) => m.id === args.modelo)
    if (!modelo) return responder({ texto: texto || 'Não achei um modelo para esse pedido; pode detalhar?' })

    // Só passam campos que existem no modelo, cortados no limite de cada um.
    const textos: Record<string, string> = {}
    for (const t of Array.isArray(args.textos) ? args.textos : []) {
      const campo = modelo.campos.find((c) => c.id === t?.campo && c.tipo !== 'foto' && c.tipo !== 'logo')
      if (!campo || typeof t.valor !== 'string') continue
      const semMarca = t.valor.replace(/\*\*/g, '')
      textos[campo.id] = campo.limite && semMarca.length > campo.limite ? semMarca.slice(0, campo.limite) : t.valor
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

    // Itens da lista (ex.: datas do feriado): só variantes que o modelo conhece.
    const variantes = new Set((modelo.lista?.variantes ?? []).map((v) => v.id))
    const itens = modelo.lista
      ? (Array.isArray(args.itens) ? args.itens : [])
          .filter((it: { texto?: unknown; variante?: unknown }) => typeof it?.texto === 'string' && variantes.has(String(it?.variante)))
          .slice(0, 8)
          .map((it: { texto: string; variante: string }) => ({ text: it.texto.slice(0, 40), variant: it.variante }))
      : undefined

    // Logos: só assets da biblioteca, só em campo de logo, só das unidades permitidas.
    const logos: Record<string, string> = {}
    for (const l of Array.isArray(args.logos) ? args.logos : []) {
      const campo = modelo.campos.find((c) => c.id === l?.campo && c.tipo === 'logo')
      const asset = assets.find((a) => a.id === l?.asset)
      if (!campo || !asset) continue
      if (campo.unidadesLogo?.length && !campo.unidadesLogo.includes(asset.unidade)) continue
      logos[campo.id] = asset.url
    }

    // Partes escondidas a pedido (só campos que podem sair da arte).
    const escondidos: string[] = (Array.isArray(args.esconder) ? args.esconder : []).filter((id: unknown) =>
      modelo.campos.some((c) => c.id === id && c.removivel),
    )
    // Ajustes finos, com limites.
    const ajustes: { campo: string; tipo: string; valor: string }[] = []
    for (const a of Array.isArray(args.ajustes) ? args.ajustes : []) {
      const campo = modelo.campos.find((c) => c.id === a?.campo)
      if (!campo) continue
      const n = Number(a.valor)
      if (a.tipo === 'tamanho_texto' && campo.tipo !== 'foto' && campo.tipo !== 'logo' && Number.isFinite(n)) {
        ajustes.push({ campo: campo.id, tipo: a.tipo, valor: String(Math.min(1.4, Math.max(0.7, n))) })
      } else if (a.tipo === 'tamanho_logo' && campo.tipo === 'logo' && Number.isFinite(n)) {
        ajustes.push({ campo: campo.id, tipo: a.tipo, valor: String(Math.min(3, Math.max(0.3, n))) })
      } else if (a.tipo === 'posicao_logo' && campo.tipo === 'logo' && ['sup-esq', 'sup-dir', 'inf-esq', 'inf-dir'].includes(a.valor)) {
        ajustes.push({ campo: campo.id, tipo: a.tipo, valor: a.valor })
      }
    }

    // Galeria: as fotos além da quantidade escolhida entram excluídas (o layout se reorganiza).
    let removidos: string[] = []
    if (modelo.galeria) {
      const usadas = modelo.galeria.campos.filter((c) => fotosNosCampos[c] !== undefined).length
      const pedida = Math.round(Number(args.quantidade_fotos))
      const n = usadas > 0 ? usadas : Number.isFinite(pedida) && pedida >= 1 ? Math.min(pedida, modelo.galeria.maximo) : modelo.galeria.maximo
      removidos = modelo.galeria.campos.slice(n)
    }

    return responder({
      texto: String(args.resposta || texto || 'Prontinho! Confira e ajuste o que quiser no editor.'),
      preenchimento: {
        modelo: modelo.id,
        textos,
        fotos: fotosNosCampos,
        ...(removidos.length || escondidos.length ? { removidos: Array.from(new Set([...removidos, ...escondidos])) } : {}),
        ...(ajustes.length ? { ajustes } : {}),
        ...(itens?.length ? { itens } : {}),
        ...(Object.keys(logos).length ? { logos } : {}),
      },
    })
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'algo deu errado'
    return responder({ erro: mensagem }, 502)
  }
})
