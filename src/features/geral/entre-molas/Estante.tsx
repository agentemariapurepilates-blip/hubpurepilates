import { Link } from 'react-router-dom';
import logoCreme from './assets/logo-entre-molas-creme.png';
import { EDICOES_ENTRE_MOLAS } from './edicoes';
import { CONTEUDO_POR_EDICAO, Palco } from './palco';
import { PAGINA_A, PAGINA_L } from './Revista';
import { usePublicacaoEntreMolas } from './publicacao';

// Entre Molas — a estante (rota /entre-molas): todas as edições, com a capa de
// cada uma. Clicar na capa abre a revista. A mais nova vem primeiro. Edição ainda não publicada: a equipe vê a
// capa com o selo de pré-visualização; o franqueado vê só "em breve".

const ESCALA_CAPA = 0.34;

const Estante = () => {
  const edicoes = [...EDICOES_ENTRE_MOLAS].reverse();
  const pub = usePublicacaoEntreMolas();
  return (
    <Palco className="overflow-y-auto">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, #6e1624 0%, #3a0c15 50%, #17070a 100%)' }}
      />
      <div className="relative mx-auto flex min-h-full max-w-[1200px] flex-col px-6 pb-16 pt-12 sm:px-10">
        <header className="flex flex-col items-center text-center">
          <img src={logoCreme} alt="Entre Molas — Você por dentro de tudo." className="w-[min(560px,85vw)] select-none" draggable={false} />
          <div className="mt-8 flex items-center gap-4">
            <span className="h-px w-12 bg-white/30" />
            <span className="em-sans text-[11px] font-semibold uppercase tracking-[0.4em] text-white/60">Edições</span>
            <span className="h-px w-12 bg-white/30" />
          </div>
        </header>

        <div className="mt-12 flex flex-wrap justify-center gap-x-12 gap-y-14">
          {edicoes.map((ed) => {
            const capa = CONTEUDO_POR_EDICAO[ed.slug]?.paginas[0];
            const moldura = { width: PAGINA_L * ESCALA_CAPA, height: PAGINA_A * ESCALA_CAPA };
            if (!pub.podeVer(ed.slug)) {
              if (pub.carregando) return <div key={ed.slug} style={moldura} />;
              return (
                <Link key={ed.slug} to={`/entre-molas/${ed.slug}`} className="flex flex-col items-center">
                  <div
                    className="flex flex-col items-center justify-center bg-[#a9293b] px-6 text-center shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)]"
                    style={moldura}
                  >
                    <img src={logoCreme} alt="" className="w-[78%] select-none" draggable={false} />
                    <div className="em-display mt-8 text-[44px] font-extrabold uppercase leading-[0.9] text-[#f7ecdc]">Em breve</div>
                  </div>
                  <div className="em-display mt-6 text-[28px] font-bold uppercase tracking-[0.02em] text-[#f7ecdc]">{ed.nome}</div>
                  <div className="em-sans mt-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">
                    {ed.slug === 'edicao-1' ? 'Primeira edição · em breve' : 'Em breve'}
                  </div>
                </Link>
              );
            }
            const emPrevia = !pub.carregando && !pub.estaPublicada(ed.slug);
            return (
              <Link key={ed.slug} to={`/entre-molas/${ed.slug}`} className="group flex flex-col items-center">
                <div
                  className="relative overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-[-1.5deg]"
                  style={moldura}
                >
                  {/* a própria capa da revista, em miniatura */}
                  <div
                    className="pointer-events-none absolute left-0 top-0"
                    style={{ width: PAGINA_L, height: PAGINA_A, transform: `scale(${ESCALA_CAPA})`, transformOrigin: 'top left' }}
                    aria-hidden="true"
                  >
                    {capa?.('solta')}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  {emPrevia && (
                    <div className="em-sans absolute left-0 top-3 bg-[#f7ecdc] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a9293b] shadow-md">
                      Pré-visualização
                    </div>
                  )}
                </div>
                <div className="em-display mt-6 text-[28px] font-bold uppercase tracking-[0.02em] text-[#f7ecdc]">{ed.nome}</div>
                <div className="em-sans mt-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50 transition-colors group-hover:text-white/80">
                  Abrir revista →
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Palco>
  );
};

export default Estante;
