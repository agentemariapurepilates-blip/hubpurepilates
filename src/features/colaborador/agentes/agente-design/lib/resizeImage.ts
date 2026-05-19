// Redimensiona uma imagem no navegador pra caber no limite de payload das Edge
// Functions do Supabase (~6MB). Mantém a fidelidade necessária pra IA analisar
// pose e gerar imagem (1280px no lado maior é mais do que suficiente).

type ResizeOptions = {
  maxDimension?: number;
  quality?: number;
  skipThresholdBytes?: number;
};

export type ResizedImage = {
  mime_type: string;
  data: string; // base64 sem prefixo data URI
  previewUrl: string; // object URL pra preview no DOM
};

export async function fileToResizedBase64(
  file: File,
  options: ResizeOptions = {}
): Promise<ResizedImage> {
  const maxDimension = options.maxDimension ?? 1280;
  const quality = options.quality ?? 0.85;
  const skipThresholdBytes = options.skipThresholdBytes ?? 500_000;

  // Imagens pequenas vão direto, sem reprocessar — preserva fidelidade.
  if (file.size <= skipThresholdBytes) {
    const dataUrl = await readAsDataUrl(file);
    return {
      mime_type: file.type || 'image/jpeg',
      data: dataUrl.split(',')[1],
      previewUrl: URL.createObjectURL(file),
    };
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(sourceUrl);
    const ratio = Math.min(maxDimension / img.width, maxDimension / img.height, 1);
    const targetWidth = Math.max(1, Math.round(img.width * ratio));
    const targetHeight = Math.max(1, Math.round(img.height * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D não disponível neste navegador');
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return {
      mime_type: 'image/jpeg',
      data: dataUrl.split(',')[1],
      previewUrl: sourceUrl,
    };
  } catch (err) {
    URL.revokeObjectURL(sourceUrl);
    throw err;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = src;
  });
}
