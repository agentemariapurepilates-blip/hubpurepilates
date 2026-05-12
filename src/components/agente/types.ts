import { Instagram, Facebook, Clock, CheckCircle2, XCircle, Star } from 'lucide-react';

// ============================================================================
// Tipos compartilhados pelo agente Instagram + Facebook (gerador editorial).
// ============================================================================

export interface VersaoEditada {
  legenda?: string;
  roteiro?: string;
  texto_arte?: string;
  briefing_arte?: string;
}

export interface SceneEntry {
  numero: number;
  cena?: string;
  narracao?: string;
  // Legacy (dados antigos antes da simplificacao do schema)
  tempo?: string;
  descricao?: string;
  fala?: string;
  textoTela?: string;
  imagem?: string;
}

export type FieldKey = 'legenda' | 'roteiro' | 'texto_arte' | 'briefing_arte';

export interface FieldFeedbackEntry {
  status?: 'approved' | 'rejected';
  motivo?: string;
  at?: string;
}

export interface FieldFeedback {
  legenda?: FieldFeedbackEntry;
  roteiro?: FieldFeedbackEntry;
  texto_arte?: FieldFeedbackEntry;
  briefing_arte?: FieldFeedbackEntry;
}

export interface RefinementEntry {
  prompt: string;
  before?: { title?: string | null; legenda?: string | null; roteiro?: string | null; cenas?: SceneEntry[] | null; texto_arte?: string | null; briefing_arte?: string | null };
  after?: { title?: string | null; legenda?: string | null; roteiro?: string | null; cenas?: SceneEntry[] | null; texto_arte?: string | null; briefing_arte?: string | null };
  at: string;
}

export interface GeneratedContent {
  id: string;
  date: string;
  title: string;
  network: 'Instagram Studios' | 'Facebook Studios';
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'favorite';
  content_type?: 'video' | 'estatico' | 'carrossel' | null;
  legenda?: string | null;
  roteiro?: string | null;
  cenas?: SceneEntry[] | null;
  texto_arte?: string | null;
  briefing_arte?: string | null;
  feedback_motivo?: string | null;
  field_feedback?: FieldFeedback | null;
  versao_editada?: VersaoEditada | null;
  refinements?: RefinementEntry[] | null;
}

export interface PastPlan {
  month: string;
  year: string;
  total: number;
  approved: number;
}

// ============================================================================
// Helpers de cena (back-compat com dados legados que tinham fala/imagem/textoTela)
// ============================================================================

export const sceneCena = (c: SceneEntry): string =>
  c.cena?.trim() || c.imagem?.trim() || c.descricao?.trim() || '';

export const sceneNarracao = (c: SceneEntry): string =>
  c.narracao?.trim() || c.fala?.trim() || '';

// Post esta em "modo tema" quando ainda nao foi gerado o conteudo completo.
// Detectamos pela ausencia de legenda.
export const isThemeStage = (p: GeneratedContent | null): boolean =>
  !!p && !p.legenda;

// ============================================================================
// Labels e cores reusaveis
// ============================================================================

export const FIELD_LABELS: Record<FieldKey, string> = {
  legenda: 'Legenda',
  roteiro: 'Roteiro e Cenas',
  texto_arte: 'Texto na arte',
  briefing_arte: 'Briefing da arte',
};

export const networkColors: Record<GeneratedContent['network'], string> = {
  'Instagram Studios': 'bg-pink-500 text-white',
  'Facebook Studios': 'bg-sky-500 text-white',
};

export const networkLegendColors: Record<GeneratedContent['network'], string> = {
  'Instagram Studios': 'bg-pink-500',
  'Facebook Studios': 'bg-sky-500',
};

export const networkIcons: Record<GeneratedContent['network'], typeof Instagram> = {
  'Instagram Studios': Instagram,
  'Facebook Studios': Facebook,
};

export const contentTypeLabel: Record<NonNullable<GeneratedContent['content_type']>, string> = {
  video: 'Vídeo / Reels',
  estatico: 'Estático',
  carrossel: 'Carrossel',
};

export const contentTypeShort: Record<NonNullable<GeneratedContent['content_type']>, string> = {
  video: 'Vídeo',
  estatico: 'Estát.',
  carrossel: 'Carr.',
};

export const contentTypeBadgeColor: Record<NonNullable<GeneratedContent['content_type']>, string> = {
  video: 'bg-purple-600 text-white',
  estatico: 'bg-amber-600 text-white',
  carrossel: 'bg-sky-600 text-white',
};

export const statusIcons: Record<GeneratedContent['status'], typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  favorite: Star,
};

export const statusLabels: Record<GeneratedContent['status'], string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Reprovado',
  favorite: 'Favorito',
};

export const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEK_DAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Sempre Instagram + Facebook (Facebook e replicado do IG pela edge function).
export const FIXED_NETWORKS = ['Instagram Studios', 'Facebook Studios'];
