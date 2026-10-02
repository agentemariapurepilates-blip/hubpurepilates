import { Citacao, Corpo, Foto, Miolo, Pagina, Rotulo, type Lado } from '../diagramacao';
import { ASSINATURA_CARTA, MATERIAS, SUBTITULO_CARTA } from './materias';
import douglas from './fotos/douglas-recorte.png';
import assinatura from './fotos/carta-douglas/assinatura-contrato-2.jpg';
import fachada from './fotos/carta-douglas/fachada-estudio.jpg';
import equipeNoEstudio from './fotos/carta-douglas/equipe-no-estudio.jpg';
import equipeNaRecepcao from './fotos/carta-douglas/equipe-na-recepcao.jpg';
import escadaBarril from './fotos/carta-douglas/escada-barril.jpg';
import sharkTank2 from './fotos/carta-douglas/shark-tank-2.jpg';
import socios from './fotos/socios-recorte.png';
import primeiroCriativo from './fotos/carta-douglas/primeiro-criativo.jpg';
import materia500 from './fotos/carta-douglas/materia-500-unidades.png';
import materia500Titulo from './fotos/carta-douglas/materia-500-unidades-titulo.png';

// Matéria de capa: a carta do Douglas (páginas 5 a 12).
// Texto exatamente como no Canva (versão revisada de 30/09/2026); só a divisão
// em páginas é nossa. Negrito onde o Canva usa negrito.

const P = MATERIAS.carta.pagina;

/** Lista com marcador vinho, no lugar dos bullets do Canva. */
const Lista = ({ itens, className }: { itens: string[]; className?: string }) => (
  <ul className={`em-serif space-y-[8px] text-[18px] leading-[1.45] ${className ?? ''}`}>
    {itens.map((i) => (
      <li key={i} className="flex gap-[12px]">
        <span className="mt-[9px] h-[6px] w-[6px] shrink-0 rounded-full bg-[var(--em-vinho)]" />
        <span>{i}</span>
      </li>
    ))}
  </ul>
);

// abertura — o Douglas recortado à direita (o mesmo da capa), o texto à esquerda
export const Carta1 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P} folioCurto>
    {/* a foto original corta o braço dele na borda: o degradê esconde o corte */}
    <img
      src={douglas}
      alt="Douglas Paiva"
      draggable={false}
      className="absolute left-[262px] top-[-56px] w-[650px] max-w-none select-none"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, #000 22%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 22%)',
      }}
    />
    <div className="absolute left-[64px] top-[96px] w-[320px]">
      <h2 className="em-display text-[58px] font-extrabold uppercase leading-[0.9] tracking-[-0.01em]">
        {MATERIAS.carta.titulo}
      </h2>
      <p className="em-serif mt-[24px] text-[20.5px] leading-[1.45] text-[var(--em-tinta)]/85">{SUBTITULO_CARTA}</p>
      <div className="mt-[22px] h-[3px] w-[40px] bg-[var(--em-vinho)]" />
      <div className="em-sans mt-[12px] max-w-[250px] text-[15px] font-bold uppercase leading-[1.5] tracking-[0.2em] text-[var(--em-vinho)]">
        {ASSINATURA_CARTA}
      </div>
    </div>
  </Pagina>
);

// 6 — a quinhentésima: a Loja 0 grande no topo; o primeiro criativo no meio do
// texto, com o texto contornando
export const Carta2 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 1}>
    <Foto
      src={fachada}
      className="em-foto-historica absolute inset-x-0 top-0 h-[470px] w-full"
      posicao="50% 45%"
      legenda="Primeiro estúdio Pure Pilates - Loja 0"
    />
    <Corpo colunas={1} capitular className="absolute left-[64px] right-[64px] top-[506px]">
      <p>
        No começo deste mês, recebi uma mensagem com a foto de um contrato assinado e três palavras: “é a
        quinhentésima”.{' '}
        <Foto
          src={primeiroCriativo}
          className="em-foto-historica relative float-right mb-[10px] ml-[28px] mt-[6px] h-[250px] w-[330px]"
          posicao="50% 50%"
          legenda="Primeiro criativo feito"
        />
        Fiquei olhando para aquilo mais tempo do que eu esperava. Não pela foto — contrato assinado é uma imagem
        que já vi muitas vezes, e ainda bem. Foi pelo número. 500 unidades em 17 anos de estrada.
      </p>
      <p>
        Eu poderia abrir esta primeira edição celebrando os dois números, e eles merecem ser celebrados. Mas
        seria a forma mais rápida de desperdiçar a chance de dizer o que de fato importa.
      </p>
    </Corpo>
  </Pagina>
);

// 7 — a tese, a coerência e a primeira franquia assinada
export const Carta3 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 2}>
    <Miolo>
      <div className="em-tom--vinho px-[36px] py-[26px]">
        <p className="em-display text-[34px] font-semibold uppercase leading-[0.98]">
          Os números não provam que estamos certos. Provam que fomos coerentes por tempo suficiente para que a
          coerência virasse resultado.
        </p>
      </div>
      <Corpo className="mt-[26px] !text-[17px]">
        <p className="em-sem-recuo">
          Coerência é uma palavra sem brilho. Ninguém faz post sobre coerência. Mas é ela que explica por que uma
          aula dada numa terça à noite, numa unidade que eu nunca visitei, se parece com a aula que a gente
          imaginou em 2009. Não foi o contrato que fez isso. Foi gente repetindo a mesma coisa direito, todos os
          dias, por 17 anos.
        </p>
        <p className="em-destaque">
          É por isso que eu prefiro traduzir os números assim: por trás de cada unidade existe um franqueado que
          decidiu apostar o próprio patrimônio na nossa ideia, uma equipe que aprendeu um método e escolheu
          segui-lo, e um aluno que voltou. Principalmente o aluno que voltou. Ele é o único juiz que não erra.
        </p>
      </Corpo>
      <Foto
        src={assinatura}
        className="em-foto-historica relative -mx-[64px] mt-[24px] min-h-0 flex-1"
        posicao="50% 40%"
        legenda="Primeira franquia assinada"
      />
    </Miolo>
  </Pagina>
);

// o que estes números dizem
export const Carta4 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 3}>
    <div className="absolute left-[64px] right-[64px] top-[64px]">
      <Rotulo>O que estes números dizem</Rotulo>
      <Corpo className="mt-[18px]">
        <p className="em-sem-recuo">
          <span className="em-destaque text-[var(--em-vinho)]">17 anos</span> é tempo suficiente para o método ter
          sido testado em cenários muito diferentes - e ter sobrevivido a todos eles.{' '}
          <span className="em-destaque text-[var(--em-vinho)]">500 unidades</span> alcançadas em setembro
          significa que muitos empresários independentes executam o mesmo padrão, por convicção e não por
          cobrança. Muitos dos franqueados foram nossos alunos e olhavam como uma oportunidade de negócio entregar
          um serviço que transforma a qualidade de vida das pessoas e se mobilizaram para construir esta jornada
          conosco.
        </p>
      </Corpo>
      <Citacao tamanho={36} className="mt-[34px]">
        “Vamos abrir uma para você sentir como é e depois a gente vai crescendo junto.”
      </Citacao>
      <p className="em-serif mt-[12px] text-[18.5px] leading-[1.45] text-[var(--em-tinta)]/75">
        Crescer com consistência também é crescer ao lado de quem já conhece e acredita na marca.
      </p>
    </div>
    <div className="absolute bottom-[86px] left-[64px] right-[64px] grid grid-cols-[1fr_300px] items-end gap-[34px]">
      <div>
      {/* a matéria da PEGN: título aqui, capa ao lado */}
      <img
        src={materia500Titulo}
        alt="Pequenas Empresas & Grandes Negócios: Rede de pilates aposta em tecnologia e mira 500 unidades no Brasil em 2026"
        draggable={false}
        className="mb-[26px] w-full select-none bg-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)]"
      />
      <p className="em-display text-[30px] font-semibold uppercase leading-[1]">
        E temos mais pontos até dezembro: contratos já em andamento que encerram o ano acima deste marco.{' '}
        <span className="text-[var(--em-vinho)]">Crescimento é consequência, não meta de vaidade.</span>
      </p>
      </div>
      <img
        src={materia500}
        alt="Matéria: Rede de pilates aposta em tecnologia e mira 500 unidades no Brasil em 2026"
        draggable={false}
        className="w-full select-none shadow-[0_18px_40px_-18px_rgba(0,0,0,0.5)]"
      />
    </div>
  </Pagina>
);

// 9 — a parte que aniversário costuma esconder
export const Carta5 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 4}>
    <Foto src={equipeNoEstudio} className="em-foto-historica absolute inset-x-0 top-0 h-[500px] w-full" posicao="50% 40%" />
    <div className="absolute left-[64px] right-[64px] top-[540px]">
      <p className="em-display text-[46px] font-bold uppercase leading-[0.95]">
        Agora a parte que aniversário costuma esconder.
      </p>
      <p className="em-serif mt-[16px] text-[20.5px] font-semibold leading-[1.45]">
        Todo aniversário traz consigo um processo de reflexão, e a retrospectiva deste ano não foi diferente: ela
        trouxe conquistas, mas trouxe também pontos de atenção.
      </p>
      <Corpo className="mt-[16px]">
        <p className="em-sem-recuo">Não vou tratá-los como detalhe, porque não são.</p>
        <p>
          Eu sei que o esperado, num ano de marco, seria apenas comemorar. Mas um aniversário que só celebra não
          serve para nada. O valor de olhar para trás está exatamente em enxergar o que precisa mudar — e ter a
          honestidade de dizer isso em voz alta, na primeira página da nossa primeira edição.
        </p>
      </Corpo>
    </div>
  </Pagina>
);

// 10 — resumindo: os pontos de atenção, com o Douglas no escada barril ao lado
export const Carta6 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 5}>
    <img
      src={escadaBarril}
      alt=""
      draggable={false}
      className="em-foto-historica absolute right-0 top-0 h-[930px] w-[300px] select-none object-cover"
      style={{ objectPosition: '30% 40%' }}
    />
    <div className="absolute bottom-[84px] left-[64px] top-[64px] flex w-[410px] flex-col">
      <Corpo colunas={1} className="!text-[17px]">
        <p className="em-sem-recuo">
          Resumindo, como organização temos clareza do que precisamos atuar e algumas idéias já surgiram de como
          levar isso adiante. Alguns exemplos que teremos ações nos próximos encontros e, é claro, conto com
          sugestões e feedbacks para ser uma jornada prazerosa e de crescimento, mesmo!
        </p>
      </Corpo>
      <div className="mt-[20px] border-t-2 border-[var(--em-tinta)] pt-[18px]">
        <Lista
          className="!text-[17px]"
          itens={[
            'A distância entre quem decide e quem opera',
            'Crescemos mais rápido do que a nossa capacidade de estar perto',
            'A velocidade com que a boa prática circula e a consistência do padrão em escala.',
          ]}
        />
      </div>
      <p className="em-display mt-[22px] text-[31px] font-bold uppercase leading-[0.98] text-[var(--em-vinho)]">
        O que era simples de sustentar com dezenas de unidades exige método com +500 studios em operação.
      </p>
      <Foto
        src={sharkTank2}
        className="em-foto-historica relative mt-[22px] min-h-0 w-full flex-1"
        posicao="50% 35%"
        legenda="Participação do Shark Tank"
      />
    </div>
  </Pagina>
);

// 11 — o que vem pela frente
export const Carta7 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 6}>
    <Foto src={equipeNaRecepcao} className="em-foto-historica absolute inset-x-0 top-0 h-[340px] w-full" posicao="50% 35%" />
    <div className="absolute left-[64px] right-[64px] top-[376px]">
      <Corpo>
        <p className="em-sem-recuo">
          Nos próximos meses, vamos concentrar esforços em cada um desses pontos. Não com discurso: com estrutura.
        </p>
        <p className="em-destaque">
          Esta revista é a primeira peça disso — um lugar fixo, mensal, onde os líderes das áreas da sede explicam
          o porquê das coisas, e não apenas o que muda no dia a dia da operação.
        </p>
      </Corpo>
      <ul className="em-sans mt-[16px] flex flex-wrap gap-[8px]">
        {[
          'Arquitetura',
          'Equipe de Operação com consultoras',
          'Recrutamento',
          'Expansão',
          'Marketing',
          'Tecnologia',
          'Academy',
          'Store',
          'e muito mais!',
        ].map((a) => (
          <li
            key={a}
            className="border border-[var(--em-vinho)]/40 px-[12px] py-[5px] text-[14px] font-semibold uppercase tracking-[0.1em] text-[var(--em-vinho)]"
          >
            {a}
          </li>
        ))}
      </ul>
      <Corpo className="mt-[16px]">
        <p className="em-sem-recuo">
          Junto com a revista, vêm encontros, um fluxo constante de boas práticas e avisos para que você não
          dependa apenas da sua memória para lembrar.
        </p>
        <p>
          Vocês vão ouvir falar de propósito, união, ritmo e execução ao longo do ano. Não é um slogan novo. É o
          nome que demos ao que já fazíamos bem quando éramos pequenos e que precisamos voltar a fazer com
          disciplina agora que somos grandes.
        </p>
      </Corpo>
    </div>
  </Pagina>
);

// 12 — a pergunta que não mudou, a assinatura e os sócios de ponta a ponta
export const Carta8 = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} numero={P + 7}>
    {/* os sócios, recortados, na base da página */}
    <img
      src={socios}
      alt="Os sócios da Pure Pilates"
      draggable={false}
      className="absolute bottom-[-30px] left-[40px] w-[740px] max-w-none select-none"
      style={{
        maskImage: 'linear-gradient(to top, transparent 0%, #000 20%)',
        WebkitMaskImage: 'linear-gradient(to top, transparent 0%, #000 20%)',
      }}
    />
    <Miolo>
      <Rotulo>A pergunta que não mudou</Rotulo>
      <p className="em-display mt-[10px] text-[29px] font-semibold uppercase leading-[0.98]">
        Em 2009, antes de existir rede, franquia ou manual, a pergunta era uma só: essa pessoa que entrou aqui
        hoje vai sair melhor do que entrou?
      </p>
      <Corpo className="mt-[14px] !text-[16.5px]">
        <p className="em-sem-recuo">
          17 anos e 500 unidades depois, continua sendo a única pergunta que importa. Tudo o que construímos existe
          para que a resposta seja sim, em qualquer estúdio, em qualquer terça-feira à noite.
        </p>
        <p>
          Obrigado a cada franqueado que assinou, abriu e sustentou uma unidade. Obrigado a cada pessoa da nossa
          equipe que acredita que o que faz todos os dias muda vidas para melhor — porque muda mesmo, e isso não é
          força de expressão.
        </p>
        <p className="em-destaque">
          Estamos começando a melhor parte da nossa história e agora com alguns registros reais do passado.
        </p>
      </Corpo>
      {/* a assinatura vem logo depois do texto, acima da foto */}
      <div className="mt-[12px] text-right">
        <div className="em-display text-[44px] font-extrabold uppercase leading-none text-[var(--em-vinho)]">Douglas</div>
        <div className="em-sans mt-[2px] text-[13px] font-bold uppercase tracking-[0.2em]">CEO • Pure Pilates</div>
      </div>
    </Miolo>
  </Pagina>
);
