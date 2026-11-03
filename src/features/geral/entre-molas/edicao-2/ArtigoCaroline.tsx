import { Citacao, Corpo, Foto, Miolo, Pagina, Rotulo, type Lado } from '../diagramacao';
import molas from '../edicao-1/fotos/abertura-molas.jpg';
import studio from '../edicao-1/fotos/layout/layout-studio.jpg';
import caroline from './fotos/caroline-recorte.png';
import meierSalao from './fotos/meier-salao.jpg';
import unidade1 from './fotos/unidade-1.jpg';
import { CARGO_ARTIGO, MATERIAS, NOME_AUTORA } from './materias';
import { Chave } from './pecas';

// Matéria de capa: o artigo da Caroline (páginas 3 a 10), no molde da carta do Douglas
// na Edição 1. Texto exatamente como no doc da equipe; a divisão em páginas e as frases
// em destaque, tiradas do próprio texto, são nossas. Assinatura com o nome da Edição 1.
// As fotos de unidade não levam legenda com o nome da unidade, a pedido da equipe.

const P = MATERIAS.artigo.pagina;

// 3 — abertura: a única foto da Caroline no artigo (o recorte da capa) e a pergunta
// que abre o texto, com o maior peso da página
export const Artigo1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} folioCurto>
    <img
      src={caroline}
      alt={NOME_AUTORA}
      draggable={false}
      className="absolute bottom-0 left-[330px] w-[540px] max-w-none select-none"
    />
    <div className="absolute left-[64px] top-[84px] w-[360px]">
      <h2 className="em-display text-[46px] font-extrabold uppercase leading-[0.92] tracking-[-0.01em]">
        {MATERIAS.artigo.titulo}
      </h2>
      <div className="mt-[26px] h-[3px] w-[40px] bg-[var(--em-vinho)]" />
      <p className="em-serif mt-[22px] text-[42px] font-semibold leading-[1.12] text-[var(--em-vinho)]">
        Quando foi a última vez que você mudou algo que já estava dando certo?
      </p>
      <div className="em-sans mt-[34px] w-[250px] text-[16px] font-bold leading-[1.4]">{NOME_AUTORA}</div>
      <div className="em-sans mt-[4px] w-[250px] text-[14px] leading-[1.45] opacity-75">{CARGO_ARTIGO}</div>
    </div>
  </Pagina>
);

// 4 — a frase do artigo em página vinho e o começo da conversa, sem foto
export const Artigo2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1} tom="vinho">
    <Miolo className="justify-center">
      <div className="mb-[24px] h-[4px] w-[64px] bg-[#f7ecdc]" />
      <p className="em-display text-[96px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
        Mudar não é desfazer.<br /><span className="text-[#ffd9a8]">Mudar é evoluir.</span>
      </p>
      <Corpo colunas={1} className="mt-[44px] border-t border-[#f7ecdc]/50 pt-[30px] !text-[23px] !leading-[1.55]">
        <p className="em-sem-recuo">Deixa eu te fazer uma pergunta: quando foi a última vez que você mudou algo que já estava dando certo?</p>
        <p>
          Pois é. A gente costuma mexer no que está quebrado. No que funciona, a tendência é deixar quieto. Eu sou o contrário.
          Quando alguma coisa funciona, é aí que eu fico mais curiosa: dá para ficar melhor? Quase sempre dá.
        </p>
        <p>
          E quero deixar uma coisa clara logo de cara: mudar não é desfazer. Mudar é evoluir. É pegar tudo o que a gente construiu
          até aqui e dar o próximo passo.
        </p>
      </Corpo>
    </Miolo>
  </Pagina>
);

// 5 — de onde veio o novo layout
export const Artigo3 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 2}>
    <Foto src={meierSalao} alt="Unidade com o layout novo" className="absolute inset-x-0 top-0 h-[540px] w-full" posicao="50% 58%" />
    <Corpo className="absolute left-[64px] right-[64px] top-[576px]">
      <p className="em-sem-recuo">
        Foi com esse olhar que a gente começou a rever o padrão das nossas unidades. Andamos pelos ambientes, ouvimos quem toca
        a operação todo dia e nos perguntamos: o que faria alguém se sentir mais confortável, mais leve e mais acolhido aqui
        dentro? O novo layout nasceu dessa conversa. O time de Implantação pensou em três pessoas ao mesmo tempo, o aluno, o
        instrutor e o gestor, sempre respeitando o jeito de cada imóvel.
      </p>
      <p>
        Agora, vamos combinar: o padrão anterior foi incrível. Foi ele que ajudou a construir uma marca presente na vida de
        tantos alunos. Ninguém está apagando essa história. Ela é nossa e vem com a gente. A diferença é que a rede cresceu, e o
        ambiente precisava crescer junto.
      </p>
    </Corpo>
  </Pagina>
);

// 6 — a identidade mais leve
export const Artigo4 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 3} folioCurto>
    <div className="absolute left-[64px] right-[64px] top-[76px]">
      <Citacao tamanho={72}>A identidade é a mesma. Ela só ficou mais leve.</Citacao>
      <Corpo colunas={1} className="mt-[26px] !text-[19px] !leading-[1.52]">
        <p className="em-sem-recuo">
          Então os tons claros e neutros ganharam espaço. O nosso vermelho, que eu amo, continua lá, só que agora aparece nos
          pontos certos, onde ele brilha mais. Entram a madeira, os painéis ripados, uma iluminação pensada com carinho e bastante
          verde. A comunicação visual ficou mais discreta, e é de propósito: quem precisa aparecer é a aula, o movimento, a
          experiência. A identidade é a mesma. Ela só ficou mais leve.
        </p>
      </Corpo>
    </div>
    <Foto src={unidade1} alt="Unidade com o layout novo" className="absolute inset-x-0 bottom-0 h-[400px] w-full" posicao="50% 55%" />
  </Pagina>
);

// 7 — não é só estética; o desconforto do novo
export const Artigo5 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 4}>
    <Miolo className="!top-[96px]">
      <p className="em-display border-b-2 border-[var(--em-tinta)] pb-[18px] text-[84px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
        Bonito só não basta, <span className="text-[var(--em-vinho)]">tem que funcionar.</span>
      </p>
      <Corpo colunas={1} className="mt-[26px] !text-[18px]">
        <p className="em-sem-recuo">
          E não é só estética. Sabe quando você entra num lugar e se sente bem antes mesmo de qualquer coisa acontecer? Isso não
          é acaso. Está na recepção, no acessório guardado no lugar certo, no caminho livre entre um aparelho e outro, no conforto
          durante a prática. Bonito só não basta, tem que funcionar. Por isso o novo padrão também foi desenhado para facilitar a
          vida de quem trabalha ali e deixar a rotina mais organizada. E como nenhum imóvel é igual ao outro, cada projeto é
          olhado caso a caso, para que o padrão caiba no espaço sem perder a cara da Pure.
        </p>
      </Corpo>
      <Chave className="my-[34px]">O desconforto do começo vira repertório lá na frente.</Chave>
      <Corpo colunas={1} className="!text-[18px]">
        <p className="em-sem-recuo">
          Eu sei que mudança nem sempre é confortável. O novo traz dúvida, pede treinamento, tira a gente do piloto automático. Às
          vezes dá trabalho e bate insegurança. Faz parte, e está tudo bem. Quem trabalha com formação, como a gente na Pure
          Academy, sabe: o desconforto do começo vira repertório lá na frente. É justamente nesse momento que a gente aprende e
          descobre jeitos melhores de fazer o que faz todo dia.
        </p>
      </Corpo>
    </Miolo>
  </Pagina>
);

// 8 — ajustar a mola: as molas sangradas e a frase-síntese
export const Artigo6 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 5} folioCurto>
    <Foto src={molas} alt="Molas do reformer" className="absolute inset-x-0 top-0 h-[480px] w-full" posicao="96% 50%" />
    <div className="absolute left-[64px] right-[64px] top-[512px]">
      <p className="em-display text-[86px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
        Se a mola nunca muda, <span className="text-[var(--em-vinho)]">o aluno para de crescer.</span>
      </p>
      <Corpo colunas={1} className="mt-[22px] !text-[18.5px] !leading-[1.5]">
        <p className="em-sem-recuo">
          E quer saber? Você já entende isso melhor do que ninguém. Pensa numa aula. Cada aluno tem seu tempo. Aquela carga que era
          desafio no começo, depois de algumas semanas, fica fácil. E o que você faz? Ajusta a mola. Não porque a mola anterior
          estava errada, mas porque o aluno evoluiu. Se a mola nunca muda, o aluno para de crescer.
        </p>
      </Corpo>
    </div>
  </Pagina>
);

// 9 — a rede, na prática
export const Artigo7 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 6}>
    <Miolo className="justify-center">
      <p className="em-display border-b-2 border-[var(--em-tinta)] pb-[18px] text-[76px] font-extrabold uppercase leading-[0.88] tracking-[-0.01em]">
        Chegou a hora de <span className="text-[var(--em-vinho)]">ajustar a mola.</span>
      </p>
      <Corpo colunas={1} className="mt-[30px] !text-[20px] !leading-[1.6]">
        <p className="em-sem-recuo">
          Com a rede é igualzinho. O padrão que trouxe a gente até aqui foi fundamental. A Pure cresceu, as necessidades são outras,
          e chegou a hora de ajustar a mola. E isso vale para tudo: ambientes, comunicação, materiais, ferramentas e o jeito como
          apoiamos as equipes. Ninguém evolui do dia para a noite. Precisa de atenção, orientação e prática. A gente testa, ajusta o
          que for preciso e segue. Juntos.
        </p>
        <p>
          Na prática, funciona assim: as novas unidades já nascem no padrão atualizado. Se a sua ainda segue o modelo anterior e você
          quer fazer a adequação, chama o time de Implantação. A gente está pronto para te orientar, no seu tempo, respeitando o
          planejamento e as características da sua unidade.
        </p>
      </Corpo>
      {/* a tarja acompanha o texto: duas linhas, sangrando só pela esquerda */}
      <div className="em-tom--vinho -ml-[64px] mt-[44px] self-start py-[20px] pl-[64px] pr-[34px]">
        <p className="em-sans text-[20px] italic leading-[1.55]">
          Entrou numa unidade, sentiu a Pure.
          <br />
          Entrou em outra, sentiu a mesma Pure.
        </p>
      </div>
    </Miolo>
  </Pagina>
);

// 10 — o fecho: o studio, o pedido e o convite
export const Artigo8 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 7} folioCurto>
    <Foto src={studio} alt="Studio Pure Pilates" className="absolute inset-x-0 top-0 h-[400px] w-full" posicao="50% 40%" />
    <Corpo className="absolute left-[64px] right-[64px] top-[428px] !text-[17px]">
      <p className="em-sem-recuo">
        E por que padronizar? Porque o aluno precisa reconhecer a Pure em qualquer lugar. Entrou numa unidade, sentiu a Pure. Entrou
        em outra, sentiu a mesma Pure. Cada unidade tem sua história, mas todas dividem o mesmo compromisso: cuidar muito bem de quem
        confia na gente.
      </p>
      <p>
        Por fim, um pedido. Quem faz a Pure evoluir são vocês: franqueados, gestores, instrutores e equipes que vivem a rede todos os
        dias. Então me conta: o que você mudaria hoje na sua unidade ou na sua rotina para deixar a experiência de todo mundo ainda
        melhor? Sério, me conta. Muita inovação começa com uma observação pequena, feita no meio do expediente.
      </p>
      <p>
        Mudar pode ser desafiador. Mas é no movimento que a gente cresce. E evoluir, no fim das contas, é o que o Pilates ensina a
        gente todos os dias.
      </p>
    </Corpo>
    <div className="absolute bottom-[86px] left-[64px] right-[64px]">
      <div className="em-display text-[110px] font-extrabold uppercase leading-[0.9] text-[var(--em-vinho)]">Bora?</div>
      <Rotulo className="mt-[14px]">{NOME_AUTORA}</Rotulo>
      <div className="em-sans mt-[4px] text-[13px] font-semibold uppercase tracking-[0.14em] opacity-70">{CARGO_ARTIGO}</div>
    </div>
  </Pagina>
);
