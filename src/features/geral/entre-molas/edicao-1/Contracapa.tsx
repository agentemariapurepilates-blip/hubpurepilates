import logoCreme from '../assets/logo-entre-molas-creme.png';
import { Pagina, type Lado } from '../diagramacao';

// Contracapa: só o logo, sobre o vinho da marca.

const Contracapa = ({ lado }: { lado: Lado }) => (
  <Pagina lado={lado} tom="vinho" semFolio>
    <div className="absolute inset-0 flex items-center justify-center">
      <img src={logoCreme} alt="Entre Molas — Você por dentro de tudo." draggable={false} className="w-[620px] max-w-none select-none" />
    </div>
  </Pagina>
);

export default Contracapa;
