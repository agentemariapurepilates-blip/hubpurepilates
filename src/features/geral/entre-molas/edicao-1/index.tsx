import type { RenderPagina } from '../Revista';
import { EditoriaContext, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import Capa from './Capa';
import { AberturaTitulo, AberturaVideo, FotoMolas } from './Abertura';
import Sumario from './Sumario';
import { Carta1, Carta2, Carta3, Carta4, Carta5, Carta6, Carta7, Carta8 } from './CartaDouglas';
import { Pilar1, Pilar2 } from './SegredosPilar';
import { Store1, Store2, StoreBoasVindas, StoreVideo } from './PureStore';
import { Ranking } from './SegundaMaior';
import { Reconhecimento1 } from './Reconhecimento';
import { TerritorioMapa, TerritorioRegioes } from './Territorio';
import CafeComCeo from './CafeComCeo';
import { ExpansaoHorizonte, ExpansaoRoberto } from './ExpansaoAbertura';
import { Layout1, Layout2 } from './AvisoLayout';
import { Arquitetura1, Arquitetura2, Arquitetura3 } from './Arquitetura';
import { Formacao1, Formacao2 } from './Formacao';
import { Jornada1, Jornada2, Suporte1, Suporte2 } from './JornadaFranqueado';
import { Estrutura1, Estrutura2 } from './SuporteEstrutura';
import { Contrato1, Contrato2 } from './Contrato';
import Contracapa from './Contracapa';

// Uma matéria = uma editoria + as páginas dela, em ordem. A etiqueta da editoria aparece no topo de todas as
// páginas da matéria, com a contagem (2/8), para o leitor ver onde ela começa e termina.
type Render = (lado: Lado) => JSX.Element;
const materia = (editoria: string | null, paginas: Render[]): RenderPagina[] =>
  paginas.map((render, i) => (lado) =>
    editoria ? (
      <EditoriaContext.Provider value={{ nome: editoria, i: i + 1, n: paginas.length }}>{render(lado)}</EditoriaContext.Provider>
    ) : (
      render(lado)
    ),
  );

// Edição 1 — as páginas na ordem da revista. A posição na lista é o número da
// página (a capa é a 0). Mudou a ordem aqui, atualize também materias.ts.
export const PAGINAS_EDICAO_1: RenderPagina[] = [
  // ?capa=socios mostra a versão alternativa da capa (comparação, 30/09/2026).
  () => <Capa variante={new URLSearchParams(window.location.search).get('capa') === 'socios' ? 'socios' : 'douglas'} />,
  ...materia(null, [(l) => <FotoMolas lado={l} />, (l) => <Sumario lado={l} />]),
  ...materia(MATERIAS.abertura.secao, [(l) => <AberturaTitulo lado={l} />, (l) => <AberturaVideo lado={l} />]),
  ...materia(MATERIAS.carta.secao, [
    (l) => <Carta1 lado={l} />, (l) => <Carta2 lado={l} />, (l) => <Carta3 lado={l} />, (l) => <Carta4 lado={l} />,
    (l) => <Carta5 lado={l} />, (l) => <Carta6 lado={l} />, (l) => <Carta7 lado={l} />, (l) => <Carta8 lado={l} />,
  ]),
  ...materia(MATERIAS.pilar.secao, [(l) => <Pilar1 lado={l} />, (l) => <Pilar2 lado={l} />]),
  ...materia(MATERIAS.jornada.secao, [
    // lâmina da estrutura do departamento, antes da jornada
    (l) => <Estrutura1 lado={l} />, (l) => <Estrutura2 lado={l} />,
    (l) => <Suporte1 lado={l} />, (l) => <Suporte2 lado={l} />, (l) => <Jornada1 lado={l} />, (l) => <Jornada2 lado={l} />,
  ]),
  ...materia(MATERIAS.arquitetura.secao, [
    (l) => <Arquitetura1 lado={l} />, (l) => <Arquitetura2 lado={l} />, (l) => <Arquitetura3 lado={l} />,
  ]),
  // "Leitura obrigatória": readequação de layout, entre Arquitetura e Pure Academy
  ...materia(MATERIAS.layout.secao, [(l) => <Layout1 lado={l} />, (l) => <Layout2 lado={l} />]),
  // contrato novo dos instrutores: vídeo + texto
  ...materia(MATERIAS.contrato.secao, [(l) => <Contrato1 lado={l} />, (l) => <Contrato2 lado={l} />]),
  ...materia(MATERIAS.formacao.secao, [(l) => <Formacao1 lado={l} />, (l) => <Formacao2 lado={l} />]),
  ...materia(MATERIAS.segundaMaior.secao, [
    // abre com o Roberto (foto e fala) e o motion dos novos horizontes
    (l) => <ExpansaoRoberto lado={l} />, (l) => <ExpansaoHorizonte lado={l} />,
    (l) => <Ranking lado={l} />, (l) => <TerritorioMapa lado={l} />, (l) => <TerritorioRegioes lado={l} />,
  ]),
  // anúncio (sem editoria), logo depois do artigo de Expansão
  ...materia(null, [(l) => <CafeComCeo lado={l} numero={MATERIAS.segundaMaior.pagina + 5} />]),
  ...materia(MATERIAS.reconhecimento.secao, [
    (l) => <Reconhecimento1 lado={l} />,
  ]),
  // Pure Store fecha a edição
  ...materia(MATERIAS.pureStore.secao, [
    (l) => <Store1 lado={l} />, (l) => <StoreVideo lado={l} />, (l) => <Store2 lado={l} />, (l) => <StoreBoasVindas lado={l} />,
  ]),
  (lado) => <Contracapa lado={lado} />,
];
