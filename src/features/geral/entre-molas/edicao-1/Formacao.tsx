import { Corpo, Foto, Miolo, Pagina, Rotulo, type Lado } from '../diagramacao';
import { MATERIAS } from './materias';
import formatura from './fotos/academy/formatura-ar-livre-1.jpg';
import cadillac from './fotos/academy/cadillac-sem-fundo.jpg';

// Formação Online Pure Pilates (páginas 17 e 18). Texto exatamente como no Canva.

const P = MATERIAS.formacao.pagina;

export const Formacao1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P}>
    {/* formandos comemorando ao ar livre: em vez do capelo, bolas de Pilates nas cores da marca (imagem gerada por IA) */}
    <Foto src={formatura} alt="Instrutores comemorando a formação, jogando bolas de Pilates para o alto" className="absolute inset-x-0 top-0 h-[450px] w-full" posicao="50% 70%" />
    <h2 className="em-display absolute left-[64px] right-[64px] top-[484px] text-[56px] font-extrabold uppercase leading-[0.9] tracking-[-0.01em]">
      {MATERIAS.formacao.titulo}
    </h2>
    <Corpo className="absolute left-[64px] right-[64px] top-[668px] !text-[17px]">
      <p className="em-sem-recuo">
        Crescer para novas regiões é uma conquista enorme. E, como toda conquista, trouxe junto um novo desafio:
        encontrar profissionais qualificados perto das novas unidades.
      </p>
      <p>
        Quem é franqueado sabe bem como isso pesa no dia a dia. Por isso, decidimos criar um caminho mais acessível
        para quem deseja fazer parte da nossa rede.
      </p>
      <p className="em-destaque">Assim nasceu a Formação Online Pure Pilates.</p>
      <p>
        O objetivo é simples e ambicioso ao mesmo tempo: levar a nossa formação para além de São Paulo, alcançando
        profissionais e futuros instrutores exatamente nas regiões onde a Pure Pilates está crescendo.
      </p>
    </Corpo>
  </Pagina>
);

export const Formacao2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Miolo>
      <Rotulo>Mais acessibilidade para quem quer se formar</Rotulo>
      <Corpo className="mt-[12px] !text-[16.5px]">
        <p className="em-sem-recuo">
          Tem muita gente com vontade de trabalhar com Pilates que esbarra na distância, no tempo e no deslocamento
          para fazer uma formação presencial em São Paulo.
        </p>
        <p>
          Com o formato online, a metodologia Pure Pilates chega a diferentes regiões do Brasil, facilitando o acesso
          à formação e aproximando novos talentos da nossa rede.
        </p>
        <p>
          Mas a gente sabe: Pilates se aprende com a cabeça e com o corpo. Uma boa formação precisa unir teoria e
          prática.
        </p>
        <p className="em-destaque">Por isso, online, aqui, não quer dizer distante.</p>
      </Corpo>
      <Rotulo className="mt-[24px]">A prática acontece perto de você</Rotulo>
      <Corpo className="mt-[12px] !text-[16.5px]">
        <p className="em-sem-recuo">
          Um dos grandes diferenciais do projeto é contar com unidades Pure Pilates parceiras da região como polos
          de treinamento prático.
        </p>
        <p>
          Funciona assim: o aluno estuda o conteúdo teórico online e vive a experiência prática em uma unidade
          próxima. Ele aprende no ambiente real, com o padrão Pure, e a unidade parceira conhece de perto quem pode
          se tornar o próximo instrutor da sua equipe.
        </p>
        <p>
          Ou seja: enquanto forma, a sua unidade também encontra talentos já preparados, alinhados à nossa
          metodologia e prontos para encantar os seus alunos.
        </p>
      </Corpo>
      {/* fecho + o cadillac recortado (fundo branco que some no papel com multiply), no espaço que sobra */}
      <div className="mt-[18px] flex min-h-0 flex-1 items-end gap-[20px]">
        <p className="em-display w-[230px] shrink-0 text-[38px] font-extrabold uppercase leading-[0.92] text-[var(--em-vinho)]">
          É a rede crescendo junto, de ponta a ponta.
        </p>
        <img src={cadillac} alt="Aluna no cadillac" draggable={false} className="h-full min-w-0 flex-1 select-none object-contain object-right-bottom mix-blend-multiply" />
      </div>
    </Miolo>
  </Pagina>
);
