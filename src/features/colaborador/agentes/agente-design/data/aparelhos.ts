// Catálogo de aparelhos Pure Pilates.
// Designer seleciona 1+ aparelhos; a UI envia as imagens como referência
// visual pro Nano Banana, e o prompt cita explicitamente "use exatamente
// o aparelho mostrado nas fotos anexadas".

export type Aparelho = {
  id: string;
  nome: string;
  referencias: string[]; // primeira é a thumb
};

export const APARELHOS: Aparelho[] = [
  {
    id: 'reformer',
    nome: 'Reformer',
    referencias: ['/images/aparelhos/reformer/01-frontal.jpg'],
  },
  {
    id: 'cadillac',
    nome: 'Cadillac',
    referencias: ['/images/aparelhos/cadillac/01-frontal.jpg'],
  },
  {
    id: 'chair',
    nome: 'Chair',
    referencias: ['/images/aparelhos/chair/01-frontal.jpg'],
  },
  {
    id: 'barrel',
    nome: 'Barrel',
    referencias: ['/images/aparelhos/barrel/01-frontal.jpg'],
  },
];
