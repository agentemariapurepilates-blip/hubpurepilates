// Prancheta como CONECTOR do Claude (MCP remoto): funciona em qualquer Claude — navegador, app e celular —
// sem instalar nada. A pessoa adiciona o endereço uma vez em Configurações › Conectores.
//
// É a mesma ponte do repositório prancheta-mcp (rotas /api/hub/* da Estação), mas rodando aqui no servidor,
// e com o que aprendemos fazendo o carrossel "Quem é você no Pilates?" (21/10/2026):
//   - layout sai no GPT Image 2.5 (motor padrão para layout, pedido da equipe);
//   - o GPT INVENTA o logotipo quando a gente pede: então ele deixa o canto vazio e o logo OFICIAL é colado aqui;
//   - o PNG cheio (~5 MB) não cabe na conversa: a arte final fica guardada no Storage, a conversa recebe uma
//     prévia leve (para o Claude conferir o texto letra por letra) e o link para baixar.
//
// Protocolo: MCP "Streamable HTTP" sem sessão, respondendo JSON (cada POST é uma chamada JSON-RPC).
// Acesso: o endereço leva um código secreto no fim (…/prancheta-mcp/<PRANCHETA_MCP_SEGREDO>), como o conector do
// Carrossel. Sem o código certo, 404.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts'

const ESTACAO = Deno.env.get('PRANCHETA_URL') || 'https://prancheta.purepilates.com.br'
const TOKEN = Deno.env.get('PRANCHETA_HUB_TOKEN') || ''
const SEGREDO = Deno.env.get('PRANCHETA_MCP_SEGREDO') || ''
const BUCKET = 'prancheta-artes'
const MOTOR_LAYOUT = 'gpt-image-2.5'
const GUIAS = 'https://raw.githubusercontent.com/agentemariapurepilates-blip/pure-pilates-mcp/main/content'
const LOGO_PURE_PILATES = `${GUIAS}/layout/arquivos/logo-pure-pilates.png`

// Medidas da arte final: o tamanho que o Instagram usa (1080 de largura).
const LARGURA_FINAL = 1080
const PREVIA_LARGURA = 900

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

class Recusa extends Error {}

// ---------- Estação (Prancheta) ----------

async function estacao(metodo: string, caminho: string, corpo?: unknown) {
  // O Cloudflare da Estação barra User-Agent de script desconhecido (erro 1010); o do httpx, usado pelo MCP, passa.
  const r = await fetch(`${ESTACAO}${caminho}`, {
    method: metodo,
    headers: { 'X-Hub-Token': TOKEN, 'Content-Type': 'application/json', 'User-Agent': 'python-httpx/0.28.1' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  })
  if (r.status === 401) throw new Recusa('A Prancheta recusou o token do conector (PRANCHETA_HUB_TOKEN). Avise a Renata.')
  if (r.status === 404) throw new Recusa('A Prancheta está no ar, mas com a ponte desligada (sem token no .env da Estação).')
  if (!r.ok) throw new Recusa(`A Prancheta respondeu ${r.status}: ${(await r.text()).slice(0, 200)}`)
  return await r.json()
}

const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms))

// Espera a imagem ficar pronta, mas sem passar do tempo de uma chamada (o GPT leva ~30 s).
async function esperar(tipo: 'imagem' | 'video', id: string, prazoMs = 110_000) {
  const limite = Date.now() + prazoMs
  while (Date.now() < limite) {
    await espera(4000)
    const d = await estacao('GET', `/api/hub/${tipo}/${id}`)
    if (d.estado === 'pronta') return d
    if (d.estado === 'erro') throw new Recusa(`A Prancheta não conseguiu: ${d.erro}`)
  }
  return null
}

// ---------- Arte final: logo oficial + Storage ----------

let logoEmCache: Image | null = null
async function logoOficial(): Promise<Image> {
  if (!logoEmCache) {
    const bytes = new Uint8Array(await (await fetch(LOGO_PURE_PILATES)).arrayBuffer())
    logoEmCache = (await Image.decode(bytes)) as Image
    logoEmCache.crop(286, 787, 1737, 708) // o PNG vem com margem transparente; isto é a caixa do desenho
  }
  return logoEmCache.clone()
}

async function garantirBucket() {
  const { data } = await supabase.storage.getBucket(BUCKET)
  if (!data) await supabase.storage.createBucket(BUCKET, { public: true })
}

// O canto do logo está livre? Mede a variação de luz na área: fundo liso varia pouco; texto ou foto, muito.
function cantoLivre(arte: Image, x: number, y: number, l: number, a: number) {
  const valores: number[] = []
  for (let yy = y; yy < y + a; yy += 4) {
    for (let xx = x; xx < x + l; xx += 4) {
      const [r, g, b] = Image.colorToRGBA(arte.getPixelAt(xx + 1, yy + 1))
      valores.push(0.299 * r + 0.587 * g + 0.114 * b)
    }
  }
  const media = valores.reduce((s, v) => s + v, 0) / valores.length
  const desvio = Math.sqrt(valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length)
  return desvio < 12 && media > 170
}

async function finalizar(pngBase64: string, colarLogo: boolean) {
  const bruto = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0))
  const arte = (await Image.decode(bruto)) as Image
  arte.resize(LARGURA_FINAL, Image.RESIZE_AUTO)
  let aviso = ''
  if (colarLogo) {
    // canto inferior direito, ~19% da largura, com a margem que usamos no carrossel
    const logo = await logoOficial()
    logo.resize(Math.round(arte.width * 0.19), Image.RESIZE_AUTO)
    const x = arte.width - logo.width - Math.round(arte.width * 0.065)
    const y = arte.height - logo.height - Math.round(arte.height * 0.05)
    if (!cantoLivre(arte, x - 12, y - 12, logo.width + 24, logo.height + 24)) {
      aviso = 'ATENÇÃO: o canto do logo não estava livre (tinha texto, foto ou fundo escuro). Veja se o logo encostou em algo; se sim, gere de novo.'
    }
    arte.composite(logo, x, y)
  }
  const final = await arte.encodeJPEG(92)
  arte.resize(PREVIA_LARGURA, Image.RESIZE_AUTO)
  const previa = await arte.encodeJPEG(82)

  await garantirBucket()
  const nome = `${new Date().toISOString().slice(0, 10)}/arte-${crypto.randomUUID().slice(0, 8)}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(nome, final, { contentType: 'image/jpeg' })
  if (error) throw new Recusa(`Não consegui guardar a arte: ${error.message}`)
  const link = supabase.storage.from(BUCKET).getPublicUrl(nome).data.publicUrl
  return { link, previa, aviso }
}

// Referências chegam por link (a conversa não tem arquivo local): baixo e mando em base64, como a Estação pede.
async function referenciasDosLinks(links: unknown): Promise<string[]> {
  const lista = Array.isArray(links) ? (links as string[]).slice(0, 8) : []
  return await Promise.all(lista.map(async (url) => {
    const r = await fetch(url)
    if (!r.ok) throw new Recusa(`Não consegui baixar a referência ${url} (${r.status}).`)
    return emBase64(new Uint8Array(await r.arrayBuffer()))
  }))
}

async function guardarVideo(mp4Base64: string) {
  const bytes = Uint8Array.from(atob(mp4Base64), (c) => c.charCodeAt(0))
  await garantirBucket()
  const nome = `${new Date().toISOString().slice(0, 10)}/video-${crypto.randomUUID().slice(0, 8)}.mp4`
  const { error } = await supabase.storage.from(BUCKET).upload(nome, bytes, { contentType: 'video/mp4' })
  if (error) throw new Recusa(`Não consegui guardar o vídeo: ${error.message}`)
  return supabase.storage.from(BUCKET).getPublicUrl(nome).data.publicUrl
}

const emBase64 = (b: Uint8Array) => {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return btoa(s)
}

// ---------- Ferramentas ----------

const INSTRUCOES = `Prancheta da Pure: gera artes no padrão da marca.
Fluxo para qualquer peça com texto (post, carrossel, story):
1. Leia o guia da marca (ferramenta guia_da_marca) antes de escrever a copy e o prompt.
2. Gere cada peça com gerar_arte (imagem; motor padrão GPT Image 2.5, logo oficial colado automaticamente) ou gerar_video (vídeo). Todos os motores da lista de listar_motores podem ser usados.
3. CONFIRA a prévia que volta: o texto escrito na arte precisa bater letra por letra com o pedido (acentos e pontuação
   inclusive), sem letreiro, logo ou texto inventado, e com pose e anatomia corretas. Se algo estiver errado, gere de novo
   dizendo o problema (no máximo 2 vezes) e avise a pessoa se continuar errado.
4. Entregue o link de download de cada arte aprovada.
Cada geração no GPT gasta 1 crédito da Prancheta.`

const FERRAMENTAS = [
  {
    name: 'gerar_arte',
    description:
      'Gera UMA arte na Prancheta (GPT Image 2.5 por padrão) e devolve uma prévia para conferir e o link para baixar a arte final. ' +
      'Em artes da Pure Pilates o logotipo OFICIAL é colado no canto inferior direito (não peça o logo no prompt: o canto fica livre para ele). ' +
      'Depois de receber, confira o texto da prévia letra por letra com o pedido; se errar, gere de novo.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'A arte descrita por inteiro: cena, layout, e os textos EXATOS entre aspas, com cores da marca.' },
        proporcao: { type: 'string', description: '"4:5" feed, "9:16" story, "1:1" ou "16:9". Padrão 4:5.' },
        marca: { type: 'string', description: 'Slug da marca: pure-pilates (padrão), pure-store, pure-academy, pure-franchising.' },
        elenco: { type: 'array', items: { type: 'string' }, description: 'Pessoas ou lugares cadastrados na marca, pelo nome (ver elenco_da_marca). As fotos reais entram como referência.' },
        motor: { type: 'string', description: 'Id do motor (ver listar_motores). Vazio = GPT Image 2.5.' },
        colar_logo: { type: 'boolean', description: 'Cola o logo oficial da Pure Pilates. Padrão: sim para a marca pure-pilates.' },
        referencias_links: { type: 'array', items: { type: 'string' }, description: 'Links de imagens para usar como referência (ex.: uma arte gerada antes). Até 8.' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'gerar_video',
    description:
      'Gera um vídeo na Prancheta (motor padrão: o de vídeo da lista de listar_motores) e devolve o link do MP4. Cobra crédito por segundo: ' +
      'informe o custo à pessoa antes (listar_motores mostra o valor). Vídeo demora alguns minutos: se não ficar pronto na hora, use buscar_video com o id.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'A cena descrita como roteiro: o que aparece e o que se move.' },
        segundos: { type: 'number', description: 'Duração em segundos (ver o intervalo do motor em listar_motores).' },
        proporcao: { type: 'string', description: '"9:16" (padrão), "16:9", "1:1", "4:5".' },
        motor: { type: 'string', description: 'Id do motor de vídeo. Vazio = padrão da Prancheta.' },
        marca: { type: 'string' },
        elenco: { type: 'array', items: { type: 'string' }, description: 'Quem aparece, pelo nome (um retrato por pessoa).' },
        referencias_links: { type: 'array', items: { type: 'string' }, description: 'Links de imagens de referência (ex.: a arte que vai ser animada).' },
        comecar_na_imagem: { type: 'boolean', description: 'O vídeo começa na primeira referência (para animar uma arte que já existe).' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'buscar_video',
    description: 'Busca um vídeo que ainda estava sendo gerado (use o id que gerar_video informou). Repita até ficar pronto.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
  },
  {
    name: 'buscar_arte',
    description: 'Busca uma arte que ainda estava sendo gerada quando gerar_arte terminou (use o id que ele informou).',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' }, colar_logo: { type: 'boolean' } },
      required: ['id'],
    },
  },
  {
    name: 'guia_da_marca',
    description: 'Brandbook da Pure Pilates: "layout" (logo, cores, tipografia, estilo visual) ou "copy" (posicionamento, tom de voz, vocabulário, formatos).',
    inputSchema: { type: 'object', properties: { assunto: { type: 'string', enum: ['layout', 'copy'] } }, required: ['assunto'] },
  },
  {
    name: 'elenco_da_marca',
    description: 'Quem está cadastrado em cada marca da Prancheta (pessoas, produtos, lugares), para usar no campo elenco.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'listar_motores',
    description: 'Motores de imagem da Prancheta no ar agora, com o custo de cada um.',
    inputSchema: { type: 'object', properties: {} },
  },
]

const ARQUIVOS_DO_GUIA: Record<string, string[]> = {
  layout: ['01-marca-e-logo', '02-paleta-de-cores', '03-tipografia', '04-grafismos-e-icones', '05-estilo-visual'],
  copy: ['01-posicionamento', '02-tom-de-voz', '03-vocabulario', '04-publicos', '05-pilares-editoriais', '06-canais', '08-exemplos-e-checklist'],
}

type Conteudo = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }
const texto = (t: string): Conteudo => ({ type: 'text', text: t })

async function entregar(pronta: { imagem: string; modelo?: string }, colarLogo: boolean): Promise<Conteudo[]> {
  const { link, previa, aviso } = await finalizar(pronta.imagem, colarLogo)
  return [
    texto(`Arte pronta (${pronta.modelo || MOTOR_LAYOUT}${colarLogo ? ', logo oficial aplicado' : ''}).\nBaixar a arte final (1080 px): ${link}\n` +
      (aviso ? aviso + '\n' : '') + 'Confira o texto da prévia abaixo letra por letra antes de entregar.'),
    { type: 'image', data: emBase64(previa), mimeType: 'image/jpeg' },
  ]
}

async function chamar(nome: string, a: Record<string, unknown>): Promise<Conteudo[]> {
  if (nome === 'gerar_arte') {
    const marca = (a.marca as string) || 'pure-pilates'
    const colarLogo = a.colar_logo === undefined ? marca === 'pure-pilates' : Boolean(a.colar_logo)
    let prompt = String(a.prompt || '')
    if (colarLogo) {
      prompt += ' O canto inferior direito fica VAZIO, em fundo liso e claro, numa área de uns 25% da largura e 9% da altura: ' +
        'nada de logotipo, símbolo ou texto ali. Nenhum logotipo, letreiro ou marca d\'água em lugar nenhum da imagem.'
    }
    const comeco = await estacao('POST', '/api/hub/imagem', {
      prompt, proporcao: (a.proporcao as string) || '4:5', motor: (a.motor as string) || MOTOR_LAYOUT,
      referencias: await referenciasDosLinks(a.referencias_links), marca, elenco: (a.elenco as string[]) || [], logo: false,
    })
    const pronta = await esperar('imagem', comeco.id)
    if (!pronta) return [texto(`A arte ainda está sendo gerada. Chame buscar_arte com o id ${comeco.id} daqui a uns segundos.`)]
    return await entregar(pronta, colarLogo)
  }
  if (nome === 'buscar_arte') {
    const pronta = await esperar('imagem', String(a.id), 100_000)
    if (!pronta) return [texto(`Ainda não ficou pronta. Tente buscar_arte com o id ${a.id} de novo.`)]
    return await entregar(pronta, a.colar_logo === undefined ? true : Boolean(a.colar_logo))
  }
  if (nome === 'gerar_video') {
    const comeco = await estacao('POST', '/api/hub/video', {
      prompt: String(a.prompt || ''), proporcao: (a.proporcao as string) || '9:16', segundos: Number(a.segundos) || 5,
      referencias: await referenciasDosLinks(a.referencias_links), comecar_na_imagem: Boolean(a.comecar_na_imagem),
      motor: (a.motor as string) || '', marca: (a.marca as string) || '', elenco: (a.elenco as string[]) || [],
    })
    const pronto = await esperar('video', comeco.id, 100_000)
    if (!pronto) return [texto(`O vídeo começou a ser gerado (leva alguns minutos). Chame buscar_video com o id ${comeco.id} para pegar quando ficar pronto.`)]
    return [texto(`Vídeo pronto (${pronto.modelo || 'Prancheta'}, ${pronto.segundos ?? '?'} s): ${await guardarVideo(pronto.video)}`)]
  }
  if (nome === 'buscar_video') {
    const pronto = await esperar('video', String(a.id), 100_000)
    if (!pronto) return [texto(`Ainda gerando. Chame buscar_video com o id ${a.id} de novo daqui a pouco.`)]
    return [texto(`Vídeo pronto (${pronto.modelo || 'Prancheta'}, ${pronto.segundos ?? '?'} s): ${await guardarVideo(pronto.video)}`)]
  }
  if (nome === 'guia_da_marca') {
    const assunto = a.assunto === 'copy' ? 'copy' : 'layout'
    const partes = await Promise.all(ARQUIVOS_DO_GUIA[assunto].map(async (f) => (await fetch(`${GUIAS}/${assunto}/${f}.md`)).text()))
    return [texto(partes.join('\n\n---\n\n'))]
  }
  if (nome === 'elenco_da_marca') {
    const d = await estacao('GET', '/api/hub/marcas')
    const linhas: string[] = []
    for (const m of d.marcas || []) {
      linhas.push(`${m.nome} (marca: ${m.slug})`)
      for (const e of m.elenco || []) linhas.push(`  ${e.nome} · ${e.tipo}${e.descricao ? ' — ' + e.descricao : ''}`)
    }
    return [texto(linhas.join('\n') || 'Nenhuma marca cadastrada.')]
  }
  if (nome === 'listar_motores') {
    const d = await estacao('GET', '/api/hub/motores')
    type M = { id: string; rotulo?: string; local?: boolean; custo?: number | null; licenca?: string | null; custo_por_segundo?: number; segundos?: number[] }
    // a Estação também manda itens sem nome de verdade (só a categoria, ex.: "video"): esses não dá para chamar
    const reais = (lista: M[]) => (lista || []).filter((m) => m.rotulo && m.rotulo !== m.id)
    const img = reais(d.motores).map((m) =>
      `  ${m.id} — ${m.rotulo} (${m.local ? 'local, sem custo' : `${m.custo ?? '?'} crédito(s)`})${m.licenca ? ` · licença: ${m.licenca}` : ''}`)
    const vid = reais(d.video).map((m) =>
      `  ${m.id} — ${m.rotulo} (${m.custo_por_segundo ? `${m.custo_por_segundo} crédito(s) por segundo` : 'custo não medido'}${m.segundos ? `, de ${m.segundos[0]} a ${m.segundos[1]} s` : ''})`)
    return [texto(`IMAGEM (padrão para layout: ${MOTOR_LAYOUT})\n${img.join('\n')}\n\nVÍDEO\n${vid.join('\n') || '  nenhum'}`)]
  }
  throw new Recusa(`Ferramenta desconhecida: ${nome}`)
}

// ---------- JSON-RPC (MCP Streamable HTTP, sem sessão) ----------

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  const segredoNaUrl = new URL(req.url).pathname.split('/').filter(Boolean).pop()
  if (!SEGREDO || segredoNaUrl !== SEGREDO) return new Response('Not found', { status: 404 })
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } })

  let msg: { id?: number | string; method?: string; params?: Record<string, unknown> }
  try { msg = await req.json() } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido' } }, 400) }

  // notificações não têm resposta
  if (msg.id === undefined || msg.id === null) return new Response(null, { status: 202 })

  const ok = (result: unknown) => json({ jsonrpc: '2.0', id: msg.id, result })
  switch (msg.method) {
    case 'initialize':
      return ok({
        protocolVersion: (msg.params?.protocolVersion as string) || '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'prancheta-pure', version: '1.0.0' },
        instructions: INSTRUCOES,
      })
    case 'ping':
      return ok({})
    case 'tools/list':
      return ok({ tools: FERRAMENTAS })
    case 'tools/call': {
      const nome = String(msg.params?.name || '')
      const args = (msg.params?.arguments as Record<string, unknown>) || {}
      try {
        return ok({ content: await chamar(nome, args) })
      } catch (e) {
        const motivo = e instanceof Recusa ? e.message : `Erro inesperado: ${(e as Error).message}`
        return ok({ content: [texto(motivo)], isError: true })
      }
    }
    default:
      return json({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `Método não suportado: ${msg.method}` } })
  }
})
