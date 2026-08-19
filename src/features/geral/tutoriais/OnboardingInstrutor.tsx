import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronLeft,
  Download,
  Copy,
  Check,
  Film,
  CalendarDays,
  Smile,
  Target,
  UserPlus,
  ClipboardList,
  Footprints,
  CheckSquare,
  AlertTriangle,
  Ban,
  Handshake,
  Star,
  MessageCircle,
  Sparkles,
  Rocket,
  Gift,
  GraduationCap,
} from 'lucide-react';

// Onboarding do Instrutor — guia reconstruído em HTML nativo (conteúdo original
// preservado, sem alterações), no visual da marca. PDF disponível só p/ download.
const PDF = '/guias/onboarding-instrutor.pdf';

const Section = ({ children }: { children: ReactNode }) => (
  <section className="border-t border-primary/15 px-6 py-9 sm:px-10 sm:py-11 lg:px-14">
    <div className="max-w-4xl">{children}</div>
  </section>
);

const SectionHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <header className="mb-6">
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">{eyebrow}</p>
    <h2 className="text-2xl font-black tracking-tight uppercase leading-[1.05] text-[#1e1e1e] sm:text-[2rem]">{title}</h2>
    <div className="mt-4 h-1 w-16 rounded-full bg-primary" />
  </header>
);

const SubHeading = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <h3 className="mb-3 mt-8 flex items-center gap-2.5 text-lg font-bold text-primary">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
      <Icon className="h-4 w-4" />
    </span>
    {children}
  </h3>
);

const MiniHeading = ({ children }: { children: ReactNode }) => (
  <h4 className="mb-1.5 mt-6 font-bold text-[#1e1e1e]">{children}</h4>
);

const Pill = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-3 mt-7 inline-flex rounded-full border-2 border-primary px-4 py-1.5 text-base font-bold text-primary">
    {children}
  </h3>
);

const P = ({ children }: { children: ReactNode }) => (
  <p className="mb-3 text-[15px] leading-relaxed text-[#2b2b2b]">{children}</p>
);

const Lead = ({ children }: { children: ReactNode }) => (
  <p className="mb-4 text-base leading-relaxed text-[#2b2b2b] sm:text-lg">{children}</p>
);

const Callout = ({ eyebrow, children }: { eyebrow: string; children: ReactNode }) => (
  <div className="mt-7 rounded-2xl bg-primary px-6 py-5 text-white">
    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white/70">{eyebrow}</p>
    <p className="font-semibold leading-snug">{children}</p>
  </div>
);

const CheckItem = ({ children }: { children: ReactNode }) => (
  <li className="flex items-start gap-2.5 text-[15px] leading-relaxed text-[#2b2b2b]">
    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
    <span>{children}</span>
  </li>
);

const Bullet = ({ children }: { children: ReactNode }) => (
  <li className="flex gap-2 text-[15px] leading-relaxed text-[#2b2b2b]">
    <span className="text-primary">•</span>
    <span>{children}</span>
  </li>
);

// Mensagem que o franqueado envia ao instrutor no WhatsApp junto com o PDF.
// Fica FORA do <article> do material de onboarding — é conteúdo operacional do
// franqueado, não faz parte do guia entregue ao instrutor.
const montarMensagem = (nome: string) => `Olá, ${nome}! ❤️ Seja muito bem-vindo(a) à equipe Pure Pilates!

Estamos muito felizes em ter você com a gente! 🥰 Para começar essa jornada, queremos compartilhar alguns pontos importantes que fazem parte da nossa rotina e do nosso padrão de atendimento:

👕 Apresentação profissional
O uso do uniforme é obrigatório. Mantenha o cabelo preso, não utilize tênis dentro da sala e use meias durante as aulas. Sua apresentação também faz parte da experiência que oferecemos aos nossos alunos.

🧹 Organização do Studio
Mantenha o ambiente sempre limpo e organizado. Ao finalizar sua aula, organize os equipamentos e deixe o espaço preparado para o próximo atendimento. A organização é responsabilidade de todos!

⏱️ Duração das aulas
As aulas têm 55 minutos, e esse período deve ser dedicado integralmente aos alunos e à condução da aula. Evite atrasos e não encerre a aula antes do horário.

👀 Atenção durante as aulas
Esteja sempre presente e atento aos alunos. Observe a execução dos exercícios, faça as correções e ofereça as orientações necessárias durante toda a aula.

🧘 Aulas personalizadas
Cada aluno é único! Considere sempre seus objetivos, necessidades, limitações e evolução. Adapte a aula de acordo com cada pessoa e evite aplicar a mesma aula para todos.

📝 Prontuário do aluno
Na primeira aula do aluno, o instrutor deve preencher o prontuário completo no App Pure Pilates. Essas informações são fundamentais para conhecermos o aluno e oferecermos um atendimento seguro e personalizado.

📈 Evolução do aluno
Ao final de cada aula, é obrigatório registrar a evolução do aluno no App Pure Pilates. Registre o que foi trabalhado, a evolução observada e qualquer informação importante para a continuidade do atendimento.

🍎 Alimentação
Refeições e lanches devem ser realizados somente durante os intervalos, fora do horário de atendimento.

🔴 Wellhub
Nos atendimentos pelo Wellhub, lembre-se de solicitar o check-in antes do início da aula.

🥰 Aulas experimentais
Sempre que tiver uma aula experimental, avise a gestão. Assim, conseguimos acompanhar o atendimento, oferecer o suporte necessário e proporcionar ao aluno a melhor experiência possível.

❤️ E o mais importante: você não precisa saber tudo de uma vez! Em caso de dúvida, dificuldade ou qualquer situação que precise de orientação, procure a gestão. Estamos aqui para apoiar seu desenvolvimento e ajudar você a fazer parte da nossa equipe.

Seja muito bem-vindo(a) à família Pure Pilates! Estamos muito felizes em ter você com a gente!`;

const MensagemWhatsApp = () => {
  const [nome, setNome] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Sem nome preenchido, mantém o marcador [nome] para o franqueado editar no WhatsApp.
  const mensagem = montarMensagem(nome.trim() || '[nome]');

  const copiar = async () => {
    await navigator.clipboard.writeText(mensagem);
    setCopiado(true);
    toast.success('Mensagem copiada!', { description: 'Cole no WhatsApp e envie junto com o PDF.' });
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <section className="mb-6 rounded-2xl border border-[#25D366]/35 bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-foreground sm:text-lg">
            Mensagem de boas-vindas para o WhatsApp
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Para o franqueado copiar e enviar ao instrutor junto com o PDF. Não faz parte do material de onboarding
            abaixo.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do instrutor(a)"
          className="sm:max-w-xs"
          aria-label="Nome do instrutor(a)"
        />
        <Button onClick={copiar} className="gap-2 sm:shrink-0">
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? 'Copiado!' : 'Copiar mensagem'}
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Digite o nome para preencher automaticamente. Se deixar em branco, a mensagem sai com{' '}
        <span className="font-semibold">[nome]</span> para você editar no WhatsApp.
      </p>

      <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border bg-muted/40 p-4">
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">{mensagem}</p>
      </div>
    </section>
  );
};

const OnboardingInstrutor = () => (
  <MainLayout>
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/tutoriais"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Guias e Tutoriais
        </Link>
        <a href={PDF} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Baixar PDF
          </Button>
        </a>
      </div>

      <MensagemWhatsApp />

      <article
        className="overflow-hidden rounded-2xl border border-[#E4D8C0] bg-[#F2EBDD] shadow-sm"
        style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
      >
        {/* Capa */}
        <header className="px-6 py-10 sm:px-10 sm:py-12">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Onboarding</p>
          <h1 className="text-3xl font-black tracking-tight uppercase leading-[1.05] text-[#1e1e1e] sm:text-4xl">
            Bem-vindo(a) à Pure Pilates
          </h1>
          <div className="mt-4 h-1 w-20 rounded-full bg-primary" />
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#2b2b2b] sm:text-lg">
            Que bom ter você com a gente! Guia do instrutor(a) da maior rede de Pilates da{' '}
            <strong>América Latina.</strong>
          </p>
        </header>

        <div className="bg-primary px-6 py-8 sm:px-10">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              01 · Sua Jornada
            </span>
            <span className="rounded-full border border-white/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              02 · Sua Atuação
            </span>
          </div>
          <p className="mt-5 text-2xl font-black tracking-tight uppercase italic leading-tight text-white sm:text-3xl">
            Transformar vidas através do movimento.
          </p>
          <p className="mt-4 tracking-[0.15em] text-white/85">purepilates.com.br</p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
            Documento de uso interno
          </p>
        </div>

        {/* Abertura */}
        <Section>
          <SectionHeader eyebrow="Abertura" title="Bem-vindo(a) à Pure Pilates" />
          <Lead>Que bom ter você com a gente!</Lead>
          <P>
            A partir de agora, você faz parte do time da maior rede de Pilates da América Latina e terá um papel
            muito importante na nossa missão: <strong>transformar vidas através do movimento.</strong>
          </P>
          <P>
            Mais do que conduzir aulas, acreditamos que nossos instrutores ajudam a criar experiências, desenvolver
            confiança e promover bem-estar todos os dias.
          </P>
        </Section>

        {/* Quem somos */}
        <Section>
          <SectionHeader eyebrow="Quem somos" title="Quem somos" />
          <P>A Pure Pilates nasceu com o propósito de tornar o Pilates mais acessível, profissional e transformador.</P>
          <P>
            Hoje, estamos presentes em centenas de estúdios pelo Brasil, conectando milhares de pessoas a uma vida
            com mais saúde, movimento e qualidade de vida.
          </P>
          <P>Na Pure Pilates, acreditamos que a técnica e o acolhimento caminham juntos.</P>
          <P>
            Queremos que cada aluno se sinta seguro, bem recebido e confiante durante sua jornada. Por isso,
            valorizamos profissionais que ensinam com excelência, se comunicam com empatia e entendem que cada pessoa
            possui objetivos, limitações e histórias diferentes.
          </P>
          <P>
            Mais do que aplicar exercícios, buscamos criar experiências que façam nossos alunos quererem voltar todos
            os dias.
          </P>
        </Section>

        {/* Desenvolvimento */}
        <Section>
          <SectionHeader eyebrow="Desenvolvimento" title="Seu desenvolvimento nunca para" />
          <Lead>
            Na Pure Pilates, acreditamos que ensinar também é estar em constante aprendizado. Por isso, você terá
            acesso a diversas oportunidades de desenvolvimento ao longo da sua jornada conosco.
          </Lead>

          <SubHeading icon={Film}>Pilates Play</SubHeading>
          <P>
            Todos os instrutores da Pure Pilates têm acesso ao <strong>Pilates Play,</strong> nossa plataforma
            exclusiva de conteúdos. Lá você encontra:
          </P>
          <ul className="mb-4 space-y-2">
            <CheckItem>Repertórios prontos de aulas</CheckItem>
            <CheckItem>Sugestões de exercícios e progressões</CheckItem>
            <CheckItem>Conteúdos técnicos</CheckItem>
            <CheckItem>Materiais de apoio para o dia a dia no estúdio</CheckItem>
            <CheckItem>Atualizações constantes para ampliar seu conhecimento</CheckItem>
          </ul>
          <P>Uma ferramenta criada para otimizar sua rotina e apoiar sua evolução profissional.</P>

          <MiniHeading>Aulões Presenciais</MiniHeading>
          <P>
            Realizados mensalmente em São Paulo, os aulões abordam diferentes práticas e aplicações do Método
            Pilates, ampliando repertório, refinando a técnica e promovendo a troca entre profissionais da rede.
          </P>

          <MiniHeading>Troca de Experiência</MiniHeading>
          <P>
            Um encontro online, gratuito e aberto para toda a rede de instrutores. É um espaço para compartilhar
            vivências, esclarecer dúvidas, discutir casos práticos e aprofundar conhecimentos sobre o Método Pilates.
          </P>
          <P>Mais do que treinamentos, são momentos de conexão, aprendizado e evolução profissional.</P>

          <Callout eyebrow="E o melhor">
            E o melhor: todos esses encontros são 100% gratuitos para quem faz parte do time Pure Pilates.
          </Callout>
        </Section>

        {/* Pure Academy */}
        <Section>
          <SectionHeader eyebrow="Pure Academy" title="Pure Academy" />
          <Lead>
            A Pure Academy é o núcleo de formação e capacitação da Pure Pilates, criado para apoiar o desenvolvimento
            contínuo dos nossos profissionais.
          </Lead>
          <P>Aqui você encontra oportunidades para evoluir em todas as etapas da sua carreira.</P>

          <Pill>Formação em Pilates</Pill>
          <P>
            Curso completo voltado para Educadores Físicos e Fisioterapeutas que desejam atuar com segurança,
            excelência e alinhamento ao Método Pilates.
          </P>

          <Pill>Workshops de Aperfeiçoamento</Pill>
          <P>
            Quem faz parte do time Pure Pilates conta com condições especiais para continuar se desenvolvendo através
            de capacitações como:
          </P>
          <ul className="mb-3 space-y-1.5">
            <Bullet>Pilates Clássico</Bullet>
            <Bullet>Pilates para Gestantes</Bullet>
            <Bullet>Pilates Avançado</Bullet>
            <Bullet>E muitos outros temas que acompanham as necessidades do mercado e dos nossos alunos.</Bullet>
          </ul>

          <Pill>Pilates na Prática</Pill>
          <P>Terminou sua formação e quer ganhar mais confiança no dia a dia do estúdio?</P>
          <P>
            No Pilates na Prática, você participa de atendimentos com alunos reais, acompanhado por profissionais
            experientes que orientam, corrigem e compartilham conhecimentos adquiridos ao longo da carreira.
          </P>
          <P>
            Uma experiência rica, prática e transformadora para quem deseja acelerar seu desenvolvimento
            profissional.
          </P>

          <Pill>Nosso Compromisso com Você</Pill>
          <P>
            Queremos que você se sinta preparado, seguro e cada vez mais capacitado para entregar a melhor
            experiência aos nossos alunos.
          </P>
          <P>
            Por isso, investir no desenvolvimento dos nossos instrutores não é um diferencial. É parte da nossa
            essência.
          </P>
        </Section>

        {/* Sua atuação no studio */}
        <Section>
          <SectionHeader eyebrow="Sua atuação" title="Sua atuação no studio" />
          <Lead>
            Na Pure Pilates, acreditamos que uma excelente experiência começa muito antes da aula e continua mesmo
            após o aluno deixar o estúdio.
          </Lead>
          <P>Por isso, cada instrutor tem um papel fundamental na construção da jornada dos nossos alunos.</P>

          <SubHeading icon={CalendarDays}>Prepare-se Antes de Cada Aula</SubHeading>
          <P>Antes de iniciar seus atendimentos, consulte a agenda do dia e conheça os alunos que estarão com você.</P>
          <P>
            Verifique o histórico, acompanhe a evolução registrada e esteja atento aos objetivos, limitações,
            observações e necessidades específicas de cada um.
          </P>
          <P>Quanto mais você conhece o aluno, mais personalizada e eficiente será sua condução.</P>

          <SubHeading icon={Smile}>Receba Cada Aluno com Atenção</SubHeading>
          <P>O Acolhimento faz parte da experiência Pure.</P>
          <P>
            Receba seus alunos de forma cordial, com simpatia e atenção. Demonstre interesse genuíno pelo bem-estar
            deles e esteja disponível para ouvir como estão se sentindo naquele dia.
          </P>
          <P>Pequenos gestos fazem com que o aluno se sinta valorizado e seguro dentro do estúdio.</P>

          <SubHeading icon={Target}>Adapte Sua Comunicação</SubHeading>
          <P>Cada aluno possui uma forma diferente de aprender.</P>
          <P>
            Alguns respondem muito bem aos comandos verbais, enquanto outros precisam visualizar o movimento para
            executá-lo com mais confiança.
          </P>
          <P>
            Sempre que necessário, realize demonstrações e utilize estratégias que facilitem o entendimento do
            exercício, transmitindo segurança e promovendo uma experiência positiva durante a aula.
          </P>

          <SubHeading icon={UserPlus}>Ao Receber um Novo Aluno</SubHeading>
          <P>Os primeiros atendimentos são essenciais para a construção da confiança.</P>
          <P>Procure entender suas queixas, limitações, histórico, objetivos e expectativas em relação ao Pilates.</P>
          <P>
            Essas informações serão a base para a elaboração de uma aula individualizada, respeitando as necessidades
            e metas de cada pessoa.
          </P>

          <SubHeading icon={ClipboardList}>Registre e Acompanhe a Evolução</SubHeading>
          <P>A evolução do aluno deve ser acompanhada continuamente.</P>
          <P>
            Após as aulas, mantenha o histórico sempre atualizado em nosso aplicativo, registrando observações
            relevantes, avanços, dificuldades, adaptações realizadas e demais informações importantes para o
            acompanhamento da jornada do aluno.
          </P>
          <P>
            Esse registro permite que toda a equipe acompanhe seu desenvolvimento, contribui para a qualidade do
            atendimento e ajuda a evidenciar as conquistas alcançadas ao longo do tempo.
          </P>
          <P>
            <strong>Lembre-se:</strong> acompanhar a evolução é tão importante quanto conduzir uma boa aula.
          </P>

          <SubHeading icon={Footprints}>Uso de Meias no Estúdio</SubHeading>
          <P>
            Não é permitido circular pelo estúdio com calçado. Instrutores e alunos devem estar sempre de meia dentro
            da área de prática, garantindo segurança e alinhamento com os padrões da Pure Pilates.
          </P>

          <SubHeading icon={CheckSquare}>Presença e Falta</SubHeading>
          <P>
            Além do registro de evolução, é obrigatório marcar a presença ou falta de cada aluno atendido em nosso
            aplicativo, garantindo o acompanhamento correto da frequência e do histórico de cada aluno.
          </P>

          <SubHeading icon={AlertTriangle}>Concorrência Desleal</SubHeading>
          <P>
            O instrutor não pode utilizar sua posição, seus vínculos ou o acesso aos alunos da Pure Pilates para
            captar, direcionar ou transferir alunos para negócio próprio ou concorrente.
          </P>
          <P>
            Também é proibido utilizar contatos, listas, grupos, sistemas ou informações dos alunos obtidos em razão
            da atuação na unidade para fins particulares.
          </P>
          <P>
            Essa conduta pode caracterizar desvio ilícito de clientela e concorrência desleal, conforme o{' '}
            <strong>art. 195, III, da Lei nº 9.279/1996 (Lei da Propriedade Industrial).</strong> O STJ reconhece que
            o desvio de clientela praticado durante a relação profissional pode configurar concorrência desleal.
          </P>
          <P>
            O descumprimento poderá resultar em medidas contratuais e legais cabíveis, incluindo rescisão contratual,
            quando aplicável, e eventual reparação por perdas e danos.
          </P>

          <SubHeading icon={Ban}>Comércio não autorizado</SubHeading>
          <P>
            Não é permitido comercializar, divulgar ou oferecer produtos ou serviços não vinculados à Pure Pilates
            dentro da unidade.
          </P>
          <P>
            Isso inclui suplementos, estética, personal training avulso, cursos, métodos ou qualquer outro serviço
            particular, durante as aulas ou em qualquer espaço do studio.
          </P>
          <P>
            Toda atividade comercial realizada dentro da unidade deve estar previamente autorizada e vinculada à Pure
            Pilates e aos seus produtos e serviços oficiais.
          </P>
        </Section>

        {/* Aula experimental */}
        <Section>
          <SectionHeader eyebrow="Aula experimental" title="Aula experimental: o primeiro passo para encantar" />
          <Lead>
            A aula experimental é muito mais do que uma avaliação. Ela é a oportunidade de apresentar a experiência
            Pure Pilates e mostrar ao futuro aluno que ele encontrou o lugar certo para alcançar seus objetivos.
          </Lead>
          <P>Por isso, cada detalhe importa.</P>

          <SubHeading icon={Handshake}>Construa Conexão Antes de Ensinar</SubHeading>
          <P>Receba o aluno de forma acolhedora e demonstre interesse genuíno por sua história.</P>
          <P>
            Entenda suas dores, limitações, objetivos e expectativas. Faça perguntas, escute com atenção e mostre que
            você está ali para ajudá-lo em sua jornada.
          </P>
          <P>Quando o aluno se sente ouvido, ele cria confiança.</P>

          <SubHeading icon={Target}>Personalize a Experiência</SubHeading>
          <P>Utilize as informações coletadas para conduzir uma aula alinhada às necessidades daquele aluno.</P>
          <P>
            Evite aplicar uma aula padrão. Mostre que cada atendimento é pensado de forma individualizada e que seu
            desenvolvimento será acompanhado de perto.
          </P>
          <P>O aluno precisa perceber que existe um plano para ajudá-lo a alcançar seus objetivos.</P>

          <SubHeading icon={Star}>Gere Pequenas Conquistas</SubHeading>
          <P>Sempre que possível, proporcione ao aluno uma experiência de sucesso durante a aula.</P>
          <P>
            Ajude-o a perceber algo que ele conseguiu fazer melhor, um movimento que executou com qualidade ou uma
            sensação positiva após os exercícios.
          </P>
          <P>Quando o aluno sai da aula percebendo um benefício, ele passa a enxergar valor no Pilates.</P>

          <SubHeading icon={MessageCircle}>Explique os Benefícios</SubHeading>
          <P>Durante a aula, conecte os exercícios aos objetivos do aluno.</P>
          <P>
            Ao invés de apenas orientar o movimento, explique como aquele exercício pode ajudá-lo a melhorar sua
            postura, reduzir dores, ganhar mobilidade, fortalecer o corpo ou alcançar suas metas pessoais.
          </P>
          <P>Isso torna a experiência mais significativa e aumenta o engajamento.</P>

          <SubHeading icon={Sparkles}>Faça o Aluno se Sentir Especial</SubHeading>
          <P>
            Chame-o pelo nome, mantenha contato visual, celebre suas conquistas e demonstre atenção aos detalhes
          </P>
          <P>As pessoas lembram de como foram tratadas.</P>
          <P>
            Muitas vezes, o que faz um aluno se matricular não é apenas a aula, mas a sensação de acolhimento,
            cuidado e confiança que encontrou no estúdio.
          </P>

          <SubHeading icon={Rocket}>Finalize com Segurança</SubHeading>
          <P>
            Ao término da aula, converse sobre o que foi observado, destaque os pontos positivos e mostre como o
            Pilates pode ajudá-lo a alcançar seus objetivos.
          </P>
          <P>Transmita segurança, clareza e entusiasmo com a jornada que ele poderá construir conosco.</P>

          <Callout eyebrow="Lembre-se">
            Uma aula experimental de sucesso não é aquela em que o aluno conhece todos os exercícios. É aquela em que
            ele sai do estúdio com a certeza de que deseja voltar.
          </Callout>
        </Section>

        {/* Fique por dentro */}
        <Section>
          <SectionHeader eyebrow="Fique por dentro" title="Fique por dentro!" />

          <SubHeading icon={Gift}>Indique Pilates e Ganhe Massagem</SubHeading>
          <P>
            Caso algum aluno pergunte sobre indicação de amigos ou familiares, informe que a Pure Pilates possui o
            programa <strong>“Indique Pilates e Ganhe Massagem”:</strong> ao indicar um novo aluno que se matricule, o
            aluno indicador ganha uma massagem como recompensa. Oriente o aluno a falar com a recepção do estúdio para
            saber como participar e registrar a indicação
          </P>

          <SubHeading icon={GraduationCap}>Estagiários da Pós em Pilates — FMU</SubHeading>
          <P>
            Recebemos estagiários da <strong>Pós-Graduação em Pilates da FMU,</strong> que aparecerão normalmente na
            agenda do dia. É importante recebê-los bem, com a mesma atenção e cordialidade dedicadas aos alunos, e
            orientá-los durante todo o período equivalente ao tempo da aula em que estiverem presentes, explicando a
            condução, as adaptações realizadas e as observações sobre o aluno atendido.
          </P>
        </Section>

        {/* Encerramento */}
        <div className="bg-primary px-6 py-12 sm:px-10">
          <p className="text-2xl font-black tracking-tight uppercase italic leading-tight text-white sm:text-3xl">
            Seu desenvolvimento nunca para.
          </p>
          <p className="mt-4 max-w-lg leading-relaxed text-white/90">
            Por isso, investir no desenvolvimento dos nossos instrutores não é um diferencial. É parte da nossa
            essência.
          </p>
          <div className="mt-6 h-px w-40 bg-white/40" />
          <p className="mt-4 tracking-[0.15em] text-white">purepilates.com.br</p>
        </div>
      </article>
    </div>
  </MainLayout>
);

export default OnboardingInstrutor;
