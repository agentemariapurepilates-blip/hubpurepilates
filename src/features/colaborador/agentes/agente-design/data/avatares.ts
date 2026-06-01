export type AvatarTipo = 'franqueado' | 'instrutor' | 'aluno';
export type AvatarGenero = 'feminino' | 'masculino';

export type Avatar = {
  id: string;
  nome: string;
  genero: AvatarGenero;
  tipo: AvatarTipo;
  referencias: string[]; // primeira é a thumb
};

export const AVATARES: Avatar[] = [
  {
    id: 'maria-franqueada',
    nome: 'Maria Franqueada',
    genero: 'feminino',
    tipo: 'franqueado',
    referencias: [
      '/images/maria-franqueada/01-frontal.jpeg',
      '/images/maria-franqueada/02-sorrindo.jpeg',
      '/images/maria-franqueada/03-perfil.jpeg',
    ],
  },
  {
    id: 'joao-franqueado',
    nome: 'João Franqueado',
    genero: 'masculino',
    tipo: 'franqueado',
    referencias: [
      '/images/joao-franqueado/01-frontal.jpeg',
      '/images/joao-franqueado/02-corpo-inteiro.jpeg',
    ],
  },
  {
    id: 'maria-instrutora',
    nome: 'Maria Instrutora',
    genero: 'feminino',
    tipo: 'instrutor',
    referencias: [],
  },
  {
    id: 'joao-instrutor',
    nome: 'João Instrutor',
    genero: 'masculino',
    tipo: 'instrutor',
    referencias: [],
  },
  {
    id: 'maria-aluna',
    nome: 'Maria Aluna',
    genero: 'feminino',
    tipo: 'aluno',
    referencias: [
      '/images/maria-aluna/01-frontal.jpeg',
      '/images/maria-aluna/02-sorrindo.jpeg',
    ],
  },
  {
    id: 'aluna-2',
    nome: 'Aluna 2',
    genero: 'feminino',
    tipo: 'aluno',
    referencias: [
      '/images/aluna-2/01-frontal.jpeg',
      '/images/aluna-2/02-perfil.jpeg',
    ],
  },
  {
    id: 'joao-aluno',
    nome: 'João Aluno',
    genero: 'masculino',
    tipo: 'aluno',
    referencias: [],
  },
];

export const TIPO_LABEL: Record<AvatarTipo, string> = {
  franqueado: 'Franqueados',
  instrutor: 'Instrutores',
  aluno: 'Alunos',
};

// Singular com gênero — usado nos chips de cada avatar.
export const TIPO_SINGULAR: Record<AvatarTipo, Record<AvatarGenero, string>> = {
  franqueado: { masculino: 'Franqueado', feminino: 'Franqueada' },
  instrutor: { masculino: 'Instrutor', feminino: 'Instrutora' },
  aluno: { masculino: 'Aluno', feminino: 'Aluna' },
};

export const TIPO_ORDER: AvatarTipo[] = ['franqueado', 'instrutor', 'aluno'];
