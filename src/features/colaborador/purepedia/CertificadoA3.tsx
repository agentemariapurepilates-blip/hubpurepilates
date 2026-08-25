import { ArtigoShell, Capa, Cartao, Lista, P, Passo, SecHead, Secao } from './artigoUI';

/**
 * PurePedia — Orientações sobre o uso do Certificado A3 para emissão de notas
 * em São Paulo.
 *
 * TRANSCRIÇÃO FIEL do documento original (Drive: Purepedia - Artigos/Manuais).
 * Texto, títulos e ordem são os do documento. Não resumir, não reordenar, não
 * acrescentar. Os únicos ajustes foram os escapes da conversão do .docx (1\.).
 */

const IMPORTAR = [
  'Conecte o leitor de cartão na porta USB do computador.',
  'Insira o cartão A3 no leitor.',
  'Acesse o sistema da Pure em Notas Fiscais e clique em Configurar.',
  'Selecione a unidade e clique em Configurar Webservice.',
  'Escolha o certificado digital correto (o cartão da empresa da unidade).',
  'Clique em Confirmar.',
];

const EMITIR = [
  'Conecte novamente o leitor de cartão na USB.',
  'Insira o cartão A3 no leitor.',
  'Faça a emissão das notas normalmente.',
];

const CertificadoA3 = () => (
  <ArtigoShell>
    <Capa
      eyebrow="Notas fiscais"
      titulo="Orientações sobre o uso do Certificado A3 para emissão de notas em São Paulo"
    />

    <Secao>
      <P>
        Alguns franqueados perguntaram se o certificado digital A3 é compatível com a emissão de notas
        para a cidade de São Paulo no nosso sistema.
      </P>
      <P>Sim, ele é compatível e pode ser usado normalmente.</P>
      <P>
        Mas é importante lembrar que o responsável precisa ter em mãos o cartão Smart Card A3 e também um
        leitor de cartão funcionando corretamente.
      </P>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="1. Como importar o certificado digital A3 no sistema" />
      <P>
        Antes de tudo, o leitor e o cartão precisam estar instalados corretamente. Caso tenha dificuldade,
        é recomendável pedir ajuda ao contador ou à empresa que emitiu o certificado.
      </P>
      <P>Depois, siga os passos abaixo:</P>
      <div className="mt-6 pl-1">
        {IMPORTAR.map((passo, i) => (
          <Passo key={passo} numero={i + 1} titulo={passo}>
            {null}
          </Passo>
        ))}
      </div>
    </Secao>

    <Secao>
      <SecHead titulo="2. Como emitir notas" />
      <div className="mt-2 pl-1">
        {EMITIR.map((passo, i) => (
          <Passo key={passo} numero={i + 1} titulo={passo}>
            {null}
          </Passo>
        ))}
      </div>
    </Secao>

    <Secao tom="rosa">
      <SecHead titulo="Informação importante" />
      <Cartao>
        <P>A emissão das notas pelo novo sistema:</P>
        <Lista
          itens={[
            'Envia automaticamente para a prefeitura — não é mais necessário gerar arquivos em texto para importar manualmente.',
            'Permite a emissão em lotes de até 50 notas por vez.',
          ]}
        />
      </Cartao>
    </Secao>
  </ArtigoShell>
);

export default CertificadoA3;
