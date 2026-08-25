import { ArtigoShell, Capa, Destaque, Figura, P, Passo, SecHead, Secao } from './artigoUI';

/**
 * PurePedia — MANUAL DE TESTE DE PAGAMENTO.
 *
 * TRANSCRIÇÃO FIEL do PDF original (Drive: Purepedia - Artigos/Manuais), que é
 * um deck de 8 slides 16:9.
 *
 * Sobre a ORDEM: a extração de texto do deck embaralha a numeração, porque os
 * slides têm duas colunas — o passo 12 aparece depois do 14. A sequência aqui
 * (12 → 13 → 14) foi conferida abrindo o slide 8: o 12 abre o teste de cartão e
 * os outros dois o executam. Não reordenar sem olhar o slide.
 *
 * Sobre as IMAGENS: as 13 telas foram recortadas do próprio deck. Telas
 * compostas (grade + menu de contexto por cima) foram recortadas como uma região
 * só, senão sairiam pela metade. As marcações vermelhas são do original.
 */

const IMG = '/images/purepedia/teste-pagamento';

const TestePagamento = () => (
  <ArtigoShell>
    <Capa eyebrow="Pure System" titulo="MANUAL DE TESTE DE PAGAMENTO" />

    <Secao>
      <P>
        Este documento tem como objetivo orientar a realização dos testes no processo de pagamento,
        garantindo o correto funcionamento das etapas envolvidas, identificando possíveis falhas e
        validando a segurança, confiabilidade e eficiência das transações.
      </P>
      <P>
        Os resultados obtidos servirão como base para análises, correções necessárias e melhorias
        contínuas no sistema.
      </P>
      <P>
        Importante: Todos os links de pagamento serão enviados para o e-mail cadastrado no perfil de
        teste.
      </P>
      <Destaque titulo="Após o teste">
        APÓS O TESTE INFORME A SUA CONSULTORA O PERFIL QUE FOI UTILIZADO
      </Destaque>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="Cadastro do aluno de teste" />
      <div className="pl-1">
        <Passo
          numero={1}
          titulo="Na tela de clientes, crie um cadastro fictício, utilizando e-mail e CPF válidos. O cadastro deve estar completo, incluindo endereço."
        >
          <Figura src={`${IMG}/01-tela-clientes.png`} alt="Tela Gestão de Clientes do Pure System" />
          <p className="m-0 text-center text-[0.95rem] font-semibold">
            https://puresystem.purepilates.com.br
          </p>
        </Passo>

        <Passo numero={2} titulo="Clique com o botão direito em planos e aulas selecione pacote.">
          <Figura
            src={`${IMG}/02-menu-planos-aulas.png`}
            alt="Menu de contexto do cliente com Planos e Aulas e a opção Pacote destacada"
          />
        </Passo>

        <Passo numero={3} titulo="inserir e clicar em pacote:">
          <Figura
            src={`${IMG}/03-inserir-pacote.png`}
            alt="Janela Planos e Aulas com a opção Inserir Pacote destacada"
          />
        </Passo>

        <Passo
          numero={4}
          titulo="Cadastre um pacote de 1 aula no valor de R$1,00 para esse aluno de teste. Exemplo:"
        >
          <Figura
            src={`${IMG}/04-cadastro-pacote.png`}
            alt="Formulário Cadastro de Pacotes — Inclusão preenchido com 1 aula no valor de 1,00"
          />
        </Passo>

        <Passo
          numero={5}
          titulo="Selecione ativo e acompanhamento nas opções obrigatórias, clique em confirmar para gerar o histórico."
        >
          <Figura src={`${IMG}/05-novo-historico.png`} alt="Janela Novo Histórico com a opção Ativo marcada" />
        </Passo>
      </div>
    </Secao>

    <Secao>
      <SecHead titulo="Teste com boleto" />
      <div className="pl-1">
        <Passo numero={6} titulo="Selecione lançar no ícone de cobranças:">
          <Figura src={`${IMG}/06-menu-cobrancas.png`} alt="Menu com a opção Cobranças destacada" />
        </Passo>

        <Passo numero={7} titulo="Escolha Boleto ou pix, isso vai definir a forma de pagamento e lance">
          <Figura
            src={`${IMG}/07-gerar-cobranca.png`}
            alt="Janela Gerar Cobrança EFI com as abas Boleto e PIX"
          />
        </Passo>

        <Passo numero={8} titulo="Após lançar o boleto, volte em cobranças e vá em visualizar:">
          <Figura src={`${IMG}/08-ver-cobrancas.png`} alt="Menu com a opção Ver Cobranças destacada" />
        </Passo>

        <Passo numero={9} titulo="Arraste para o lado verifique se o status está liquidado no sistema">
          <P>
            Essa cobrança será enviada no email cadastrado, porém pode selecionar em visualizar e terá
            acesso a cobrança:
          </P>
          <Figura
            src={`${IMG}/09-status-liquidado.png`}
            alt="Tela de Cobranças EFI com os filtros de status e a cobrança lançada"
          />
        </Passo>
      </div>
    </Secao>

    <Secao tom="cinza">
      <SecHead titulo="Teste com Pix" />
      <div className="pl-1">
        <Passo
          numero={10}
          titulo="Para realizamos o teste em pix altere a data de validade do pacote cadastrado no ícone alterar:"
        >
          <Figura
            src={`${IMG}/10-alterar-pacote.png`}
            alt="Janela Planos e Aulas com a opção Alterar Pacote destacada"
          />
        </Passo>

        <Passo numero={11} titulo="Coloque a data de ontem para deixar o pacote vencido:">
          <Figura
            src={`${IMG}/11-data-vencida.png`}
            alt="Cadastro de Pacotes — Alteração com o campo Vencimento destacado"
          />
        </Passo>
      </div>
      <Destaque titulo="Pix">
        Depois, lance uma cobrança via Pix no valor de R$ 1,00, efetue o pagamento e confirme se também
        aparece no sistema como liquidado.
      </Destaque>
    </Secao>

    <Secao>
      <SecHead titulo="Teste com cartão de crédito" />
      <P>
        <strong>Altera a data de validade do pacote novamente para lançar o teste em Cartão</strong>
      </P>
      <Figura
        src={`${IMG}/12-aba-pagamentos.png`}
        alt="Gestão de Clientes com o ícone de pagamentos destacado na barra de ferramentas"
      />
      <div className="mt-6 pl-1">
        <Passo
          numero={12}
          titulo="Cartão de crédito: Por fim, faça o teste com cartão de crédito. Cadastre um pacote de 1 aula no valor de R$ 5,00 e, na aba Pagamentos"
        />

        <Passo numero={13} titulo="Vá em Fatura CC e gere uma fatura avulsa nesse mesmo valor. Exemplo:">
          <Figura
            src={`${IMG}/13-fatura-avulsa.png`}
            alt="Janela Fatura avulsa com forma de pagamento Cartão de crédito à vista"
          />
        </Passo>

        <Passo
          numero={14}
          titulo="Realize o pagamento com cartão de crédito e verifique se a cobrança aparece como paga. Ao final do processo, o valor deve ser estornado."
        />
      </div>
    </Secao>
  </ArtigoShell>
);

export default TestePagamento;
