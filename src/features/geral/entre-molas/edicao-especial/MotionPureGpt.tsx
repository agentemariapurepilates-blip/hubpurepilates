import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Download, Send, Sparkles } from 'lucide-react';

// Motion da capa: o Pure GPT funcionando num celular, em loop. A pessoa escreve o
// pedido, o Pure GPT responde com a arte (o modelo real de Carnaval 2027 do Pure
// Design) e o "Baixar PNG" é apertado. Tudo desenhado aqui; nenhuma conversa real.

const PEDIDO = 'Preciso do aviso de Carnaval';
const RESPOSTA = 'Pronto! Usei o modelo de Carnaval 2027, já com as datas.';
const ARTE = '/images/pure-design/feriado-2027-carnaval.jpg';

// Linha do tempo (ms): digita → envia → pensa → responde → arte → baixa → recomeça.
const ROTEIRO = [
  { fase: 'digitando', dura: 2200 },
  { fase: 'enviado', dura: 500 },
  { fase: 'pensando', dura: 1300 },
  { fase: 'respondeu', dura: 900 },
  { fase: 'arte', dura: 1700 },
  { fase: 'baixando', dura: 900 },
  { fase: 'baixado', dura: 2200 },
] as const;
type Fase = (typeof ROTEIRO)[number]['fase'];

const depois = (a: Fase, b: Fase) => ROTEIRO.findIndex((r) => r.fase === a) >= ROTEIRO.findIndex((r) => r.fase === b);

/** `parado`: mostra só o fim da conversa, sem animação (usado na capa). */
export const MotionPureGpt = ({ className, parado = false }: { className?: string; parado?: boolean }) => {
  const [passo, setPasso] = useState(parado ? ROTEIRO.length - 1 : 0);
  const [letras, setLetras] = useState(0);
  const fase = ROTEIRO[passo].fase;

  // avança as fases em loop
  useEffect(() => {
    if (parado) return;
    const t = setTimeout(() => setPasso((p) => (p + 1) % ROTEIRO.length), ROTEIRO[passo].dura);
    return () => clearTimeout(t);
  }, [passo, parado]);

  // digitação do pedido, letra por letra
  useEffect(() => {
    if (fase !== 'digitando') return;
    setLetras(0);
    const t = setInterval(() => setLetras((n) => Math.min(PEDIDO.length, n + 1)), 1800 / PEDIDO.length);
    return () => clearInterval(t);
  }, [fase]);

  const enviado = fase !== 'digitando';
  const bolha = {
    initial: { opacity: 0, y: 14, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
  };

  return (
    <div aria-hidden="true" className={`rounded-[38px] bg-[#141010] p-[9px] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.75)] ${className ?? ''}`}>
      <div className="em-sans relative flex h-full flex-col overflow-hidden rounded-[30px] bg-[#f6f2ec] text-[#231f20]">
        {/* topo do app */}
        <div className="flex items-center gap-[8px] border-b border-black/5 bg-white px-[14px] pb-[10px] pt-[22px]">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#a9293b] text-white">
            <Sparkles className="h-[14px] w-[14px]" />
          </span>
          <span>
            <span className="block text-[12.5px] font-bold leading-none">Peça sua arte</span>
            <span className="mt-[3px] block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9293b]">Pure GPT</span>
          </span>
        </div>

        {/* conversa */}
        <div className="flex flex-1 flex-col justify-end gap-[8px] px-[12px] pb-[10px]">
          <AnimatePresence>
            {enviado && (
              <motion.div key="pedido" {...bolha} className="self-end rounded-[14px] rounded-br-[3px] bg-[#a9293b] px-[11px] py-[7px] text-[11.5px] leading-[1.35] text-white">
                {PEDIDO}
              </motion.div>
            )}
            {fase === 'pensando' && (
              <motion.div key="pontos" {...bolha} exit={{ opacity: 0 }} className="flex gap-[4px] self-start rounded-[14px] rounded-bl-[3px] bg-white px-[12px] py-[10px] shadow-sm">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-[6px] w-[6px] rounded-full bg-[#a9293b]"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </motion.div>
            )}
            {depois(fase, 'respondeu') && (
              <motion.div key="resposta" {...bolha} className="max-w-[88%] self-start rounded-[14px] rounded-bl-[3px] bg-white px-[11px] py-[8px] text-[11.5px] leading-[1.35] shadow-sm">
                {RESPOSTA}
                {depois(fase, 'arte') && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="mt-[8px] flex items-end gap-[8px]"
                  >
                    <img src={ARTE} alt="" draggable={false} className="h-[118px] w-[94px] select-none rounded-[5px] object-cover shadow-md" />
                    <div className="flex flex-col gap-[5px] pb-[2px]">
                      <span className="rounded-[6px] border border-black/15 px-[8px] py-[5px] text-[9.5px] font-semibold">Abrir no editor</span>
                      <motion.span
                        animate={fase === 'baixando' ? { scale: [1, 0.9, 1] } : { scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className={`flex items-center gap-[4px] rounded-[6px] px-[8px] py-[5px] text-[9.5px] font-semibold text-white ${fase === 'baixado' ? 'bg-[#3f7d4e]' : 'bg-[#a9293b]'}`}
                      >
                        {fase === 'baixado' ? <Check className="h-[10px] w-[10px]" /> : <Download className="h-[10px] w-[10px]" />}
                        {fase === 'baixado' ? 'Baixado' : 'Baixar PNG'}
                      </motion.span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* campo de escrever */}
        <div className="flex items-center gap-[8px] border-t border-black/5 bg-white px-[12px] py-[10px]">
          <span className="min-h-[16px] flex-1 truncate text-[11.5px]">
            {fase === 'digitando' ? (
              <>
                {PEDIDO.slice(0, letras)}
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="ml-[1px] inline-block h-[12px] w-[1.5px] translate-y-[2px] bg-[#a9293b]" />
              </>
            ) : (
              <span className="opacity-40">Escreva o que você precisa…</span>
            )}
          </span>
          <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full text-white transition-colors ${fase === 'digitando' && letras === PEDIDO.length ? 'bg-[#a9293b]' : 'bg-[#a9293b]/40'}`}>
            <Send className="h-[12px] w-[12px]" />
          </span>
        </div>
      </div>
    </div>
  );
};
