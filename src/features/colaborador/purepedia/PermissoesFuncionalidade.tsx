import { useMemo, useState } from 'react';
import { Search, X, SearchX, UserCog, MonitorSmartphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ArtigoShell, Capa, PS, SecHead, Secao } from './artigoUI';
import {
  PERFIS,
  PERMISSOES,
  SECOES_PERMISSAO,
  type RegistroPermissao,
  type SecaoPermissao,
} from './permissoes';

/**
 * PurePedia — Permissões por Funcionalidade (Pure System).
 *
 * O documento é escrito no sentido TELA → PERFIS. Aqui ele é consultável nos
 * dois sentidos: o sentido PERFIL → TELAS é derivado invertendo a matriz, não
 * é conteúdo novo. Sem busca, a página mostra o documento inteiro na ordem
 * original — a transcrição continua legível sem depender da busca.
 */

const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Telas de um perfil, agrupadas por seção e na ordem do documento. */
function telasDoPerfil(perfil: string) {
  const porSecao = new Map<SecaoPermissao, string[]>();
  for (const r of PERMISSOES) {
    if (!r.perfis.includes(perfil)) continue;
    const lista = porSecao.get(r.secao) ?? [];
    lista.push(r.tela);
    porSecao.set(r.secao, lista);
  }
  const total = [...porSecao.values()].reduce((n, l) => n + l.length, 0);
  return { porSecao, total };
}

const Etiqueta = ({ children, tom }: { children: React.ReactNode; tom: 'perfil' | 'tela' }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]"
    style={{
      borderRadius: '8px 8px 2px 8px',
      background: tom === 'perfil' ? PS.red : PS.ink,
      color: '#fff',
    }}
  >
    {tom === 'perfil' ? <UserCog className="h-3 w-3" /> : <MonitorSmartphone className="h-3 w-3" />}
    {tom === 'perfil' ? 'Perfil' : 'Tela'}
  </span>
);

const Chips = ({ itens }: { itens: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {itens.map((t) => (
      <span
        key={t}
        className="inline-block px-2.5 py-1 text-[0.82rem]"
        style={{ borderRadius: 8, background: PS.bg2, color: PS.ink, border: `1px solid ${PS.line}` }}
      >
        {t}
      </span>
    ))}
  </div>
);

const Cartao = ({ children }: { children: React.ReactNode }) => (
  <div
    className="bg-white p-5"
    style={{ border: `1px solid ${PS.line}`, borderRadius: PS.card, boxShadow: PS.shadowSm }}
  >
    {children}
  </div>
);

const PermissoesFuncionalidade = () => {
  const [consulta, setConsulta] = useState('');
  const termo = normalizar(consulta.trim());
  const buscando = termo.length > 0;

  const perfisAchados = useMemo(
    () => (buscando ? PERFIS.filter((p) => normalizar(p).includes(termo)) : []),
    [termo, buscando],
  );

  const telasAchadas = useMemo(() => {
    if (!buscando) return [] as { tela: string; registros: RegistroPermissao[] }[];
    const nomes: string[] = [];
    for (const r of PERMISSOES) {
      if (normalizar(r.tela).includes(termo) && !nomes.includes(r.tela)) nomes.push(r.tela);
    }
    return nomes.map((tela) => ({
      tela,
      registros: PERMISSOES.filter((r) => r.tela === tela),
    }));
  }, [termo, buscando]);

  const semResultado = buscando && perfisAchados.length === 0 && telasAchadas.length === 0;

  return (
    <ArtigoShell>
      <Capa eyebrow="Pure System" titulo="Permissões por Funcionalidade" />

      <Secao>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Busque um perfil ou uma tela — ex.: Recepção, Customer Success, Royalties"
            aria-label="Buscar perfil ou tela"
            className="h-12 rounded-xl pl-11 pr-11 text-[15px]"
          />
          {buscando && (
            <button
              type="button"
              onClick={() => setConsulta('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 pl-1 text-xs" style={{ color: PS.inkMute }}>
          {buscando
            ? `${perfisAchados.length} ${perfisAchados.length === 1 ? 'perfil' : 'perfis'} · ${telasAchadas.length} ${telasAchadas.length === 1 ? 'tela' : 'telas'}`
            : `${PERFIS.length} perfis · ${PERMISSOES.length} telas. Sem busca, o documento aparece inteiro abaixo.`}
        </p>
      </Secao>

      {/* ——— Resultados ——— */}
      {buscando && (
        <Secao tom="cinza">
          {semResultado ? (
            <div className="py-10 text-center">
              <SearchX className="mx-auto h-8 w-8" style={{ color: PS.inkMute }} />
              <p className="mt-3 font-bold" style={{ color: PS.ink }}>
                Nada encontrado para “{consulta.trim()}”
              </p>
              <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: PS.inkSoft }}>
                A busca cobre nomes de perfil e nomes de tela. Lembrando que o documento lista perfis de
                acesso, não pessoas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {perfisAchados.map((perfil) => {
                const { porSecao, total } = telasDoPerfil(perfil);
                return (
                  <Cartao key={`perfil-${perfil}`}>
                    <div className="mb-3 flex flex-wrap items-center gap-2.5">
                      <Etiqueta tom="perfil">Perfil</Etiqueta>
                      <h3 className="text-[1.05rem] font-extrabold" style={{ color: PS.ink }}>
                        {perfil}
                      </h3>
                      <span className="text-[0.82rem] font-semibold" style={{ color: PS.red }}>
                        {total} {total === 1 ? 'tela' : 'telas'}
                      </span>
                    </div>
                    {SECOES_PERMISSAO.filter((s) => porSecao.has(s)).map((s) => (
                      <div key={s} className="mt-3">
                        <p
                          className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.14em]"
                          style={{ color: PS.inkMute }}
                        >
                          {s} ({porSecao.get(s)!.length})
                        </p>
                        <Chips itens={porSecao.get(s)!} />
                      </div>
                    ))}
                  </Cartao>
                );
              })}

              {telasAchadas.map(({ tela, registros }) => (
                <Cartao key={`tela-${tela}`}>
                  <div className="mb-3 flex flex-wrap items-center gap-2.5">
                    <Etiqueta tom="tela">Tela</Etiqueta>
                    <h3 className="text-[1.05rem] font-extrabold" style={{ color: PS.ink }}>
                      {tela}
                    </h3>
                    {registros.length > 1 && (
                      <span className="text-[0.82rem] font-semibold" style={{ color: PS.red }}>
                        aparece em {registros.length} seções, com acessos diferentes
                      </span>
                    )}
                  </div>
                  {registros.map((r, i) => (
                    <div key={`${r.secao}-${i}`} className="mt-3">
                      <p
                        className="mb-1.5 text-[0.72rem] font-bold uppercase tracking-[0.14em]"
                        style={{ color: PS.inkMute }}
                      >
                        {r.secao} — {r.perfis.length} {r.perfis.length === 1 ? 'perfil' : 'perfis'}
                      </p>
                      <Chips itens={r.perfis} />
                    </div>
                  ))}
                </Cartao>
              ))}
            </div>
          )}
        </Secao>
      )}

      {/* ——— O documento, na ordem original ——— */}
      {!buscando &&
        SECOES_PERMISSAO.map((secao, i) => (
          <Secao key={secao} tom={i % 2 === 0 ? 'cinza' : 'branco'}>
            <SecHead titulo={secao} />
            <div className="space-y-4">
              {PERMISSOES.filter((r) => r.secao === secao).map((r, j) => (
                <Cartao key={`${secao}-${r.tela}-${j}`}>
                  <h3 className="mb-2 text-[1.02rem] font-extrabold" style={{ color: PS.ink }}>
                    {r.tela}
                  </h3>
                  <p
                    className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.14em]"
                    style={{ color: PS.inkMute }}
                  >
                    Perfis com acesso ({r.perfis.length})
                  </p>
                  <Chips itens={r.perfis} />
                </Cartao>
              ))}
            </div>
          </Secao>
        ))}
    </ArtigoShell>
  );
};

export default PermissoesFuncionalidade;
