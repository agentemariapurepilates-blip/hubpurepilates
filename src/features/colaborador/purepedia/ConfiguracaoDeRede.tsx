import { ArtigoShell, Capa, Destaque, Figura, P, Passo, SecHead, Secao } from './artigoUI';

/**
 * PurePedia — Como Configurar Wi-fi (em equipamentos androids).
 *
 * TRANSCRIÇÃO FIEL do PDF original (Drive: Purepedia - Artigos/Manuais).
 * Texto, títulos e ordem são os do documento.
 *
 * Sobre as imagens: as 8 capturas foram extraídas do próprio PDF. No original
 * elas ficam DEPOIS da lista numerada, por causa da quebra de página; aqui cada
 * uma acompanha o seu passo. Isso não muda texto nenhum — só remove um efeito
 * da diagramação em papel. A foto do controle remoto é a mesma nos dois blocos
 * (conferido byte a byte), por isso está guardada uma vez só.
 *
 * O passo 4 do segundo bloco não tem captura no documento original.
 */

const IMG = '/images/purepedia/config-rede';

const PRIMEIRO_PASSO = [
  {
    texto: 'No controle remoto, pressione o botão SET — isso abre diretamente as opções de configuração de Wi-Fi.',
    img: `${IMG}/controle-set.png`,
    alt: 'Controle remoto com o botão SET destacado em vermelho',
  },
  {
    texto: 'Vá em apps',
    img: `${IMG}/01-menu-apps.png`,
    alt: 'Menu Configurações do Android TV com a opção Apps destacada em vermelho',
  },
  {
    texto: 'Selecione o app 4yousee',
    img: `${IMG}/02-app-4yousee.png`,
    alt: 'Lista de apps abertos recentemente com o 4yousee Player destacado em vermelho',
  },
  {
    texto: 'Clique em “Forçar parada”',
    img: `${IMG}/03-forcar-parada.png`,
    alt: 'Tela do app 4yousee Player com a opção Forçar parada destacada em vermelho',
  },
  {
    texto: 'Depois clique em ok',
    img: `${IMG}/04-confirmar-ok.png`,
    alt: 'Caixa de confirmação da parada do app com o botão OK destacado em vermelho',
  },
];

const SEGUNDO_PASSO = [
  {
    texto: 'No controle remoto, pressione o botão SET — isso abre diretamente as opções de configuração de Wi-Fi.',
    img: `${IMG}/controle-set.png`,
    alt: 'Controle remoto com o botão SET destacado em vermelho',
  },
  {
    texto: 'Acesse as Configurações de Wi-Fi.',
    img: `${IMG}/05-rede-internet.png`,
    alt: 'Menu Configurações com a opção Rede e Internet destacada em vermelho',
  },
  {
    texto: 'Procure a rede da sua unidade e selecione-a.',
    img: `${IMG}/06-escolher-rede.png`,
    alt: 'Lista de redes Wi-Fi disponíveis para seleção',
  },
  {
    texto: 'Insira a senha da rede e confirme.',
    img: null,
    alt: '',
  },
];

const ConfiguracaoDeRede = () => (
  <ArtigoShell>
    <Capa eyebrow="Em equipamentos androids" titulo="Como Configurar Wi-fi" />

    <Secao>
      <SecHead titulo="Objetivo deste documento" />
      <P>
        Este documento explica, de forma clara e rápida, como configurar a internet em equipamentos
        Android usando o controle remoto.
      </P>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="Primeiro passo" apoio="Forçar a parada do player 4yousee" />
      <div className="pl-1">
        {PRIMEIRO_PASSO.map((p, i) => (
          <Passo key={`p1-${i}`} numero={i + 1} titulo={p.texto}>
            <Figura src={p.img} alt={p.alt} />
          </Passo>
        ))}
      </div>
      <Destaque titulo="Por que parar o player antes">
        Esse processo é importante para podermos fazer a configuração da internet sem que o player
        4yousee abra a todo momento, dificultando a configuração.
      </Destaque>
    </Secao>

    <Secao>
      <SecHead titulo="Segundo passo" />
      <div className="pl-1">
        {SEGUNDO_PASSO.map((p, i) => (
          <Passo key={`p2-${i}`} numero={i + 1} titulo={p.texto}>
            {p.img ? <Figura src={p.img} alt={p.alt} /> : null}
          </Passo>
        ))}
      </div>
      <P>
        Após concluir todo o processo, acesse o aplicativo 4Yousee Player, disponível na tela inicial,
        para retomar a exibição dos conteúdos.
      </P>
    </Secao>

    <Secao tom="rosa">
      <SecHead titulo="Dica" />
      <P>
        Se o player não iniciar, entre em contato com sua consultora, nossa equipe estará pronta para
        apoiar.
      </P>
    </Secao>
  </ArtigoShell>
);

export default ConfiguracaoDeRede;
