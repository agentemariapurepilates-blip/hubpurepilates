import { Citacao, Corpo, Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import studio from './fotos/layout/layout-studio.jpg';
import planta from './fotos/layout/projeto-2.png';
import sala from './fotos/layout/projeto-3.png';
import carol from './fotos/arquitetura/carol-monsanto.jpg';

// Editoria "Leitura obrigatória" (2 páginas), logo depois de Arquitetura: readequação de layout dos studios.
// Texto exatamente como enviado pela equipe (02/10/2026); as imagens são dos projetos de layout.

const P = MATERIAS.layout.pagina;

// Abertura: a foto do studio sangrada no topo, título e a chamada. (Os valores não são divulgados: pedido da equipe.)
export const Layout1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    <Miolo className="!top-0">
      <img
        src={studio}
        alt="Studio Pure Pilates"
        draggable={false}
        className="-mx-[64px] min-h-0 w-[820px] max-w-none flex-1 select-none object-cover"
        style={{ objectPosition: '50% 40%' }}
      />
      <h2 className="em-display mt-[30px] text-[80px] font-extrabold uppercase leading-[0.86] tracking-[-0.01em]">
        Readequação de Layout <span className="text-[var(--em-vinho)]">dos Studios</span>
      </h2>
      <p className="em-serif mt-[18px] border-t-2 border-[var(--em-tinta)] pt-[16px] text-[25px] leading-[1.36]">
        O valor da atualização do layout depende da disponibilidade do arquivo editável do projeto original.
      </p>
    </Miolo>
  </Pagina>
);

// O "Importante" em destaque, o texto em colunas, a planta e a perspectiva, e quem responde.
export const Layout2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo className="!top-[84px]">
      <Citacao tamanho={31}>
        <span className="text-[var(--em-vinho)]">Importante:</span> O PDF do projeto é apenas um arquivo para
        visualização e não permite alterações. Para qualquer modificação no layout, é indispensável o arquivo editável
        original.
      </Citacao>
      <Corpo className="mt-[26px]">
        <p className="em-sem-recuo">
          Os projetos desenvolvidos pela franqueadora possuem o arquivo editável e armazenado permitindo futuras
          atualizações.
        </p>
        <p>
          Já os projetos desenvolvidos pela arquiteta terceirizada não tiveram o arquivo editável entregue à
          franqueadora, pois ele é de propriedade da profissional. Dessa forma, esse arquivo não pode ser acessado,
          editado ou modificado por terceiros.
        </p>
      </Corpo>
      {/* a planta e a perspectiva, sangradas, no espaço que sobra */}
      <div className="-mx-[64px] mt-[28px] flex min-h-0 w-[820px] flex-1 gap-[6px]">
        <img src={planta} alt="Planta baixa de um projeto de layout" draggable={false} className="h-full w-[440px] select-none object-cover" />
        <img src={sala} alt="Perspectiva de um projeto de layout" draggable={false} className="h-full min-w-0 flex-1 select-none object-cover" />
      </div>
      <div className="mt-[24px] flex shrink-0 items-center gap-[22px]">
        <img
          src={carol}
          alt="Carol Monsanto"
          draggable={false}
          className="h-[150px] w-[150px] shrink-0 select-none object-cover"
          style={{ objectPosition: '50% 15%' }}
        />
        <div>
          <div className="em-sans text-[15px] font-bold uppercase tracking-[0.22em] text-[var(--em-vinho)]">Mais informações:</div>
          <div className="em-display mt-[6px] text-[52px] font-extrabold uppercase leading-[0.9]">Carol Monsanto.</div>
          <div className="em-sans mt-[8px] text-[16px] font-semibold uppercase tracking-[0.16em]">Gerente de Implantação</div>
        </div>
      </div>
    </Miolo>
  </Pagina>
);
