import { Pagina, type Lado } from '../diagramacao';
import arte from './fotos/cafe-com-ceo/cafe-com-ceo.jpg';

// Anúncio do Café com CEO. As palavras são as do Canva, sem mudança; a
// diagramação é de anúncio de revista: arte sangrada no topo, bloco vinho com a
// provocação em destaque e o convite como fecho. ("CAFÉ" com acento: correção pedida pela equipe.)

const CafeComCeo = ({ lado, numero }: { lado: Lado; numero: number }) => (
  <Pagina lado={lado} numero={numero} tom="vinho">
    <img
      src={arte}
      alt="Café com CEO"
      draggable={false}
      className="absolute inset-x-0 top-0 h-[630px] w-full select-none object-cover"
      style={{ objectPosition: '50% 20%' }}
    />
    {/* a arte se funde no vinho */}
    <div className="absolute inset-x-0 top-[490px] h-[140px] bg-gradient-to-b from-transparent to-[#a9293b]" />

    <div className="absolute left-[64px] right-[64px] top-[600px]">
      <div className="em-sans inline-block bg-[#f7ecdc] px-[12px] py-[6px] text-[15px] font-bold uppercase tracking-[0.3em] text-[#a9293b]">
        Provocação
      </div>
      <h2 className="em-display mt-[20px] text-[64px] font-extrabold uppercase leading-[0.92] tracking-[-0.005em] text-[#f7ecdc]">
        Você já começou o seu cronograma e agenda de planejamento para <span className="text-[#ffd9a8]">2027?</span>
      </h2>
      <div className="mt-[24px] flex items-start gap-[18px]">
        <span className="mt-[12px] h-[3px] w-[44px] shrink-0 bg-[#f7ecdc]" />
        <p className="em-sans text-[21px] leading-[1.45] text-[#f7ecdc]">
          o nosso <b className="font-bold">CAFÉ COM CEO</b> será uma oportunidade para você dar o primeiro passo.
        </p>
      </div>
    </div>
  </Pagina>
);

export default CafeComCeo;
