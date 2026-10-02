import { Citacao, Corpo, Miolo, Pagina, VideoAuto, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import meiaNatal from './fotos/pure-store/meia-natal.jpg';
import boasVindas from './fotos/pure-store/boas-vindas.jpg';
import colecaoMove from './fotos/pure-store/colecao-move.jpg';

// Clipe da Coleção Move (8 s): toca sozinho, em loop, assim que a seção abre; o som liga junto
// (se o navegador bloquear, o botão no centro liga). Ligar e tirar o som ficam bem no centro do vídeo.
const VIDEO_MOVE = '/videos/entre-molas/colecao-move.mp4';

// Pure Store (4 páginas, fecha a edição): abertura | vídeo da Coleção Move | texto | boas-vindas. Texto exatamente como no Canva,
// incluindo as boas-vindas à Maria Luiza.

const P = MATERIAS.pureStore.pagina;

export const Store1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    <Miolo>
      <h2 className="em-display text-[64px] font-extrabold uppercase leading-[0.9] tracking-[-0.01em]">
        {MATERIAS.pureStore.titulo}
      </h2>
      <div className="mt-[24px] flex min-h-0 flex-1 gap-[30px]">
        <div className="w-[326px] shrink-0">
          <p className="em-serif text-[25px] leading-[1.32]">
            Quando a marca fortalece o core, toda a rede ganha força. E a Pure Store é uma das provas mais bonitas
            disso.
          </p>
          <Corpo colunas={1} className="mt-[18px] !text-[17px]">
            <p className="em-sem-recuo">
              A nossa loja ganhou corpo, identidade e cores. Novos produtos foram desenvolvidos com o mesmo cuidado
              que colocamos em cada aula, e o resultado aparece dia após dia. A Pure Store deixou de ser apenas uma
              vitrine e passou a ser a primeira escolha dos alunos, com coleções que promovem movimento e conexão,
              dentro e fora do estúdio.
            </p>
          </Corpo>
        </div>
        {/* a meia de Natal, com a etiqueta bem visível */}
        <div className="relative min-w-0 flex-1 self-stretch overflow-hidden">
          <img src={meiaNatal} alt="Meia Pure Pilates com estampa de Natal" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: '82% 55%' }} />
          <div className="em-display absolute left-0 top-[18px] bg-[#a9293b] px-[16px] py-[9px] text-[26px] font-extrabold uppercase leading-none text-[#f7ecdc] shadow-[0_6px_16px_rgba(0,0,0,0.3)]">
            Vem aí: Coleção de Natal
          </div>
        </div>
      </div>
      <div className="mt-[26px]">
        <Citacao tamanho={30} autor="Ligia Neto, sócia e diretora de Operação">
          "A Pure Store foi pensada para ser uma extensão da experiência do estúdio. Cada produto na vitrine é uma
          oportunidade de gerar receita, fortalecer a marca e criar mais pontos de contato com o aluno."
        </Citacao>
      </div>
    </Miolo>
  </Pagina>
);

// Página inteira com o vídeo da Coleção Move, ao lado da abertura.
export const StoreVideo = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1} tom="escuro">
    <VideoAuto src={VIDEO_MOVE} poster={colecaoMove} somAoAbrir somNoCentro className="absolute inset-0" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-[64px] pb-[84px] pt-[120px]">
      <div className="em-sans text-[14px] font-bold uppercase tracking-[0.26em] text-[#ffd9a8]">Coleção</div>
      <div className="em-display text-[150px] font-extrabold uppercase leading-[0.82] text-[#f7ecdc]">Move</div>
    </div>
  </Pagina>
);

export const Store2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 2}>
    <Miolo className="!bottom-[80px]">
      <p className="em-display text-[44px] font-bold uppercase leading-[0.95] text-[var(--em-vinho)]">
        Para a sua unidade, isso significa?
      </p>
      <Corpo className="mt-[16px] !text-[16.5px]">
        <p className="em-sem-recuo">
          Mais do que produtos bonitos na recepção, significa uma nova fonte de receita, alunos que levam a marca
          para o dia a dia e um vínculo cada vez mais forte com o seu estúdio. Afinal, quem veste a Pure sente que
          faz parte dela. E vem mais por aí.
        </p>
        <p>
          A Coleção Move chega para acompanhar o aluno em todos os momentos: no aparelho, na rua, no trabalho ou no
          café depois da aula. Uma coleção pensada para quem leva o movimento para a vida inteira, e que dá à sua
          equipe um ótimo motivo para puxar conversa na recepção.
        </p>
        <p>
          E tem um segredo que não dá mais para guardar: tem algo diferente chegando aos nossos pés. Uma coleção
          incrível de meias colecionáveis, daquelas que fazem o aluno voltar para completar a coleção. Mais visitas
          à vitrine, mais conversas, mais vendas.
        </p>
        <p>
          Para fechar, estamos a poucos passos do Natal, com estampas incríveis que viram presente certeiro. É a
          oportunidade perfeita para movimentar a loja da sua unidade na época mais aquecida do ano.
        </p>
      </Corpo>
      {/* cena da Coleção Move no espaço que sobra, com o fecho por cima */}
      <div className="relative -mx-[64px] mt-[22px] min-h-[200px] flex-1 overflow-hidden">
        <img src={colecaoMove} alt="Coleção Move" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" style={{ objectPosition: '50% 52%' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <p className="em-display absolute bottom-[24px] left-[64px] w-[330px] text-[40px] font-extrabold uppercase leading-[0.92] text-[#f7ecdc]">
          Prepare a vitrine. O próximo passo é do seu estúdio.
        </p>
      </div>
    </Miolo>
  </Pagina>
);

// Boas-vindas à Maria Luiza, em página inteira.
export const StoreBoasVindas = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 3} tom="vinho">
    <Miolo className="justify-center">
      <div className="em-sans inline-block self-start bg-[#f7ecdc] px-[12px] py-[6px] text-[14px] font-bold uppercase tracking-[0.3em] text-[#a9293b]">
        Pure Store
      </div>
      <p className="em-display mt-[20px] text-[76px] font-extrabold uppercase leading-[0.9]">
        Tem gente nova chegando para somar ao nosso time!
      </p>
      <div className="mt-[36px] flex items-center gap-[32px]">
        <img
          src={boasVindas}
          alt="Maria Luiza"
          draggable={false}
          className="h-[330px] w-[270px] shrink-0 select-none border-[6px] border-[#f7ecdc] object-cover object-top shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)]"
        />
        <div className="em-sans text-[18px] leading-[1.5]">
          <p>
            A partir de agora, a Maria Luiza faz parte da equipe Pure Store e estará em contato direto com nossos
            franqueados, contribuindo para tornar nossa rotina ainda mais prática, organizada e próxima.
          </p>
          <p className="mt-[12px]">Que essa nova etapa seja cheia de trocas, aprendizados e boas experiências.</p>
          <p className="mt-[12px] font-bold">
            Seja muito bem-vinda, Maria! 🤍
            <br />
            Estamos felizes em ter você com a gente!
          </p>
        </div>
      </div>
    </Miolo>
  </Pagina>
);
