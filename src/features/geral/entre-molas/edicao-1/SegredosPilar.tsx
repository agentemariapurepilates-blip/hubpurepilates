import { Citacao, Corpo, Foto, Pagina, VideoAuto, type Lado } from '../diagramacao';
import cenaPilar from './fotos/segredos-pilar/cena.jpg';
import ligia from './fotos/segredos-pilar/ligia-microfone.jpg';
import { MATERIAS } from './materias';

// Os Segredos de Pilar (páginas 11 e 12). Texto exatamente como no Canva.

// Trailer servido pelo próprio Hub (public/videos), convertido do .mov da
// subpasta Clipes: toca sozinho, sem som, e não leva ninguém para o Drive.
const TRAILER = '/videos/entre-molas/trailer-segredos-de-pilar.mp4';

const P = MATERIAS.pilar.pagina;

export const Pilar1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} tom="escuro">
    <div className="em-carimbo absolute right-[52px] top-[58px]">Confidencial</div>
    <h2 className="em-display absolute left-[64px] right-[64px] top-[150px] text-[84px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
      {MATERIAS.pilar.titulo}
    </h2>
    <VideoAuto src={TRAILER} poster={cenaPilar} className="absolute inset-x-[64px] top-[396px] h-[290px]" />
    <Corpo className="absolute left-[64px] right-[64px] top-[700px] !text-[19.5px]">
      <p className="em-sem-recuo">
        Nos últimos anos, muita coisa mudou por aqui. A rede cresceu, os aparelhos se renovaram e a gente também.
        Como todo bom aluno de Pilates, sentimos a evolução no corpo: ganhamos flexibilidade, fortalecemos o core
        e conquistamos a resistência de quem sabe que o próximo movimento sempre pode ir um pouco mais longe.
      </p>
      <p className="em-destaque">E nada disso aconteceu por acaso.</p>
    </Corpo>
  </Pagina>
);

export const Pilar2 = ({ lado }: { lado: Lado }) => {
  return (
    <Pagina lado={lado} numero={P + 1}>
      <Corpo className="absolute left-[64px] right-[64px] top-[64px]">
        <p className="em-sem-recuo">
          Com esse crescimento, chegou também um novo suporte de operação, pronto para caminhar lado a lado com
          cada unidade. Ao mesmo tempo, o digital vem provando todos os dias que uma boa história conquista
          qualquer pessoa. Juntando as duas coisas, a pergunta apareceu sozinha: e se a gente também se
          reinventasse na forma de conversar?
        </p>
        <p>
          Afinal, vendas, retenção, encantamento e propósito de marca são assuntos sérios, mas não precisam ser
          chatos. Eles podem ter personagem, emoção, reviravolta e aquele final que deixa a gente contando os dias
          para o próximo episódio. Sim, melhor que dorama.
        </p>
        <p className="em-destaque">Foi assim que nasceu Os Segredos de Pilar.</p>
        <p>
          A cada edição, você vai acompanhar os bastidores de um estúdio pelos olhos da Pilar: os desafios do dia a
          dia, as conversas que viram matrícula, os detalhes que fazem um aluno ficar e as pequenas atitudes que
          transformam uma aula em experiência. Prepare o coração (e o caderninho de anotações).
        </p>
      </Corpo>

      <div className="absolute bottom-[96px] left-[64px] right-[64px] flex items-center gap-[34px]">
        <Foto src={ligia} alt="Ligia Neto" className="h-[400px] w-[266px] shrink-0" posicao="50% 20%" />
        <Citacao tamanho={28} className="flex-1" autor="Lígia Neto - Sócia-fundadora">
          “O sucesso das nossas unidades nos trouxe até aqui, e continuar crescendo exige coragem para se
          reinventar. Com tantas mudanças no comportamento do cliente, criamos um jeito novo de compartilhar o que
          sempre fez a Pure dar certo. Os Segredos de Pilar são o nosso método, com as melhorias necessárias para a
          gestão de hoje.”
        </Citacao>
      </div>
    </Pagina>
  );
};
