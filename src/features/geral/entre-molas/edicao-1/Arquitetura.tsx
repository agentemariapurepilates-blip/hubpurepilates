import { Citacao, Corpo, Foto, Miolo, Pagina, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import studioPure from './fotos/arquitetura/studio-pure.jpg';
import logoCreme from '../assets/logo-entre-molas-creme.png';
import caroline from './fotos/arquitetura/caroline-lo-duca-serroni.jpg';

// Arquitetura e Pure Academy (3 páginas). Texto exatamente como no Canva.

const P = MATERIAS.arquitetura.pagina;

export const Arquitetura1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    <h2 className="em-display absolute left-[64px] right-[64px] top-[56px] text-[62px] font-extrabold uppercase leading-[0.9] tracking-[-0.01em]">
      {MATERIAS.arquitetura.titulo}
    </h2>
    <Foto src={studioPure} className="absolute inset-x-0 top-[250px] h-[390px] w-full" posicao="50% 45%" />
    <Corpo className="absolute left-[64px] right-[64px] top-[666px]">
      <p className="em-sem-recuo">
        Sabe aquela sensação de entrar em um lugar e pensar "que vontade de ficar aqui"? Foi exatamente isso que
        buscamos com a nova experiência de arquitetura da Pure Pilates.
      </p>
      <p>
        Nossos estúdios ficaram mais modernos, mais acolhedores e, claro, mais instagramáveis. Cada detalhe foi
        pensado para que o aluno se sinta em casa desde a recepção até o último exercício da aula. E quando o espaço
        encanta, o aluno compartilha. Cada foto no espelho, cada story no aparelho, cada marcação da unidade vira
        vitrine espontânea para o seu estúdio.
      </p>
    </Corpo>
  </Pagina>
);

// A foto da Caroline é o destaque da página: sangrada no topo, com a legenda; a fala dela vem logo abaixo.
export const Arquitetura2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo className="!top-0">
      <figure className="relative -mx-[64px] min-h-0 w-[820px] max-w-none flex-1 overflow-hidden">
        <img
          src={caroline}
          alt="Caroline Lo Duca Serroni"
          draggable={false}
          className="h-full w-full select-none object-cover"
          style={{ objectPosition: '50% 24%' }}
        />
        <figcaption className="em-sans absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-[64px] pb-[18px] pt-[70px] text-[#f7ecdc]">
          <span className="em-display block text-[40px] font-extrabold uppercase leading-[0.95]">Caroline Lo Duca Serroni</span>
          <span className="mt-[4px] block text-[16px] font-semibold uppercase tracking-[0.14em]">
            Sócia e Diretora de Implantação e Novos Negócios
          </span>
        </figcaption>
      </figure>
      <Citacao tamanho={34} className="mt-[28px]">
        "Ambientes cuidadosamente projetados para proporcionar bem-estar, saúde e qualidade de vida aos nossos
        alunos."
      </Citacao>
      <Corpo className="mt-[22px]">
        <p className="em-sem-recuo">
          Para o franqueado, isso significa um ambiente que ajuda a vender, a reter e a fortalecer a presença da
          unidade no digital. Um espaço bonito atrai. Um espaço acolhedor faz ficar.
        </p>
        <p className="em-destaque">Mas um estúdio incrível só funciona de verdade com gente preparada lá dentro.</p>
        <p>
          Com o crescimento da rede, entendemos que um dos nossos braços de negócio também precisava crescer: a Pure
          Academy. Responsável por formar centenas de profissionais para atuar no mercado do Pilates, a Academy é
          quem garante que o padrão Pure esteja presente em cada aula, em cada unidade.
        </p>
      </Corpo>
    </Miolo>
  </Pagina>
);

// Fecho da matéria, só com tipografia: o texto em corpo maior, a "combinação" em duas metades e a frase final
// num bloco vinho, com o logo como ponto final.
export const Arquitetura3 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 2}>
    <Miolo className="!top-[84px]">
      <p className="em-serif text-[22px] leading-[1.45]">
        Por isso, investimos no lançamento da nossa{' '}
        <b className="font-bold text-[var(--em-vinho)]">formação de instrutores</b> e passamos a acompanhar de perto
        as tendências do ensino a distância. Assim, mais profissionais têm acesso à nossa metodologia, com mais
        flexibilidade para aprender, e as unidades ganham instrutores alinhados ao{' '}
        <b className="font-bold">jeito Pure de ensinar e de encantar.</b>
      </p>

      <div className="mt-[26px] border-t-2 border-[var(--em-tinta)] pt-[20px]">
        <p className="em-sans text-[15.5px] font-bold uppercase tracking-[0.08em] text-[var(--em-vinho)]">
          Na prática, é a combinação que todo franqueado quer:
        </p>
        <div className="em-display mt-[16px] grid grid-cols-[1fr_auto_1.25fr] items-center gap-[22px] text-[44px] font-extrabold uppercase leading-[0.92]">
          <span>um espaço que conquista</span>
          <span className="text-[34px] font-semibold lowercase text-[var(--em-vinho)]">e</span>
          <span>uma equipe que sabe fazer o aluno voltar.</span>
        </div>
      </div>

      {/* a frase que fecha a matéria */}
      <div className="-mx-[64px] mt-[30px] flex w-[820px] max-w-none flex-1 flex-col justify-center bg-[#a9293b] px-[64px] py-[26px] text-[#f7ecdc]">
        <div className="mb-[18px] h-[4px] w-[64px] shrink-0 bg-[#f7ecdc]" />
        <p className="em-display text-[47px] font-extrabold uppercase leading-[0.92]">
          Porque, por trás de cada mola, existe um lugar pensado com carinho e alguém preparado para{' '}
          <span className="text-[#ffd9a8]">transformar cada movimento em resultado.</span>
        </p>
        <img src={logoCreme} alt="" draggable={false} className="mt-[16px] w-[120px] select-none self-end opacity-90" />
      </div>
    </Miolo>
  </Pagina>
);
