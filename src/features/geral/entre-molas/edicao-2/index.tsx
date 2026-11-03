import type { RenderPagina } from '../Revista';
import { EdicaoContext, EditoriaContext, type Lado } from '../diagramacao';
import { FotoMolas } from '../edicao-1/Abertura';
import Contracapa from '../edicao-1/Contracapa';
import { Artigo1, Artigo2, Artigo3, Artigo4, Artigo5, Artigo6, Artigo7, Artigo8, Artigo9 } from './ArtigoCaroline';
import { Bf1, Bf2, BfComAporte, BfJornada, BfSemAporte, BfVideoFilme, BfVideoJulia } from './BlackFriday';
import Capa from './Capa';
import { Faculdades1, Faculdades2 } from './Faculdades';
import { MATERIAS, NOME_AUTORA } from './materias';
import { Norte1, Norte2 } from './Norte';
import { Eletromidia, StoreAbertura, StoreMove, StoreVideo, Suporte } from './Notas';
import { Play1, Play2, PlayGestor, PlayVideo } from './PilatesPlay';
import { ReputacaoNumeros, ReputacaoTexto, ReputacaoTexto2, ReputacaoVideo, Unidades } from './Reputacao';
import Sumario from './Sumario';

// Uma matéria = uma editoria + as páginas dela, em ordem (como na Edição 1).
type Render = (lado: Lado) => JSX.Element;
const materia = (editoria: string | null, paginas: Render[]): RenderPagina[] =>
  paginas.map((render, i) => (lado) => (
    <EdicaoContext.Provider value="Edição 2">
      {editoria ? (
        <EditoriaContext.Provider value={{ nome: editoria, i: i + 1, n: paginas.length }}>{render(lado)}</EditoriaContext.Provider>
      ) : (
        render(lado)
      )}
    </EdicaoContext.Provider>
  ));

// Edição 2 — as páginas na ordem da revista. A posição na lista é o número da
// página (a capa é a 0). Mudou a ordem aqui, atualize também materias.ts.
export const PAGINAS_EDICAO_2: RenderPagina[] = [
  () => <Capa />,
  ...materia(null, [(l) => <FotoMolas lado={l} />, (l) => <Sumario lado={l} />]),
  ...materia(`Artigo por ${NOME_AUTORA}`, [
    (l) => <Artigo1 lado={l} />, (l) => <Artigo2 lado={l} />, (l) => <Artigo3 lado={l} />, (l) => <Artigo4 lado={l} />,
    (l) => <Artigo5 lado={l} />, (l) => <Artigo6 lado={l} />, (l) => <Artigo7 lado={l} />, (l) => <Artigo8 lado={l} />,
    (l) => <Artigo9 lado={l} />,
  ]),
  ...materia(null, [(l) => <Unidades lado={l} />]),
  ...materia(MATERIAS.reputacao.secao, [(l) => <ReputacaoVideo lado={l} />, (l) => <ReputacaoNumeros lado={l} />, (l) => <ReputacaoTexto lado={l} />, (l) => <ReputacaoTexto2 lado={l} />]),
  ...materia(MATERIAS.blackFriday.secao, [
    (l) => <Bf1 lado={l} />, (l) => <BfVideoJulia lado={l} />, (l) => <Bf2 lado={l} />, (l) => <BfJornada lado={l} />, (l) => <BfSemAporte lado={l} />, (l) => <BfComAporte lado={l} />,
    (l) => <BfVideoFilme lado={l} />,
  ]),
  ...materia(MATERIAS.play.secao, [(l) => <Play1 lado={l} />, (l) => <Play2 lado={l} />, (l) => <PlayVideo lado={l} />, (l) => <PlayGestor lado={l} />]),
  ...materia(MATERIAS.norte.secao, [(l) => <Norte1 lado={l} />, (l) => <Norte2 lado={l} />]),
  ...materia(MATERIAS.suporte.secao, [(l) => <Suporte lado={l} />]),
  ...materia(MATERIAS.eletromidia.secao, [(l) => <Eletromidia lado={l} />]),
  ...materia(MATERIAS.move.secao, [(l) => <StoreAbertura lado={l} />, (l) => <StoreVideo lado={l} />, (l) => <StoreMove lado={l} />]),
  ...materia(MATERIAS.faculdades.secao, [(l) => <Faculdades1 lado={l} />, (l) => <Faculdades2 lado={l} />]),
  (lado) => <Contracapa lado={lado} />,
];
