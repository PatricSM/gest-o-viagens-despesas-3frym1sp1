import { Badge } from '@/components/ui/badge'

/**
 * StatusBadge Component
 * Maps a status string to a standardized colored badge.
 * @param status - The status string (e.g., 'aprovada', 'rascunho').
 * @param className - Optional CSS classes to append.
 */
const statusMap: Record<string, { color: string; label: string }> = {
  rascunho: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Rascunho' },
  em_aprovacao: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Em Aprovação' },
  em_aprovacao_gestor: {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Aprovação Gestor',
  },
  em_aprovacao_financeiro: {
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    label: 'Aprovação Fin.',
  },
  aprovada: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Aprovada' },
  aprovado: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Aprovado' },
  paga: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Paga' },
  pago: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Pago' },
  reembolsada: {
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    label: 'Reembolsada',
  },
  rejeitada: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Rejeitada' },
  rejeitado: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Rejeitado' },
  cancelada: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelada' },
  cancelado: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelado' },
  devolvida: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Devolvida' },
  devolvido: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Devolvido' },
  concluida: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Concluída' },
  em_andamento: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Em Andamento' },
  pendente: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pendente' },
  a_pagar: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'A Pagar' },
  enviada: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Enviada' },
  solicitado: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Solicitado' },
  acertado: { color: 'bg-teal-100 text-teal-700 border-teal-200', label: 'Acertado' },
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusMap[status?.toLowerCase()] || {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    label: status?.toUpperCase() || 'UNKNOWN',
  }
  return (
    <Badge variant="outline" className={`${config.color} ${className || ''}`}>
      {config.label}
    </Badge>
  )
}
