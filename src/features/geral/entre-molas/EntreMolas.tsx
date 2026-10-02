import { Navigate, useParams } from 'react-router-dom';
import Revista from './Revista';
import { EDICOES_ENTRE_MOLAS } from './edicoes';
import { CONTEUDO_POR_EDICAO, Palco } from './palco';
import { BarraPublicar, EmBreve, usePublicacaoEntreMolas } from './publicacao';

// Entre Molas — uma edição aberta, folheável (rota /entre-molas/:edicao).
// Textos: Canva da edição, sem alteração.

const EntreMolas = () => {
  const { edicao } = useParams();
  const pub = usePublicacaoEntreMolas();
  const conteudo = edicao ? CONTEUDO_POR_EDICAO[edicao] : undefined;
  const dados = EDICOES_ENTRE_MOLAS.find((e) => e.slug === edicao);
  if (!conteudo || !dados || !edicao) return <Navigate to="/entre-molas" replace />;

  // Não publicada: a equipe vê em pré-visualização; o franqueado vê "em breve" (e nada enquanto a consulta carrega,
  // para não piscar o "em breve" à toa).
  if (!pub.podeVer(edicao)) {
    return <Palco>{pub.carregando ? null : <EmBreve edicao={dados} />}</Palco>;
  }

  const emPrevia = !pub.carregando && !pub.estaPublicada(edicao);
  return (
    <Palco>
      <Revista
        key={edicao}
        paginas={conteudo.paginas}
        capitulos={conteudo.capitulos}
        brilhoCapa="radial-gradient(ellipse 60% 75% at 50% 50%, #6e1624 0%, #3a0c15 55%, #17070a 100%)"
        aviso={
          emPrevia ? (
            <BarraPublicar onPublicar={() => pub.publicar(edicao)} publicando={pub.publicando} podePublicar={pub.isAdmin} />
          ) : undefined
        }
      />
    </Palco>
  );
};

export default EntreMolas;
