import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const getStatusConfig = (status: string) => {
  const s = status?.toLowerCase() || ''

  if (['rascunho'].includes(s)) {
    return 'bg-zinc-100 text-zinc-700 border-dashed border-zinc-300'
  }
  if (['em_aprovacao', 'em_aprovacao_gestor', 'pendente', 'solicitado'].includes(s)) {
    return 'bg-amber-100 text-amber-900 border-amber-300'
  }
  if (['em_aprovacao_financeiro', 'enviada', 'em_andamento'].includes(s)) {
    return 'bg-blue-100 text-blue-900 border-blue-300'
  }
  if (
    ['aprovada', 'aprovado', 'concluida', 'paga', 'pago', 'acertado', 'reembolsada'].includes(s)
  ) {
    return 'bg-emerald-100 text-emerald-900 border-emerald-300'
  }
  if (['a_pagar', 'devolvida', 'devolvido'].includes(s)) {
    return 'bg-orange-100 text-orange-900 border-orange-300'
  }
  if (['rejeitada', 'rejeitado'].includes(s)) {
    return 'bg-red-100 text-red-900 border-red-300'
  }
  if (['cancelada'].includes(s)) {
    return 'bg-zinc-200 text-zinc-700 border-zinc-300'
  }
  if (['encerrada'].includes(s)) {
    return 'bg-zinc-100 text-zinc-600 border-zinc-300'
  }
  if (['pulado'].includes(s)) {
    return 'bg-zinc-100 text-zinc-600 border-dashed border-zinc-300'
  }

  return 'bg-zinc-100 text-zinc-700 border-zinc-300'
}

const formatLabel = (status: string) => {
  if (!status) return 'Desconhecido'
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const colorClass = getStatusConfig(status)
  const label = formatLabel(status)

  return (
    <Badge
      variant="outline"
      className={cn(colorClass, size === 'sm' && 'px-1.5 py-0 text-[10px] h-5', className)}
    >
      {label}
    </Badge>
  )
}
