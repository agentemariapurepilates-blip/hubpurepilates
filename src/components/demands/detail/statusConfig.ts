export const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
  missing_info: { label: 'Faltam Informações', color: 'bg-amber-100 text-amber-800' },
  in_approval: { label: 'Em Aprovação', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
} as const;
