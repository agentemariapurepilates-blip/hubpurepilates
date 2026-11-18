import type { RenderPagina } from '../Revista';
import { EdicaoContext, EditoriaContext, type Lado } from '../diagramacao';
import { FotoMolas } from '../edicao-1/Abertura';
import Contracapa from '../edicao-1/Contracapa';
import Capa from './Capa';
import { MATERIAS, PURE_GPT } from './materias';
import {
  Calendario1,
  Calendario2,
  Checklist,
  Editorial1,
  Editorial2,
  Ganhos1,
  Ganhos2,
  Ganhos3,
  Ganhos4,
  Mito1,
  Mito2,
  NumerosAbertura,
  Numeros1,
  Numeros2,
  Numeros3,
  NumerosPodcast,
  NumerosWellhub,
  Padrao1,
  Padrao2,
  PureGpt1,
  PureGpt2,
  Fontes,
  Pratica1,
  Pratica2,
  Riscos1,
  Riscos2,
  Riscos3,
  Riscos4,
  Sumario,
} from './Paginas';

// Uma matéria = uma editoria + as páginas dela, em ordem (como nas edições 1 e 2).
type Render = (lado: Lado) => JSX.Element;
const materia = (editoria: string | null, paginas: Render[]): RenderPagina[] =>
  paginas.map((render, i) => (lado) => (
    <EdicaoContext.Provider value="Edição especial">
      {editoria ? (
        <EditoriaContext.Provider value={{ nome: editoria, i: i + 1, n: paginas.length }}>{render(lado)}</EditoriaContext.Provider>
      ) : (
        render(lado)
      )}
    </EdicaoContext.Provider>
  ));

// Edição especial · Nota fiscal — as páginas na ordem da revista (a capa é a 0).
// Mudou a ordem aqui, atualize também materias.ts.
export const PAGINAS_EDICAO_ESPECIAL: RenderPagina[] = [
  () => <Capa />,
  ...materia(null, [(l) => <FotoMolas lado={l} />, (l) => <Sumario lado={l} />]),
  ...materia(MATERIAS.editorial.secao, [(l) => <Editorial1 lado={l} />, (l) => <Editorial2 lado={l} />]),
  ...materia(MATERIAS.calendario.secao, [(l) => <Calendario1 lado={l} />, (l) => <Calendario2 lado={l} />]),
  ...materia(MATERIAS.mito.secao, [(l) => <Mito1 lado={l} />, (l) => <Mito2 lado={l} />]),
  ...materia(MATERIAS.riscos.secao, [(l) => <Riscos1 lado={l} />, (l) => <Riscos2 lado={l} />, (l) => <Riscos3 lado={l} />, (l) => <Riscos4 lado={l} />]),
  ...materia(MATERIAS.pratica.secao, [(l) => <Pratica1 lado={l} />, (l) => <Pratica2 lado={l} />]),
  ...materia(MATERIAS.numeros.secao, [
    (l) => <NumerosAbertura lado={l} />, (l) => <Numeros1 lado={l} />, (l) => <Numeros2 lado={l} />, (l) => <NumerosPodcast lado={l} />,
    (l) => <Numeros3 lado={l} />, (l) => <NumerosWellhub lado={l} />,
  ]),
  ...materia(MATERIAS.ganhos.secao, [(l) => <Ganhos1 lado={l} />, (l) => <Ganhos2 lado={l} />, (l) => <Ganhos3 lado={l} />, (l) => <Ganhos4 lado={l} />]),
  ...materia(MATERIAS.padrao.secao, [(l) => <Padrao1 lado={l} />, (l) => <Padrao2 lado={l} />, (l) => <Checklist lado={l} />, (l) => <Fontes lado={l} />]),
  ...materia(PURE_GPT.secao, [(l) => <PureGpt1 lado={l} />, (l) => <PureGpt2 lado={l} />]),
  (lado) => <Contracapa lado={lado} />,
];
