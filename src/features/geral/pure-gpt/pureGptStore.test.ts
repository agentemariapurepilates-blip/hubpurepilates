import { describe, expect, it, vi } from 'vitest';

// O store importa o cliente do Supabase só para falar com a Edge Function; o
// que se testa aqui é a leitura do arquivo anexado.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

const { ImagemRecusada, TAMANHO_MAXIMO_MB, lerImagem } = await import('./pureGptStore');

describe('lerImagem', () => {
  it('recusa arquivo que não é imagem', async () => {
    const arquivo = new File(['oi'], 'contrato.pdf', { type: 'application/pdf' });
    await expect(lerImagem(arquivo)).rejects.toBeInstanceOf(ImagemRecusada);
  });

  it('recusa imagem acima do limite', async () => {
    const gorda = new File([new Uint8Array((TAMANHO_MAXIMO_MB + 1) * 1024 * 1024)], 'foto.png', {
      type: 'image/png',
    });
    await expect(lerImagem(gorda)).rejects.toBeInstanceOf(ImagemRecusada);
  });

  it('aceita uma imagem dentro do limite e devolve a data URL', async () => {
    const foto = new File([new Uint8Array(64)], 'instrutor.png', { type: 'image/png' });
    const lida = await lerImagem(foto);
    expect(lida.nome).toBe('instrutor.png');
    expect(lida.dataUrl.startsWith('data:')).toBe(true);
  });
});
