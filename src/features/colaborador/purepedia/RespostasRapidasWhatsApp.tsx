import { ArtigoShell, Capa, Lista, MensagemCopiavel, SecHead, Secao } from './artigoUI';

/**
 * PurePedia — GUIA DE RESPOSTA RÁPIDAS PARA ATENDIMENTO VIA WHATSAPP.
 *
 * TRANSCRIÇÃO FIEL do PDF original "Respostas automaticas - PP" (Drive:
 * Purepedia - Artigos/Manuais). Os títulos e a ordem das dez seções são os do
 * documento. Não resumir, não reordenar, não acrescentar.
 *
 * Sobre o texto das mensagens:
 * - Os asteriscos (*assim*) são PROPOSITAIS: é a marcação de negrito do
 *   WhatsApp, e some se alguém "limpar". Precisam ir junto na hora de copiar.
 * - Os escapes da conversão do PDF (\! \# \* \>) foram removidos; os asteriscos
 *   de negrito, não.
 * - Os parênteses e o "xx/xx" são os campos que o atendente preenche, como no
 *   original.
 */

const MSG_NAO_INAUGUROU = `Olá! Como vai? Estamos felizes em receber o seu contato.

Somos uma Unidade Pure Pilates que está prestes a inaugurar! Estamos ansiosos para te receber em nosso studio. Iremos inaugurar na semana XXX e auxiliar na vivência de um bem-estar!

#VemPraPure`;

const MSG_IRA_INAUGURAR = `Passando para informar que o nosso Studio de Pilates será inaugurado na (dia da semana), dia xx/xx! Neste período inaugural teremos descontos e brinde especiais para você.

Os nossos professores estarão à disposição para lhe fornecer uma experiência de acordo com as suas necessidades e após a aula iremos te explicar detalhadamente todos os nossos programas.

*Vamos agendar uma aula experimental sem compromisso para conhecer o nosso Studio?*

*NOME DO ESTÚDIO*
*Inauguração:* xx/xx (dia da semana), a partir das (horário de início).
*Funcionamento:* Segunda-feira à sexta-feira, das 07:00 às 21:00.
*Endereço:* Endereço do estúdio
*Atendemos GymPass a partir do plano (plano que o estúdio atende).*

Venha nos conhecer! *#VemPraPure*`;

const MSG_SAUDACAO = `Olá! Tudo bem? Prazer, sou a/o (nome do atendente) da Pure Pilates – (nome do estúdio).

Como eu posso te ajudar?`;

const MSG_INFORMACOES_GERAIS = `Você conhece o método Pilates? Gostaria de que eu te explicasse os benefícios?

Pilates é um Método a atividade que faz bem para a coluna, postura, posicionamento, fortalecimento muscular, melhora a qualidade do sono, alivia o stress, trabalha o alongamento e tonifica o músculo.

Nós trabalhamos no máximo com 4 alunos por professor, tendo 55 minutos de duração e temos programas a partir de R$00,00 reais (valor do cadilac 1x por semana), os valores vão variando de acordo com quantidade de vezes por semana em que você deseja realiza as aulas.

Oferecemos também uma aula experimental e sem compromisso para você conhecer o nosso trabalho e professores, após a aula iremos te atender para te explicar detalhadamente todos os nossos programas. *Vamos agendar uma aula gratuita para você? Qual o melhor dia e horário para você?* Assim poderá conhecer melhor o nosso trabalho.

Endereço: Endereço do estúdio. Horário de funcionamento: .............

Estou à disposição.`;

const MSG_CONFIRMACAO_EXPERIMENTAL = `Olá! Tudo bem? Sou a/o (nome do atendente) da Pure Pilates – (nome do estúdio).

Vi que sua Aula Experimental está próxima, os nossos instrutores estão ansiosos para te receber!

É importante o preenchimento da *Ficha de Avaliação* direcionada para o seu e-mail, assim poderemos aplicar uma aula direcionada a suas necessidades. Venha com roupas confortáveis!

Posso confirmar sua presença? Aguardamos você! #VemPraPure`;

const MSG_GYMPASS = `Olá! Nós atendemos os planos a partir do Silver +.

O agendamento acontece diretamente pelo aplicativo do GymPass com no mínimo 3 horas de antecedência e possui um limite de no máximo 9 check-ins por mês, o que te permite fazer 2 aulas por semana em média. Em casos de cancelamento, são necessárias 6 horas para a atividade do dia retornar para você.

Acessando o aplicativo do GymPass, você pode buscar a unidade da Pure Pilates mais próxima. Você terá acesso à agenda com a disponibilidade de dias e horários sendo liberado para você fazer o agendamento da sua aula conforme sua preferência.

Após o agendamento e quando for realizar a sua aula, por gentileza, não se esqueça de fazer o check-in na entrada da aula.

Para qualquer questão relacionada ao aplicativo como dúvidas sobre o uso ou problemas técnicos, você pode entrar em contato diretamente com o GymPass através do site ou pelo número do suporte.`;

const MSG_PUREPASS = `Estamos animados em apresentar o nosso programa exclusivo: *PURE PASS*

*∙ O que é o Pure Pass?*
O Pure Pass é um programa mensal que oferece a você a liberdade de frequentar nossas aulas em qualquer horário, em qualquer uma de nossas unidades. Isso mesmo, sem horários fixos, para se adequar perfeitamente à sua rotina!

*∙ Benefícios do Pure Pass:*
*Flexibilidade Total:* Agende suas aulas quando for mais conveniente para você.
*Acesso Ilimitado:* Frequente qualquer uma de nossas unidades para variar suas práticas.
*Programa com ou sem Fidelização:* Escolha a opção que se adapta melhor aos seus planos.

*∙ Como funciona:*
*Escolha seu Plano:* Opte entre fidelização ou sem fidelização, de acordo com suas preferências. Tendo ciência que, quando você não possui a fidelização o encerramento é diretamente pelo aplicativo e com fidelização, você terá que entrar em contato com a unidade base escolhida para fazer ajustes no seu programa.
*Agende Livremente:* Use nossa plataforma fácil de agendamento para escolher as aulas e horários que funcionam para você.
*Experiência Personalizada:* Desfrute de uma prática consistente em qualquer lugar e a qualquer hora.

*Estamos comprometidos em tornar a sua experiência no Pure ainda mais incrível.* Se tiver alguma dúvida ou quiser aderir ao Pure Pass, entre em contato conosco!`;

const MSG_MENSALISTAS = `Olá! Gostaria de desejar boas-vindas e agradecê-lo por nos escolher como parceiro da sua saúde e do seu bem-estar.

Para você ter uma boa experiência conosco, irei lhe passar algumas informações:

∙ O nosso aplicativo está disponível na loja de aplicativos do seu celular em versão Android (através da Play Store) e IOs (App Store). Após fazer o download, basta fazer login com o seu e-mail no qual você me passou para cadastro e a senha que foi enviada no ato da matrícula. Por meio do aplicativo, você poderá avisar as faltas e reagendar as reposições, possuindo facilidade e autonomia – caso não tenha recebido a sua senha, é só avisar que reencaminho pelo WhatsApp ou E-mail.

∙ Para ter direito à reposição, as faltas devem ser avisadas com um prazo mínimo de 3 horas, neste caso, você terá até 14 dias para repor essa aula. Caso avise com mais de 48 horas de antecedência, o prazo para reposição é de até 21 dias. Lembrando que, em aula que cai em feriado não possui direito à reposição.

∙ Se precisar sair de férias ou tirar licença, basta avisar com antecedência para ser colocado no sistema. Nesses dois casos, as aulas não realizadas serão estendidas ao final do plano adquirido ou, caso preferir, poderão ser reagendadas como reposição. O mesmo vale para o período de recesso entre Natal e Ano Novo. Basta avisar com antecedência a sua escolha.

∙ Todos os programas são renovados automaticamente ao final do período, a fim de manter reservado o horário na agenda. Caso não deseje renovar, basta avisar com no mínimo 10 dias de antecedência à data final. Lembrando que se o cancelamento acontecer antes do prazo final do programa adquirido, será cobrado o valor referente ao reenquadramento das parcelas pagas em relação ao programa mais próximo, conforme explicado no ato da compra. Para mais detalhes sobre esse procedimento, consulte o contrato enviado por e-mail, estando disponível também em seu aplicativo.`;

const MSG_INDIQUE = `Olá!

Gostaria de te apresentar o nosso programa INDIQUE PILATES, onde você pode indicar um amigo ou familiar através do seu link exclusivo do programa sendo aluno Pure Pilates, seu indicado efetuando a matricula e o pagamento da primeiro mensalidade em uma de nossas unidades você receberá um voucher referente a 1 massagem relaxante em seu e-mail.

Segue as informações referente à este programa:

∙ Os clientes que indicarem amigos/familiares para serem praticantes na Pure Pilates ganham automaticamente, após a primeira mensalidade da indicação paga, o Voucher referente a 1 massagem relaxante em seu e-mail;

∙ Para ser válido, o indicado deve agendar uma aula experimental em qualquer unidade da Pure Pilates, obrigatoriamente pelo link recebido de seu indicador e efetuar a matrícula em um programa mensalista;

∙ O recebimento da premiação se dará por meio de voucher enviado por e-mail ao aluno indicador. O voucher deve ser resgatado diretamente com o parceiro ou franqueado, através das instruções contidas no e-mail recebido;

∙ A validade do voucher pode variar conforme o fornecedor do serviço e deve ser consultada no e-mail recebido;

∙ Os prêmios não poderão ser convertidos em dinheiro.

Como encontrar o seu link exclusivo? Faça seu login no aplicativo da Pure Pilates e através dele vá em Menu > Comunidade Pure Pilates > Indique Pilates. Quanto mais compartilhar, maiores serão as suas chances de ganhar.

Traga o seu amigo para 'pilatear' conosco! #VemPraPure`;

/** Seções que são uma mensagem pronta, na ordem do PDF. */
const SECOES = [
  { titulo: 'ESTÚDIO QUE AINDA NÃO INAUGUROU E NÃO POSSUI DATA:', texto: MSG_NAO_INAUGUROU },
  { titulo: 'STUDIO QUE IRÁ INAUGURAR:', texto: MSG_IRA_INAUGURAR },
  { titulo: 'MENSAGEM INICIAL (SAUDAÇÃO)', texto: MSG_SAUDACAO },
  { titulo: 'INFORMAÇÕES GERAIS:', texto: MSG_INFORMACOES_GERAIS },
  { titulo: 'CONFIRMAÇÃO DE AULA EXPERIMENTAL:', texto: MSG_CONFIRMACAO_EXPERIMENTAL },
];

const SECOES_FINAIS = [
  { titulo: 'GYMPASS:', texto: MSG_GYMPASS },
  { titulo: 'PUREPASS:', texto: MSG_PUREPASS },
  { titulo: 'ORIENTAÇÕES E REGRAS DOS ALUNOS MENSALISTAS:', texto: MSG_MENSALISTAS },
  { titulo: 'PROGRAMA INDIQUE PILATES:', texto: MSG_INDIQUE },
];

const RespostasRapidasWhatsApp = () => (
  <ArtigoShell>
    <Capa
      eyebrow="Atendimento"
      titulo="GUIA DE RESPOSTA RÁPIDAS PARA ATENDIMENTO VIA WHATSAPP"
    />

    {SECOES.map((s, i) => (
      <Secao key={s.titulo} tom={i % 2 === 0 ? 'branco' : 'cinza'}>
        <SecHead titulo={s.titulo} />
        <MensagemCopiavel rotulo="Mensagem" texto={s.texto} />
      </Secao>
    ))}

    {/* Única seção que não é mensagem pronta: é uma lista de ideias. */}
    <Secao tom="rosa">
      <SecHead titulo="IDEIAS PARA SEREM USADAS NO WHATSAPP:" />
      <Lista
        itens={[
          'Criar listas de transmissão para colocar os números dos alunos GymPass afim de enviar lembretes quinzenalmente relembrando do agendamento;',
          'Enviar lembretes para todos os alunos (de maneira geral) mensalmente OU individualmente incentivando as avaliações no Google;',
          'Publicar fotos dos alunos (c/ autorização de uso de imagem), desafios da semana, fotos do estúdio ou sorteios através do status do WhatsApp',
        ]}
      />
    </Secao>

    {SECOES_FINAIS.map((s, i) => (
      <Secao key={s.titulo} tom={i % 2 === 0 ? 'branco' : 'cinza'}>
        <SecHead titulo={s.titulo} />
        <MensagemCopiavel rotulo="Mensagem" texto={s.texto} />
      </Secao>
    ))}
  </ArtigoShell>
);

export default RespostasRapidasWhatsApp;
