// Artes prontas — arquivos finalizados hospedados no próprio Hub (pasta public/artes-prontas).
// O download é servido direto pelo Hub (mesma origem), sem depender do Google Drive.
// Para adicionar novas artes: suba o PDF/imagem em public/arquivos/artes-prontas/ e registre aqui.

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

/** Nome amigável do arquivo baixado. */
export const nomeDoDownload = (arte: ArtePronta) => {
  const slug = arte.title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `Pure Pilates - ${arte.format} - ${slug}.${arte.fileType.toLowerCase()}`;
};

export const artesProntas: ArtePronta[] = [
  {
    id: 'bandeja-melhor-hora-cuidar',
    campaign: 'Arte para impressão - Bandeja',
    title: 'Cuidar de você nunca foi tão fácil',
    format: 'Bandeja',
    thumbnail: '/arquivos/artes-prontas/bandeja-texto1.png',
    file: '/arquivos/artes-prontas/bandeja-texto1.pdf',
    fileType: 'PDF',
    sizeLabel: '1,7 MB',
  },
  {
    id: 'bandeja-melhor-hora-esperando',
    campaign: 'Arte para impressão - Bandeja',
    title: 'Tem uma Pure Pilates esperando por você',
    format: 'Bandeja',
    thumbnail: '/arquivos/artes-prontas/bandeja-texto2.png',
    file: '/arquivos/artes-prontas/bandeja-texto2.pdf',
    fileType: 'PDF',
    sizeLabel: '4,8 MB',
  },
  {
    id: 'bandeja-melhor-hora-movimento',
    campaign: 'Arte para impressão - Bandeja',
    title: 'Movimento que fortalece corpo e mente',
    format: 'Bandeja',
    thumbnail: '/arquivos/artes-prontas/bandeja-texto3.png',
    file: '/arquivos/artes-prontas/bandeja-texto3.pdf',
    fileType: 'PDF',
    sizeLabel: '1,7 MB',
  },
  {
    id: 'tag-03-dia-da-mulher',
    campaign: 'Tags 2026',
    title: 'Dia da Mulher (Março)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-03-dia-da-mulher.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-03-dia-da-mulher.pdf',
    fileType: 'PDF',
    sizeLabel: '40 MB',
  },
  {
    id: 'tag-04-pascoa',
    campaign: 'Tags 2026',
    title: 'Páscoa (Abril)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-04-pascoa.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-04-pascoa.pdf',
    fileType: 'PDF',
    sizeLabel: '1,5 MB',
  },
  {
    id: 'tag-05-dia-das-maes',
    campaign: 'Tags 2026',
    title: 'Dia das Mães (Maio)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-05-dia-das-maes.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-05-dia-das-maes.pdf',
    fileType: 'PDF',
    sizeLabel: '1,7 MB',
  },
  {
    id: 'tag-06-dia-dos-namorados',
    campaign: 'Tags 2026',
    title: 'Dia dos Namorados (Junho)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-06-dia-dos-namorados.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-06-dia-dos-namorados.pdf',
    fileType: 'PDF',
    sizeLabel: '1,4 MB',
  },
  {
    id: 'tag-06-festa-junina',
    campaign: 'Tags 2026',
    title: 'Festa Junina (Junho)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-06-festa-junina.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-06-festa-junina.pdf',
    fileType: 'PDF',
    sizeLabel: '1,8 MB',
  },
  {
    id: 'tag-08-dia-dos-pais',
    campaign: 'Tags 2026',
    title: 'Dia dos Pais (Agosto)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-08-dia-dos-pais.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-08-dia-dos-pais.pdf',
    fileType: 'PDF',
    sizeLabel: '1,4 MB',
  },
  {
    id: 'tag-09-setembro-amarelo',
    campaign: 'Tags 2026',
    title: 'Setembro Amarelo (Setembro)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-09-setembro-amarelo.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-09-setembro-amarelo.pdf',
    fileType: 'PDF',
    sizeLabel: '1,4 MB',
  },
  {
    id: 'tag-09-aniversario-pure',
    campaign: 'Tags 2026',
    title: 'Aniversário Pure Pilates (Setembro)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-09-aniversario-pure.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-09-aniversario-pure.pdf',
    fileType: 'PDF',
    sizeLabel: '1,7 MB',
  },
  {
    id: 'tag-10-outubro-rosa',
    campaign: 'Tags 2026',
    title: 'Outubro Rosa (Outubro)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-10-outubro-rosa.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-10-outubro-rosa.pdf',
    fileType: 'PDF',
    sizeLabel: '1,4 MB',
  },
  {
    id: 'tag-11-novembro-azul',
    campaign: 'Tags 2026',
    title: 'Novembro Azul (Novembro)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-11-novembro-azul.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-11-novembro-azul.pdf',
    fileType: 'PDF',
    sizeLabel: '1,4 MB',
  },
  {
    id: 'tag-12-natal',
    campaign: 'Tags 2026',
    title: 'Natal (Dezembro)',
    format: 'Tag',
    thumbnail: '/arquivos/artes-prontas/tags-2026/tag-12-natal.jpg',
    file: '/arquivos/artes-prontas/tags-2026/tag-12-natal.pdf',
    fileType: 'PDF',
    sizeLabel: '1,6 MB',
  },
];
