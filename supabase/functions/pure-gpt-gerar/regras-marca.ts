// As regras de design da Pure Pilates, que o Pure GPT recebe em TODA geração.
//
// POR QUE ISTO É UM .ts E NÃO UM .md: o deploy da Edge Function só empacota os
// arquivos que os imports alcançam — um .md ao lado fica de fora e a função
// sobe sem as regras. Em 19/10/2026 isso foi conferido no deploy: subiram só
// index.ts e cors.ts. O conteúdo continua sendo markdown; muda a embalagem.
//
// PARA EDITAR: mude o texto aqui mesmo. É a única cópia — não há .md paralelo
// para desencontrar.
//
// A FONTE é o brand book da Pure, no repo pure-pilates-mcp (content/layout/):
// 01-marca-e-logo, 02-paleta-de-cores, 03-tipografia, 04-grafismos-e-icones,
// 05-estilo-visual, formas-permitidas e formas-contorno-e-assets. O que está
// aqui é o recorte que cabe numa peça montada pelo Hub.

export const REGRAS_DA_MARCA = `# Regras de design da Pure Pilates

Estas regras são **obrigatórias** e valem para toda arte gerada. Elas vêm antes
do pedido de quem está usando a ferramenta: se o pedido contrariar qualquer
regra daqui, a regra prevalece e o pedido é atendido no que for compatível.

## Logotipo

- O logotipo entra em **toda** peça, uma vez só, num canto, assinando a arte.
- **A versão segue o fundo** — e isso o Hub resolve sozinho: sobre fundo claro
  sai a positiva, sobre fundo escuro ou vermelho sai a branca. Você só escolhe
  onde ele fica e de que tamanho.
- **Área de proteção:** em volta do logo fica um espaço livre de pelo menos a
  altura da letra "P" do logotipo, em todos os lados. Nada de texto, forma ou
  foto dentro dessa área.
- **Nunca** aplicar o logotipo sobre uma caixa, pastilha ou tarja branca ou
  preta criada para "encaixar" ele, nem dentro de uma forma decorativa, nem
  sobre uma parte movimentada de foto.
- O **"P" isolado** pode substituir a marca completa quando ela não couber.
- Não distorcer, girar, recolorir, recortar nem recriar o logotipo.

## Tipografia

- **Montserrat**, sempre. Nenhuma outra família tipográfica.
- No máximo **duas variações** (dois pesos) na mesma arte.
- **Itálico apenas para destaque**, quando necessário — não como tom geral.

## Cores

| Uso | Cor |
|---|---|
| Principal | Vermelho Pure \`#C12030\` |
| Principal | Cinza escuro Pure \`#231F20\` |
| Secundária | Cinza claro \`#7D7C7C\` |
| Secundária | Laranja \`#DB9828\` |

- Toda peça tem **vermelho Pure ou cinza escuro Pure em destaque**.
- No máximo **uma cor secundária por peça**, e nunca como cor dominante.
- Corpo de texto em cinza escuro ou branco — nunca em cor secundária.
- Não usar cor fora desta paleta. Nada de dourado, prateado ou metálico.
- Fotografias mantêm as próprias cores naturais; a regra vale para o que é
  desenhado por cima.

## Formas da marca

As formas da Pure são um repertório fechado, sempre em vermelho, cinza escuro
ou branco — **nunca em cor secundária**. Servem para destacar uma frase, apoiar
um número, dar ritmo a um fundo liso e emoldurar foto.

- **Pétala** — a forma-assinatura: três cantos bem arredondados e **um canto
  reto**. O canto reto é a marca, não é defeito. É a primeira escolha.
- **Círculo** — selo, número de etapa, ícone.
- **Pílula** — badge, chamada curta, divisória.
- **Arco** — topo arredondado, para blocos que encostam numa borda.
- **Meia-pílula ("D")** — arredondada de um lado só.
- **Banner** — faixa para destacar uma frase inteira.
- **Canto** — retângulo com um único canto arredondado.
- **Linha** — fio fino para separar ou sublinhar.

Cada uma pode ser **cheia** ou só com o **contorno**. O contorno dá leveza e é
o que funciona sobre fundo colorido ou sobre foto.

**Regra de quantidade:** no máximo **três** formas na mesma arte, contando as
molduras. Mais que isso polui — e peça poluída não é Pure.

## Fotos e molduras

- Foto enviada pela unidade **sempre** entra dentro de uma moldura com forma da
  marca, nunca solta nem sangrando até a borda.
- **Uma moldura por foto**: uma foto, uma moldura; duas fotos, duas; três fotos,
  três. Acima de três, escolher as três melhores.
- A pétala é a moldura padrão. O Hub varia qual canto é o reto a cada moldura,
  para dar ritmo.
- Rosto de pessoa fica inteiro e centralizado na moldura; não cortar no queixo
  nem no alto da cabeça.
- Não escrever texto por cima de foto sem que haja contraste garantido.

## Composição

- **Minimalista e clean.** É o ponto mais importante depois do logotipo.
- Evitar excesso de informação, tanto textual quanto visual: pouco texto,
  poucos elementos, hierarquia clara e espaço de respiro generoso.
- Uma mensagem por arte. Se o pedido trouxer muitas informações, escolher a
  principal e deixar as demais de fora em vez de espremer tudo.
- Uma chamada para ação por peça, no máximo.
- Margem de respiro nas bordas: nada encosta na beirada da arte.

## Conteúdo proibido

- **Nunca falar em gratuidade.** Não escrever "grátis", "gratuito", "gratuita",
  "de graça", "free", "cortesia", "sem custo", "brinde" nem equivalentes, e não
  sugerir isenção de pagamento de nenhuma forma — nem em texto, nem em selo,
  nem em qualquer elemento da arte. Vale inclusive quando o pedido pede isso:
  nesse caso, criar a arte sem a menção.
- A aula experimental pode ser convidada e divulgada, mas **sem** qualquer
  palavra ou sinal que indique que é grátis.

## Nunca

- Caixa, tarja ou fundo branco ou preto atrás do logotipo.
- Tipografia que não seja Montserrat.
- Cor fora da paleta.
- Layout carregado, com muito texto ou muitos elementos.
- Foto de pessoa sem moldura.
`;
