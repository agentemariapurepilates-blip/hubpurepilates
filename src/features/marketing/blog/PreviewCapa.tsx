import { useSearchParams } from 'react-router-dom';
import { CapaBlog, LARGURA_CAPA } from './CapaBlog';
import type { Marca } from './blogTipos';

// SÓ EM DEV, sem login (a rota sai do build de produção): mostra uma capa do
// blog no tamanho real, com o MESMO componente do Hub, a partir da URL.
// Serve para gerar capas em lote fora do navegador do time, como na troca de
// todas as capas do WordPress em 06/11/2026:
//   /preview/capa-blog?marca=academy&titulo=...&foto=https://...
const PreviewCapa = () => {
  const [p] = useSearchParams();
  return (
    <div style={{ width: LARGURA_CAPA, margin: 0 }}>
      <CapaBlog
        marca={(p.get('marca') as Marca) || 'studios'}
        titulo={p.get('titulo') || 'Título do artigo'}
        fotoUrl={p.get('foto')}
        onPronto={() => {
          document.body.dataset.capaPronta = '1';
        }}
      />
    </div>
  );
};

export default PreviewCapa;
