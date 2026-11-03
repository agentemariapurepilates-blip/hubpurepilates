import type { RenderPagina } from '../Revista';
import { EdicaoContext, EditoriaContext, type Lado } from '../diagramacao';
import { FotoMolas } from '../edicao-1/Abertura';
import Contracapa from '../edicao-1/Contracapa';
import { AnuncioMove1, AnuncioMove2 } from './Anuncios';
import { Artigo1, Artigo2, Artigo3, Artigo4, Artigo5, Artigo6, Artigo7, Artigo8 } from './ArtigoCaroline';
import { Bf1, Bf2, BfComAporte, BfJornada, BfSemAporte, BfVideoFilme, BfVideoJulia } from './BlackFriday';
import Capa from './Capa';
import { Faculdades, FaculdadesCapa } from './Faculdades';
import { MATERIAS, NOME_AUTORA } from './materias';
import { Norte1, Norte2 } from './Norte';
import { StoreLooks, StoreLooks2 } from './Looks';
import { Eletromidia, EletromidiaManual, StoreMove, StoreVideo, Suporte, SuporteFotos } from './Notas';
import { Play1, Play2, PlayCapa, PlayGestor, PlayVideo } from './PilatesPlay';
import { PilarCapa, PilarCartilha, PilarEpisodio, PilarReformer } from './SegredosDePilar';
import { ReputacaoNumeros, ReputacaoTexto, ReputacaoTexto2, ReputacaoVideo } from './Reputacao';
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
  ]),
  ...materia(MATERIAS.norte.secao, [(l) => <Norte1 lado={l} />, (l) => <Norte2 lado={l} />]),
  ...materia(MATERIAS.reputacao.secao, [(l) => <ReputacaoVideo lado={l} />, (l) => <ReputacaoNumeros lado={l} />, (l) => <ReputacaoTexto lado={l} />, (l) => <ReputacaoTexto2 lado={l} />]),
  ...materia(MATERIAS.blackFriday.secao, [
    (l) => <Bf1 lado={l} />, (l) => <BfVideoJulia lado={l} />, (l) => <Bf2 lado={l} />, (l) => <BfJornada lado={l} />, (l) => <BfSemAporte lado={l} />, (l) => <BfComAporte lado={l} />,
    (l) => <BfVideoFilme lado={l} />,
  ]),
  ...materia(null, [(l) => <AnuncioMove1 lado={l} />]),
  ...materia(MATERIAS.play.secao, [(l) => <PlayCapa lado={l} />, (l) => <PlayVideo lado={l} />, (l) => <Play1 lado={l} />, (l) => <Play2 lado={l} />, (l) => <PlayGestor lado={l} />]),
  ...materia(null, [(l) => <AnuncioMove2 lado={l} />]),
  ...materia(MATERIAS.suporte.secao, [(l) => <Suporte lado={l} />, (l) => <SuporteFotos lado={l} />]),
  ...materia(MATERIAS.eletromidia.secao, [(l) => <Eletromidia lado={l} />, (l) => <EletromidiaManual lado={l} />]),
  ...materia(MATERIAS.move.secao, [(l) => <StoreMove lado={l} />, (l) => <StoreVideo lado={l} />, (l) => <StoreLooks lado={l} />, (l) => <StoreLooks2 lado={l} />]),
  ...materia(MATERIAS.faculdades.secao, [(l) => <FaculdadesCapa lado={l} />, (l) => <Faculdades lado={l} />]),
  ...materia(MATERIAS.pilar.secao, [(l) => <PilarCapa lado={l} />, (l) => <PilarReformer lado={l} />, (l) => <PilarEpisodio lado={l} />, (l) => <PilarCartilha lado={l} />]),
  (lado) => <Contracapa lado={lado} />,
];
