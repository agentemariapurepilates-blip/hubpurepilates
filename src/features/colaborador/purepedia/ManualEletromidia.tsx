import { Link } from 'react-router-dom';
import { ArtigoShell, Capa, Cartao, Destaque, Faq, Figura, ItemCheck, Lista, P, Passo, SecHead, Secao } from './artigoUI';

/**
 * PurePedia — Manual eletromídia (Pure TV).
 *
 * TRANSCRIÇÃO FIEL do PDF original (Drive: Purepedia - Artigos/Manuais), um
 * material de 17 páginas em que cada página é um pôster fechado (imagem única
 * com camada de texto por cima). Por isso não há capturas separáveis: as duas
 * fotos aqui foram recortadas por região da página 5.
 *
 * Texto, títulos e ordem são os do manual. Não resumir, não reordenar, não
 * acrescentar.
 *
 * Duas observações do original:
 * - Os "requisitos para instalação" aparecem DUAS vezes no PDF, com pequena
 *   diferença. Vale a lista da página 5, conferida na imagem da página.
 * - O trecho de Wi-Fi repete o guia "Como Configurar Wi-fi", que já é um artigo
 *   próprio — por isso aqui ele remete para lá em vez de duplicar as telas.
 */

const IMG = '/images/purepedia/eletromidia';

const ManualEletromidia = () => (
  <ArtigoShell>
    <Capa
      eyebrow="Pure TV"
      titulo="Manual eletromídia"
      resumo="Eletromídia: uma nova maneira de rentabilizar o seu estúdio!"
    />

    <Secao>
      <P>
        Com o objetivo de fortalecer a comunicação e a presença da marca Pure Pilates em todas as
        unidades, a implantação da Eletromidia na Pure TV representa um passo importante na modernização
        da experiência dos studios.
      </P>
      <P>
        Com essa iniciativa, buscamos modernizar a experiência dos alunos e colaboradores, transformando
        as telas dos studios em um canal de conteúdo dinâmico, informativo e inspirador, que reflita a
        identidade e os valores da marca Pure.
      </P>
      <P>
        Além de promover maior engajamento e conexão com o público, o projeto abre espaço para novas
        oportunidades de comunicação e parcerias comerciais, consolidando a Pure TV como um canal
        estratégico de mídia e relacionamento dentro dos studios.
      </P>
    </Secao>

    <Secao tom="cinza">
      <SecHead
        eyebrow="Instalação rápida!"
        titulo="Recebi meu equipamento, e agora?"
        apoio="Siga os requisitos e o passo a passo para uma instalação sem complicações."
      />

      <h3 className="mb-3 text-[1.1rem] font-extrabold" style={{ color: '#1F2328' }}>
        Requisitos para instalação
      </h3>
      <P>Antes de iniciar, verifique se o local atende aos seguintes requisitos:</P>
      <div className="space-y-2.5">
        <ItemCheck>Televisão ou tela com entrada HDMI disponível;</ItemCheck>
        <ItemCheck>Ponto de energia elétrica próximo ao local de instalação;</ItemCheck>
        <ItemCheck>Espaço atrás da TV para fixação do equipamento;</ItemCheck>
        <ItemCheck>Controle remoto para ajuste da entrada HDMI;</ItemCheck>
        <ItemCheck>Conexão com a internet disponível no local (Wi-Fi ou cabo de rede);</ItemCheck>
        <ItemCheck>Posicionamento adequado do equipamento.</ItemCheck>
      </div>

      <h3 className="mb-3 mt-9 text-[1.1rem] font-extrabold" style={{ color: '#1F2328' }}>
        Processo de instalação
      </h3>
      <div className="pl-1">
        <Passo numero={1} titulo="Retire o equipamento da caixa e confira se nele possui:">
          <Lista itens={['Mini PC', 'Cabo HDMI', 'Controle Remoto', '2 pilhas', 'Fonte de Energia']} />
          <Figura
            src={`${IMG}/01-conteudo-da-caixa.png`}
            alt="Caixa do equipamento aberta, com o mini PC e o controle remoto"
          />
        </Passo>
      </div>

      <Destaque titulo="Dica">
        Mantenha o equipamento em local ventilado e de fácil acesso à energia e à internet para garantir
        o melhor desempenho.
      </Destaque>

      <div className="mt-9">
        <P>
          Com o HDMI conectado ao mini-pc, sincronize o canal da TV ao canal de entrada do HDMI
          informado.
        </P>
        <div className="pl-1">
          <Passo numero={1} titulo="Conecte o HDMI">
            <P>Conecte o cabo HDMI na entrada do mini-pc e na entrada HDMI da TV.</P>
            <Figura src={`${IMG}/02-conectar-hdmi.png`} alt="Cabo HDMI sendo conectado ao mini PC" />
          </Passo>
          <Passo numero={2} titulo="Selecione a entrada HDMI">
            <P>No controle da TV, selecione o canal de entrada HDMI informado.</P>
          </Passo>
        </div>
        <Destaque titulo="Pronto!!">
          A instalação foi concluída. Agora o equipamento irá se conectar a sua internet e se preparar
          para iniciar a programação.
        </Destaque>
      </div>
    </Secao>

    <Secao>
      <SecHead titulo="Posicionamento adequado do Mini PC" />
      <P>
        O equipamento deve ser fixado atrás da TV, com o led fixado para baixo (ou à frente do
        equipamento) e a saída de ar virada para fora.
      </P>
      <Lista
        itens={[
          'A fixação deve ser feita de forma firme e segura.',
          'Utilizar abraçadeiras ou fita dupla face para prender o equipamento.',
          'Garantir que o equipamento fique estável, sem risco de queda ou deslocamento.',
          'Manter os cabos organizados, sem tensão nas conexões.',
        ]}
      />
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="Conectividade (Wi-Fi)" />
      <P>
        A conexão com a internet é necessária para o recebimento de conteúdos e atualizações do
        equipamento. Embora o dispositivo seja enviado pré-configurado, a conexão pode não ser
        estabelecida automaticamente em alguns casos.
      </P>
      <P>
        Neste tópico, você encontrará orientações para verificar o status da conexão e, se necessário,
        conectar o equipamento à internet.
      </P>

      <Cartao className="mt-6">
        <h3 className="mb-2 text-[1.05rem] font-extrabold" style={{ color: '#1F2328' }}>
          Como conectar o equipamento à rede Wi-Fi
        </h3>
        <P>
          <strong>Passo 1 — Forçar parada do player.</strong> No controle remoto, pressione o botão SET
          — isso abre diretamente as opções de configuração de Wi-Fi. Vá em apps, selecione o app
          4yousee, clique em “Forçar parada” e depois clique em OK.
        </P>
        <P>
          <strong>Passo 2 — Configurando o Wi-Fi.</strong> No controle remoto, pressione o botão SET.
          Acesse as configurações de Wi-Fi, procure a rede da sua unidade e selecione-a. Insira a senha
          da rede e confirme.
        </P>
        <P>
          Após concluir todo o processo, acesse o aplicativo 4Yousee Player, disponível na tela inicial,
          para retomar a exibição dos conteúdos.
        </P>
        <p className="mt-4 text-[0.95rem]" style={{ color: '#565C63' }}>
          As telas passo a passo desse processo estão em{' '}
          <Link to="/purepedia/configuracao-de-rede" className="font-bold underline" style={{ color: '#C12030' }}>
            Como Configurar Wi-fi
          </Link>
          .
        </p>
      </Cartao>

      <div className="mt-6 space-y-4">
        <Destaque titulo="Extravio ou dano">
          Em caso de extravio ou dano, comunique a franqueadora. A reposição terá custo de R$ 400,00 e,
          após a confirmação do pagamento, um novo equipamento será enviado.
        </Destaque>
        <Destaque titulo="Importante">
          Sem o equipamento em funcionamento, a unidade não receberá a programação nem as campanhas da
          Wellhub.tv.
        </Destaque>
      </div>
    </Secao>

    <Secao>
      <SecHead titulo="Boas práticas de rede" />
      <Lista
        itens={[
          'Sempre conectar a rede 2.4G. Redes 5G sempre dão instabilidades e não são compatíveis com o equipamento',
          'Utilizar uma rede Wi-Fi estável e dedicada, sempre que possível',
          'Preferir redes privadas, evitando redes públicas ou abertas',
          'Garantir que a senha da rede esteja correta e atualizada',
          'Manter o equipamento dentro da área de cobertura do Wi-Fi, evitando pontos com sinal fraco',
          'Evitar redes com bloqueios, firewalls ou autenticações adicionais (ex: login via navegador)',
          'Sempre que possível, evitar sobrecarga da rede com muitos dispositivos conectados',
          'Após qualquer alteração de rede, reiniciar o equipamento e validar a conexão',
          'Manter o equipamento ligado à energia elétrica durante o período de funcionamento',
          'Evitar desligar o equipamento diretamente da tomada, sem motivo aparente, durante o uso.',
          'Garantir que a TV esteja sempre na entrada HDMI correta',
          'Não remover ou reposicionar o equipamento após a instalação',
          'Evitar obstrução da ventilação do equipamento',
          'Manter a conexão com a internet ativa e estável',
          'Evitar alterações nas configurações sem orientação técnica',
        ]}
      />
    </Secao>

    <Secao tom="rosa">
      <SecHead titulo="Dúvidas frequentes" />
      <div className="space-y-3">
        <Faq pergunta="1. Ao ligar o equipamento, aparece na tela “Aguardando dados”.">
          <P>Esse cenário ocorre, geralmente, por perda de conexão com a internet</P>
          <p className="mb-1.5 mt-4 font-bold">O que fazer?</p>
          <Lista
            itens={[
              'Confirmar se o Mini PC está conectado ao Wi-Fi',
              'Verificar se a internet está ativa e com velocidade suficiente para download de conteúdos',
              'Realizar teste de velocidade da rede para verificar se a mesma está funcionando: https://www.speedtest.net/',
              'Em último caso, conectar via cabo a internet no aparelho',
            ]}
          />
        </Faq>

        <Faq pergunta="2. Ao acessar o app 4yousee player, a tela está totalmente preta.">
          <P>
            Esse cenário ocorre, geralmente, por um travamento do equipamento por ficar muito tempo
            ligado ou superaquecimento.
          </P>
          <p className="mb-1.5 mt-4 font-bold">O que Fazer:</p>
          <Lista
            itens={[
              'Desligar e ligar o equipamento novamente',
              'Verificar se o equipamento está com a saída de ar obstruída ou com pouca ventilação. Neste caso, deverá colocá-lo em um local de melhor ventilação.',
            ]}
          />
        </Faq>

        <Faq pergunta="3. Ao ligar o equipamento, a tela apresenta a mensagem “sem sinal” ou “sem dados”.">
          <P>
            Este cenário ocorre normalmente quando o aparelho não está conseguindo transmitir a imagem
            do equipamento na televisão pelo HDMI
          </P>
          <p className="mb-1.5 mt-4 font-bold">O que Fazer:</p>
          <Lista
            itens={[
              'Verificar se a tela está sincronizada na entrada do HDMI conectado ao aparelho.',
              'Inverter as pontas do cabo HDMI',
            ]}
          />
        </Faq>

        <Faq pergunta="4. O horário da barra de notícias e a temperatura estão exibindo de forma incorreta.">
          <P>
            O horário incorreto é uma forte evidência que o equipamento perdeu a conexão com a internet.
          </P>
          <p className="mb-1.5 mt-4 font-bold">O que Fazer:</p>
          <Lista
            itens={[
              'Confirmar se o Mini PC está conectado ao Wi-Fi',
              'Verificar se a internet está ativa e com velocidade suficiente para download de conteúdos',
            ]}
          />
        </Faq>
      </div>
      <div className="mt-6">
        <P>
          Esses casos são comuns de acontecer e, seguindo as verificações, a programação retorna ao
          normal.
        </P>
        <P>
          Se por acaso, após essas verificações, o problema persistir, é necessário a abertura de chamado
          junto ao nosso time técnico.
        </P>
      </div>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="Orientações gerais" />
      <P>
        Aproveite o nosso novo atendimento para fazer vendas mais assertivas e aumentar o seu número de
        conversões de aulas experimentais.
      </P>
      <P>
        Lembre-se de seguir todas as orientações apresentadas para garantir uma operação fluida e
        oferecer a melhor experiência possível.
      </P>
      <P>
        Caso precise de suporte ou tenha dúvidas, nossa equipe está à disposição para ajudar. Vamos
        juntos construir uma experiência única para todos os nossos clientes!
      </P>
      <Destaque titulo="Dica">
        Cada detalhe importa para entregar a melhor experiência e conquistar resultados ainda melhores.
      </Destaque>
    </Secao>
  </ArtigoShell>
);

export default ManualEletromidia;
