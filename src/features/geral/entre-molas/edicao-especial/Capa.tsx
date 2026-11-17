import logoCreme from '../assets/logo-entre-molas-creme.png';
import { NotaFiscal } from './Ilustracoes';

// Capa da Edição especial: o vinho da marca, o logo, a manchete e a linha fina,
// exatamente como na abertura da edição original.

const Capa = () => (
  <div className="em-page em-page--solta em-tom--vinho">
    <svg aria-hidden="true" width="900" height="900" viewBox="0 0 900 900" className="absolute -bottom-[330px] -right-[300px]">
      <g fill="none" stroke="#f7ecdc" strokeOpacity="0.16" strokeWidth="1.5">
        {[120, 180, 240, 300, 360, 420].map((r) => (
          <circle key={r} cx="450" cy="450" r={r} />
        ))}
      </g>
    </svg>
    <div className="absolute inset-x-[56px] top-[52px] flex flex-wrap justify-between gap-[12px]">
      {['Edição especial · Novembro 2026', 'Reforma tributária · Leitura de 10 min'].map((t) => (
        <span key={t} className="em-sans rounded-full border border-[#f7ecdc]/60 px-[16px] py-[8px] text-[14px] font-medium tracking-[0.06em]">
          {t}
        </span>
      ))}
    </div>
    <img
      src={logoCreme}
      alt="Entre Molas — Você por dentro de tudo."
      draggable={false}
      className="em-sobe absolute left-[44px] top-[150px] w-[470px] max-w-none select-none"
      style={{ animationDelay: '0.15s' }}
    />
    <NotaFiscal className="em-sobe absolute right-[-30px] top-[118px] w-[300px]" style={{ rotate: '8deg', animationDelay: '0.25s' }} />
    <div className="em-sobe absolute inset-x-[56px] top-[420px]" style={{ animationDelay: '0.4s' }}>
      <h1 className="em-display text-[96px] font-extrabold uppercase leading-[0.86] tracking-[-0.01em]">
        Nota fiscal sempre foi regra. <span className="text-[#ffd9a8]">Agora o sistema é outro.</span>
      </h1>
      <p className="em-sans mt-[22px] max-w-[640px] text-[19px] font-light leading-[1.5]">
        A obrigação de emitir nota sobre 100% da receita já está na COF que você assinou. Com a reforma tributária, o jeito de cumprir mudou.
        Esta edição mostra o que muda e como a rede vai reforçar esse compromisso.
      </p>
    </div>
    <div className="em-sans absolute inset-x-[56px] bottom-[44px] flex justify-between text-[13px] font-semibold uppercase tracking-[0.2em] opacity-80">
      <span>Revista digital da rede Pure Pilates</span>
      <span>1 mensagem · 3 números · 10 minutos</span>
    </div>
    <div className="em-grao" />
  </div>
);

export default Capa;
