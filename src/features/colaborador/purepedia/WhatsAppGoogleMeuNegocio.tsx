import { ArtigoShell, Capa, Cartao, Figura, P, Passo, SecHead, Secao } from './artigoUI';

/**
 * PurePedia — Ajuste do WhatsApp do estúdio no Google Meu Negócio.
 *
 * TRANSCRIÇÃO FIEL do PDF original (Drive: Purepedia - Artigos/Manuais).
 * O texto é o do documento, na ordem dele. As capturas de tela foram extraídas
 * do próprio PDF (6 imagens, uma por passo) e ficam em
 * `public/images/purepedia/whatsapp-gmn/`. As marcações vermelhas fazem parte
 * da imagem original — são elas que mostram onde clicar.
 *
 * Não resumir, não reordenar, não acrescentar texto.
 */

const IMG = '/images/purepedia/whatsapp-gmn';

const PASSOS = [
  {
    texto: 'Para ajuste do Whatsapp do estúdio no Google Meu Negócio, vá em “Editar Perfil”:',
    img: `${IMG}/01-editar-perfil.png`,
    alt: 'Painel “Sua empresa no Google” com o botão Editar perfil destacado em vermelho',
  },
  {
    texto: 'Abrirá a página de “informações comerciais” e então você pode clicar em “Contato”:',
    img: `${IMG}/02-informacoes-comerciais.png`,
    alt: 'Página Informações comerciais com a aba Contato destacada em vermelho',
  },
  {
    texto: 'Clique em “Chat – Adicionar” para adicionar um novo meio de contato:',
    img: `${IMG}/03-chat-adicionar.png`,
    alt: 'Bloco Dados de contato com a opção Chat – Adicionar destacada em vermelho',
  },
  {
    texto: 'Em chat escolha a opção “WhatsApp”:',
    img: `${IMG}/04-escolher-whatsapp.png`,
    alt: 'Lista suspensa do Chat com a opção WhatsApp destacada em vermelho',
  },
  {
    texto: 'Abrirá espaço para por a URL correspondente https://wa.me/<number>:',
    img: `${IMG}/05-url-wa-me.png`,
    alt: 'Campo de URL do chat aguardando o endereço https://wa.me/',
  },
];

const WhatsAppGoogleMeuNegocio = () => (
  <ArtigoShell>
    <Capa
      eyebrow="Google Meu Negócio"
      titulo="Ajuste do WhatsApp do estúdio no Google Meu Negócio"
    />

    <Secao>
      <div className="pl-1">
        {PASSOS.map((p, i) => (
          <Passo key={p.img} numero={i + 1} titulo={p.texto}>
            <Figura src={p.img} alt={p.alt} />
          </Passo>
        ))}

        <Passo numero={6} titulo="Então você substituirá o <number>, pelo número do seu celular segundo o formato internacional, sendo então seu DDI + DDD + Número de Telefone, Exemplo:">
          <Cartao className="my-4">
            <p className="m-0 text-center text-[1.35rem] font-extrabold tracking-wide" style={{ color: '#1F2328' }}>
              55 11 9 9999 9999
            </p>
            <p className="m-0 mt-1 text-center text-[0.82rem] font-semibold" style={{ color: '#8A9099' }}>
              DDI Brasil · DDD São Paulo · Nº de Telefone
            </p>
          </Cartao>
          <Figura
            src={`${IMG}/06-substituir-numero.png`}
            alt="Campo de URL preenchido com o endereço do WhatsApp no formato internacional"
          />
        </Passo>
      </div>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="Para finalizar" />
      <P>
        Clique em “Salvar” e é só aguardar por volta de 5 a 10 minutos e o Google estará com o link
        atualiazado direto para o seu whatsapp.
      </P>
    </Secao>
  </ArtigoShell>
);

export default WhatsAppGoogleMeuNegocio;
