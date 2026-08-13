// Artes prontas — arquivos finalizados hospedados no próprio Hub (pasta public/artes-prontas).
// O download é servido direto pelo Hub (mesma origem), sem depender do Google Drive.
// Para adicionar novas artes: suba o PDF/imagem em public/artes-prontas/ e registre aqui.

export interface ArtePronta {
  id: string;
  /** Campanha / grupo — vira o cabeçalho de seção na galeria. */
  campaign: string;
  /** Título da peça. */
  title: string;
  /** Etiqueta do formato (ex.: "Bandeja", "Feed", "Story"). */
  format: string;
  /** Miniatura de preview (PNG em public/artes-prontas). */
  thumbnail: string;
  /** Arquivo para download (PDF/PNG em public/artes-prontas). */
  file: string;
  /** Tipo do arquivo, mostrado no botão. */
  fileType: 'PDF' | 'PNG' | 'JPG';
  /** Rótulo de tamanho, ex.: "1,7 MB". */
  sizeLabel: string;
}

export const artesProntas: ArtePronta[] = [
  {
    id: 'bandeja-melhor-hora-cuidar',
    campaign: 'Arte para impressão - Bandeja',
    title: 'Cuidar de você nunca foi tão fácil',
    format: 'Bandeja',
    thumbnail: '/artes-prontas/bandeja-texto1.png',
    file: '/artes-prontas/bandeja-texto1.pdf',
    fileType: 'PDF',
    sizeLabel: '1,7 MB',
  },
  {
    id: 'bandeja-melhor-hora-esperando',
    campaign: 'Arte para impressão - Bandeja',
    title: 'Tem uma Pure Pilates esperando por você',
    format: 'Bandeja',
    thumbnail: '/artes-prontas/bandeja-texto2.png',
    file: '/artes-prontas/bandeja-texto2.pdf',
    fileType: 'PDF',
    sizeLabel: '4,8 MB',
  },
  {
    id: 'bandeja-melhor-hora-movimento',
    campaign: 'Arte para impressão - Bandeja',
    title: 'Movimento que fortalece corpo e mente',
    format: 'Bandeja',
    thumbnail: '/artes-prontas/bandeja-texto3.png',
    file: '/artes-prontas/bandeja-texto3.pdf',
    fileType: 'PDF',
    sizeLabel: '1,7 MB',
  },
];
