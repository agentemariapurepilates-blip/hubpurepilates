import { CalendarCheck, CreditCard, FileSignature, Tv, Headset, MapPin, Wifi, MessageSquareText, MessagesSquare, ShieldCheck, type LucideIcon } from 'lucide-react';

/**
 * Registro dos artigos da PurePedia — fonte única de verdade.
 *
 * Consumido pela página-índice (cards + busca) e pelo dropdown do menu lateral,
 * pra não haver duas listas divergindo. Ao publicar um artigo novo: crie a
 * página em `src/features/colaborador/purepedia/`, registre a rota em App.tsx
 * com `requireColaborador` e acrescente a entrada aqui.
 */
export interface ArtigoPurePedia {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Termos que devem levar a este artigo, incluindo sinônimos e gírias da operação. */
  keywords: string[];
  /** Texto corrido do artigo, usado pela busca. Não aparece na tela. */
  conteudo: string;
}

export const ARTIGOS_PUREPEDIA: ArtigoPurePedia[] = [
  {
    title: 'Playbook Interno Wellhub',
    // Subtítulo do próprio documento — não inventar descrição.
    description: 'Manual operacional completo.',
    href: '/purepedia/playbook-wellhub',
    icon: Headset,
    keywords: [
      'wellhub',
      'gympass',
      'check-in',
      'checkin',
      'check in',
      'retroativo',
      'royalties',
      'divergência',
      'divergencia',
      'valores',
      'cancelamento',
      'cancelamento tardio',
      'no-show',
      'no show',
      'falta',
      'agendamento',
      'agenda',
      'integração',
      'integracao',
      'instabilidade',
      'sistema fora',
      'chamado',
      'suporte',
      'portal de parceiros',
      'parceiro',
      'experimental',
      'aula experimental',
      'lead',
      'promoção automática',
      'promocao automatica',
      'professor sobrecarregado',
      'mensagens padrão',
      'mensagens padrao',
      'playbook',
      'tratativa',
      'prazo',
      '15 dias',
      '6 horas',
      '3 horas',
    ],
    conteudo: `Regras gerais: toda divergência deve ser validada no relatório, no sistema e no portal.
      Retroativos devem ser solicitados no portal de parceiros quando aplicável. Casos financeiros
      devem ser acompanhados até a correção.
      Cenários e fluxo de tratativa: divergência de valores e royalties; check-in retroativo; Wellhub
      não liberado e integração não finalizada; instabilidade sistêmica; cancelamento de horários pela
      unidade. Cada cenário segue validar dados, acionar suporte, retornar prazo, alinhamento
      importante e acompanhar resolução. Prazo padrão de 15 dias para parceiros.
      Regras do parceiro: cancelamento com mais de 6 horas devolve o check-in ao aluno, cancelamento a
      tempo. Entre 6 e 3 horas o aluno sai da agenda, a unidade recebe como cancelamento tardio e o
      professor não recebe. Com menos de 3 horas o aluno permanece na agenda, incluindo falta do aluno
      ou da unidade, e unidade e professor recebem por cancelamento tardio.
      Agendamento padrão sempre pelo aplicativo do Wellhub; fora do padrão a unidade pode não receber o
      valor, receber valor menor e pagar royalties a mais. Check-in retroativo deve ser solicitado até
      o dia 2 do mês subsequente, depois o Wellhub recusa automaticamente e é necessário abrir chamado.
      Mensagens padrão prontas para copiar, para a unidade, para o suporte e de acompanhamento, nos
      temas divergência de valores e royalties, Wellhub não liberado e instabilidade sistêmica.
      Situações recorrentes: check-in não retornou após cancelamento; excesso de aulas experimentais no
      mesmo horário, com limite recomendado de 2 experimentais por horário; lead que fez experimental e
      recebeu promoção automática com 50% OFF; professor sobrecarregado por excesso de leads; aluno que
      não compareceu à experimental, com fluxo de confirmação em D-1, na manhã do dia e 2 horas antes.
      Exceções operacionais como falta de energia, problema estrutural, professor indisponível ou
      interrupção emergencial não devem penalizar o aluno.`,
  },
  {
    title: 'Mensagens Padrão - Suporte Operacional',
    // Título do próprio documento; ele não tem subtítulo, então a descrição diz
    // só o que a página entrega, sem inventar conteúdo.
    description: 'Textos prontos para Wellhub não liberado e instabilidade sistêmica.',
    href: '/purepedia/mensagens-padrao-suporte',
    icon: MessageSquareText,
    keywords: [
      'mensagem',
      'mensagens',
      'mensagens padrão',
      'mensagens padrao',
      'texto pronto',
      'modelo de mensagem',
      'whatsapp',
      'suporte',
      'suporte operacional',
      'wellhub',
      'wellhub não liberado',
      'wellhub nao liberado',
      'integração',
      'integracao',
      'instabilidade',
      'instabilidade sistêmica',
      'instabilidade sistemica',
      'sistema fora',
      'acompanhamento',
      'unidade',
      'copiar',
    ],
    conteudo: `Mensagens Padrão - Suporte Operacional. Wellhub não liberado: mensagem WhatsApp para
      unidade, mensagem para suporte e mensagem de acompanhamento. Conseguimos identificar que a
      integração do Wellhub não foi finalizada corretamente, por isso o serviço permanece indisponível.
      Envie prints do erro apresentado e informe desde quando o problema começou. Precisamos de apoio na
      validação de integração Wellhub não finalizada da unidade, com data do início do problema, erro
      apresentado, impacto operacional e evidências anexadas.
      Instabilidade sistêmica: mensagem WhatsApp para unidade, mensagem para suporte e mensagem de
      acompanhamento. Informe qual funcionalidade foi impactada, horário aproximado do ocorrido e envie
      prints ou vídeos do erro. Precisamos de apoio na análise de uma instabilidade sistêmica reportada
      pela unidade, com horário aproximado, funcionalidade impactada, mensagem de erro, impacto
      operacional e evidências. Previsão de normalização e estabilização.`,
  },
  {
    title: 'Guia de Respostas Rápidas para Atendimento via WhatsApp',
    description: 'Mensagens prontas para cada situação do atendimento ao aluno.',
    href: '/purepedia/respostas-rapidas-whatsapp',
    icon: MessagesSquare,
    keywords: [
      'whatsapp',
      'resposta rápida',
      'resposta rapida',
      'respostas automáticas',
      'respostas automaticas',
      'atendimento',
      'saudação',
      'saudacao',
      'script',
      'aula experimental',
      'experimental',
      'confirmação',
      'confirmacao',
      'inauguração',
      'inauguracao',
      'vem pra pure',
      'vempraPure',
      'gympass',
      'silver',
      'purepass',
      'pure pass',
      'indique pilates',
      'indicação',
      'indicacao',
      'voucher',
      'massagem',
      'mensalista',
      'mensalistas',
      'reposição',
      'reposicao',
      'falta',
      'férias',
      'ferias',
      'licença',
      'licenca',
      'renovação',
      'renovacao',
      'cancelamento',
      'fidelização',
      'fidelizacao',
      'aplicativo',
      'ficha de avaliação',
    ],
    conteudo: `Guia de resposta rápidas para atendimento via WhatsApp. Estúdio que ainda não inaugurou e
      não possui data. Studio que irá inaugurar, período inaugural com descontos e brinde especiais.
      Mensagem inicial de saudação do atendente. Informações gerais sobre o método Pilates, benefícios
      para coluna, postura, fortalecimento muscular, sono, stress, alongamento. No máximo 4 alunos por
      professor, 55 minutos de duração, programas a partir do cadilac 1x por semana. Confirmação de aula
      experimental e ficha de avaliação. Ideias para serem usadas no WhatsApp, listas de transmissão,
      lembretes, avaliações no Google, status do WhatsApp.
      GymPass: planos a partir do Silver +, agendamento pelo aplicativo com no mínimo 3 horas de
      antecedência, limite de 9 check-ins por mês, 2 aulas por semana em média, cancelamento com 6 horas
      para a atividade retornar, check-in na entrada da aula.
      PurePass: programa mensal, liberdade de frequentar aulas em qualquer horário e unidade, com ou sem
      fidelização, flexibilidade total, acesso ilimitado.
      Orientações e regras dos alunos mensalistas: aplicativo Android e iOS, avisar faltas e reagendar
      reposições, faltas avisadas com prazo mínimo de 3 horas dão 14 dias para repor, com mais de 48
      horas o prazo é de 21 dias, feriado não dá direito a reposição, férias e licença, recesso entre
      Natal e Ano Novo, renovação automática, cancelamento com 10 dias de antecedência, reenquadramento
      das parcelas.
      Programa Indique Pilates: link exclusivo, indicado efetua matrícula e paga a primeira mensalidade,
      indicador recebe voucher de 1 massagem relaxante por e-mail, prêmios não convertidos em dinheiro,
      caminho no app Menu, Comunidade Pure Pilates, Indique Pilates.`,
  },
  {
    title: 'Permissões por Funcionalidade',
    description: 'Quem acessa o quê no Pure System, por perfil e por tela.',
    href: '/purepedia/permissoes-funcionalidade',
    icon: ShieldCheck,
    keywords: [
      'permissão', 'permissao', 'permissões', 'permissoes', 'acesso', 'quem acessa',
      'perfil', 'perfis', 'usuário', 'usuario', 'usuários', 'usuarios', 'tipo de usuário',
      'pure system', 'tela', 'telas', 'funcionalidade', 'mapeamento',
      'administrador', 'customer success', 'recepção', 'recepcao', 'gestor', 'gerente',
      'professor', 'recursos humanos', 'rh', 'marketing', 'implantação', 'implantacao',
      'loja', 'academy', 'franqueadora', 'somente agenda',
      'royalties', 'financeiro', 'receitas', 'despesas', 'nota fiscal', 'fechamento de mês',
    ],
    conteudo: `Permissões por funcionalidade do Pure System. Mapeamento de usuários e perfis de acesso.
      Três seções: Telas do Sistema, Aba Academy e Menu Franqueadora. Para cada tela, a lista de perfis
      com acesso. Consulta nos dois sentidos: buscar um perfil e ver todas as telas que ele acessa, ou
      buscar uma tela e ver quais perfis a acessam. Perfis como Administrador, Administrador TI,
      Administrador 2, Customer Success, Customer Success Supervisora, Auxiliar Administrativo,
      Franquias Recepção, Franquias São Paulo Gestor, Franquias Fora de São Paulo Gestor, Gerencial
      Geral, Gerencial Full, Pilates Usuário Gerencial, Professor, Recursos Humanos, Marketing,
      Marketing Coordenador, Implantação Assistente, Loja, Franqueadora Perfil Comercial, Academy
      Gerencial, Somente agenda. Telas como Agenda, Clientes, PurePass, Wellhub, Receitas, Despesas,
      Fechamento de Mês, Cobranças, Formas de Pagamento, Nota Fiscal, Royalties e Taxa de Propaganda,
      ROI Marketing, Chamados, Unidades, Área de Downloads, NPS, Pendências, Convênios, Promoções,
      Assinaturas, Pure Match, Pessoas, Recados, Aulas Experimentais, Fila de Espera, Central de Ações,
      PureGPT, Cupons de Desconto, Influencers, Pure Pilates TV, Visão de Consultoras.`,
  },
  {
    title: 'Orientações sobre o uso do Certificado A3 para emissão de notas em São Paulo',
    description: 'Como importar o certificado A3 e emitir notas pelo sistema.',
    href: '/purepedia/certificado-a3',
    icon: FileSignature,
    keywords: [
      'certificado', 'certificado a3', 'a3', 'certificado digital', 'smart card', 'leitor de cartão',
      'leitor de cartao', 'nota fiscal', 'notas', 'nota', 'emissão', 'emissao', 'nfe', 'nfse',
      'são paulo', 'sao paulo', 'prefeitura', 'webservice', 'configurar webservice', 'lote',
      'contador', 'usb', 'puresystem', 'pure system',
    ],
    conteudo: `Orientações sobre o uso do certificado A3 para emissão de notas em São Paulo. O
      certificado digital A3 é compatível com a emissão de notas para a cidade de São Paulo. O
      responsável precisa ter o cartão Smart Card A3 e um leitor de cartão funcionando. Como importar o
      certificado digital A3 no sistema: conectar o leitor na porta USB, inserir o cartão A3, acessar
      Notas Fiscais e clicar em Configurar, selecionar a unidade e clicar em Configurar Webservice,
      escolher o certificado digital correto da empresa da unidade e confirmar. Como emitir notas:
      conectar o leitor na USB, inserir o cartão e emitir normalmente. O novo sistema envia
      automaticamente para a prefeitura, sem gerar arquivos em texto para importar manualmente, e
      permite emissão em lotes de até 50 notas por vez.`,
  },
  {
    title: 'Ajuste do WhatsApp do estúdio no Google Meu Negócio',
    description: 'Passo a passo com prints para ligar o WhatsApp ao perfil do Google.',
    href: '/purepedia/whatsapp-google-meu-negocio',
    icon: MapPin,
    keywords: [
      'google meu negócio', 'google meu negocio', 'gmn', 'gmb', 'google', 'perfil da empresa',
      'whatsapp', 'wa.me', 'chat', 'contato', 'link do whatsapp', 'número de telefone',
      'numero de telefone', 'ddi', 'ddd', 'formato internacional', 'editar perfil',
      'informações comerciais', 'informacoes comerciais', 'maps', 'ficha do google',
    ],
    conteudo: `Ajuste do WhatsApp do estúdio no Google Meu Negócio. Vá em Editar Perfil. Abrirá a
      página de informações comerciais e clique em Contato. Clique em Chat Adicionar para adicionar um
      novo meio de contato. Em chat escolha a opção WhatsApp. Abrirá espaço para pôr a URL
      correspondente https://wa.me/. Substitua o number pelo número do celular no formato internacional,
      DDI mais DDD mais número de telefone, exemplo 55 11 9 9999 9999. Clique em Salvar e aguarde de 5 a
      10 minutos até o Google atualizar o link direto para o WhatsApp.`,
  },
  {
    title: 'Como Configurar Wi-fi',
    description: 'Em equipamentos androids: passo a passo com prints, pelo controle remoto.',
    href: '/purepedia/configuracao-de-rede',
    icon: Wifi,
    keywords: [
      'wifi', 'wi-fi', 'wi fi', 'internet', 'rede', 'configurar rede', 'configuração de rede',
      'configuracao de rede', 'android', 'androids', 'controle remoto', 'botão set', 'botao set',
      'set', '4yousee', '4 you see', 'player', 'forçar parada', 'forcar parada', 'eletromídia',
      'eletromidia', 'tv', 'senha da rede', 'sem internet', 'player não inicia', 'player nao inicia',
      'proeletronic', 'tela', 'conteúdo não aparece', 'conteudo nao aparece',
    ],
    conteudo: `Como configurar Wi-fi em equipamentos androids. Objetivo: explicar como configurar a
      internet em equipamentos Android usando o controle remoto. Primeiro passo: forçar a parada do
      player 4yousee. No controle remoto, pressione o botão SET, que abre diretamente as opções de
      configuração de Wi-Fi. Vá em apps, selecione o app 4yousee, clique em Forçar parada e depois em
      ok. Esse processo é importante para fazer a configuração da internet sem que o player 4yousee
      abra a todo momento. Segundo passo: pressione SET, acesse as configurações de Wi-Fi, procure a
      rede da sua unidade e selecione-a, insira a senha da rede e confirme. Após concluir, acesse o
      aplicativo 4Yousee Player na tela inicial para retomar a exibição dos conteúdos. Se o player não
      iniciar, entre em contato com sua consultora.`,
  },
  {
    title: 'Wellhub (Gympass) — Guia rápido para o aluno',
    description: 'Agendamento de aulas: os 5 passos e as regras de cancelamento e check-in.',
    href: '/purepedia/agendamento-wellhub-aluno',
    icon: CalendarCheck,
    keywords: [
      'wellhub', 'gympass', 'agendamento', 'agendar', 'agendar aula', 'guia do aluno',
      'guia rápido', 'guia rapido', 'aluno', 'app', 'aplicativo', 'check-in', 'checkin',
      'cancelamento', 'cancelar', 'no-show', 'no show', 'não comparecimento', 'nao comparecimento',
      '3 horas', '6 horas', 'devolução do check-in', 'devolucao do check-in', 'política de cancelamento',
      'politica de cancelamento', 'unidade',
    ],
    conteudo: `Wellhub Gympass guia rápido para o aluno, agendamento de aulas. Como agendar sua aula:
      acesse o app Wellhub com sua conta, selecione a unidade Pure Pilates onde deseja realizar a aula,
      escolha o dia, o horário e a aula disponível, confirme o agendamento da aula, pronto, sua aula
      está agendada com sucesso. O agendamento será confirmado após o aluno receber a confirmação no
      app Wellhub. Regras de agendamento e cancelamento: agendamento até 3 horas antes, você pode
      agendar sua aula com até 3 horas de antecedência do início. Cancelamento e check-in: cancele sua
      aula com até 6 horas de antecedência do início e o check-in será devolvido automaticamente.
      Cancelamentos com menos de 6 horas ou no-show não devolvem o check-in. Informações importantes: o
      check-in só será consumido após o início da aula, chegue com antecedência e faça o check-in no
      app da unidade, as políticas de cancelamento são definidas pelo Wellhub e podem ser alteradas sem
      aviso prévio.`,
  },
  {
    title: 'Manual de Teste de Pagamento',
    description: 'Os 14 passos do teste de boleto, Pix e cartão, com as telas do sistema.',
    href: '/purepedia/teste-pagamento',
    icon: CreditCard,
    keywords: [
      'teste de pagamento', 'pagamento', 'pagamentos', 'boleto', 'pix', 'cartão', 'cartao',
      'cartão de crédito', 'cartao de credito', 'fatura', 'fatura cc', 'fatura avulsa', 'cobrança',
      'cobranca', 'cobranças', 'cobrancas', 'efi', 'liquidado', 'estorno', 'estornado',
      'pacote', 'pacote avulso', 'cadastro fictício', 'cadastro ficticio', 'aluno de teste',
      'puresystem', 'pure system', 'sistema novo', 'consultora', 'perfil de teste',
      'alterar pacote', 'vencimento', 'gerar cobrança', 'gerar cobranca',
    ],
    conteudo: `Manual de teste de pagamento. Orientar a realização dos testes no processo de pagamento,
      garantindo o correto funcionamento das etapas, identificando possíveis falhas e validando
      segurança, confiabilidade e eficiência das transações. Todos os links de pagamento serão enviados
      para o e-mail cadastrado no perfil de teste. Após o teste informe a sua consultora o perfil que
      foi utilizado. Na tela de clientes crie um cadastro fictício com e-mail e CPF válidos, cadastro
      completo incluindo endereço. Clique com o botão direito em planos e aulas e selecione pacote.
      Inserir e clicar em pacote. Cadastre um pacote de 1 aula no valor de R,00 para esse aluno de
      teste. Selecione ativo e acompanhamento nas opções obrigatórias e confirme para gerar o histórico.
      Selecione lançar no ícone de cobranças. Escolha boleto ou pix, isso define a forma de pagamento.
      Após lançar o boleto volte em cobranças e vá em visualizar. Arraste para o lado e verifique se o
      status está liquidado no sistema. A cobrança é enviada no email cadastrado. Para o teste em pix
      altere a data de validade do pacote no ícone alterar e coloque a data de ontem para deixar o
      pacote vencido. Lance uma cobrança via Pix de R$ 1,00, efetue o pagamento e confirme se aparece
      como liquidado. Cartão de crédito: cadastre um pacote de 1 aula no valor de R$ 5,00 e na aba
      Pagamentos vá em Fatura CC e gere uma fatura avulsa nesse mesmo valor. Realize o pagamento com
      cartão de crédito e verifique se a cobrança aparece como paga. Ao final do processo o valor deve
      ser estornado.`,
  },
  {
    title: 'Manual eletromídia — Pure TV',
    description: 'Instalação do equipamento, boas práticas de rede e dúvidas frequentes.',
    href: '/purepedia/manual-eletromidia',
    icon: Tv,
    keywords: [
      'eletromídia', 'eletromidia', 'pure tv', 'puretv', 'tv', 'televisão', 'televisao', 'tela',
      'mini pc', 'minipc', 'hdmi', 'cabo hdmi', 'controle remoto', 'pilhas', 'fonte de energia',
      '4yousee', '4 you see', 'player', 'aguardando dados', 'tela preta', 'sem sinal', 'sem dados',
      'instalação', 'instalacao', 'equipamento', 'extravio', 'dano', 'reposição', 'reposicao',
      'r$ 400', '400 reais', 'wellhub.tv', 'programação', 'programacao', 'campanhas',
      'boas práticas', 'boas praticas', 'rede', '2.4g', '5g', 'wi-fi', 'wifi', 'ventilação',
      'ventilacao', 'superaquecimento', 'speedtest', 'chamado', 'posicionamento',
    ],
    conteudo: `Manual eletromídia Pure TV. Eletromídia, uma nova maneira de rentabilizar o seu estúdio.
      Implantação da Eletromidia na Pure TV, telas dos studios como canal de conteúdo. Recebi meu
      equipamento e agora, instalação rápida. Requisitos para instalação: televisão ou tela com entrada
      HDMI, ponto de energia elétrica, espaço atrás da TV, controle remoto para ajuste da entrada HDMI,
      conexão com a internet Wi-Fi ou cabo de rede, posicionamento adequado. Processo de instalação:
      retire o equipamento da caixa e confira mini PC, cabo HDMI, controle remoto, 2 pilhas e fonte de
      energia. Conecte o HDMI na entrada do mini-pc e da TV e selecione a entrada HDMI no controle.
      Posicionamento adequado do mini PC: fixado atrás da TV com o led para baixo e a saída de ar virada
      para fora, com abraçadeiras ou fita dupla face, cabos organizados.
      Conectividade Wi-Fi: forçar parada do player pelo botão SET, ir em apps, app 4yousee, forçar
      parada. Configurar o Wi-Fi, procurar a rede da unidade, inserir a senha. Em caso de extravio ou
      dano a reposição custa R$ 400,00. Sem o equipamento em funcionamento a unidade não recebe a
      programação nem as campanhas da Wellhub.tv.
      Boas práticas de rede: conectar sempre na rede 2.4G, redes 5G dão instabilidade e não são
      compatíveis, rede estável e dedicada, redes privadas, senha correta, área de cobertura, evitar
      firewalls e autenticação por navegador, evitar sobrecarga, reiniciar após alteração de rede,
      manter ligado na energia, TV na entrada HDMI correta, não reposicionar, não obstruir a ventilação.
      Dúvidas frequentes: aguardando dados na tela por perda de conexão, tela preta no app 4yousee por
      travamento ou superaquecimento, sem sinal ou sem dados por problema no HDMI, horário e temperatura
      incorretos por perda de conexão. Teste de velocidade em speedtest. Persistindo, abrir chamado com
      o time técnico.`,
  },
];