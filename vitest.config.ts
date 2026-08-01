import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Fuso fixo e DIFERENTE de America/Sao_Paulo de propósito: nesta máquina
    // o fuso do SO já é America/Sao_Paulo, então testes que dependem de uma
    // âncora de fuso explícita (ex.: src/features/colaborador/inauguracoes/
    // lib/prazo.test.ts) passariam mesmo com uma implementação que usasse
    // componentes de data LOCAIS por engano — o bug ficaria mascarado. Rodar
    // em UTC garante que só uma implementação que ancora explicitamente em
    // -03:00 (e não no relógio da máquina) passa.
    env: {
      TZ: 'UTC',
    },
  },
});
