import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * DateDisplay Component
 * Formats a date string or object into a localized pt-BR date string.
 * @param date - The date to format.
 * @param relative - If true, displays the relative time (e.g., 'há 2 dias').
 * @param className - Optional CSS classes to append.
 */
export function DateDisplay({
  date,
  relative = false,
  className,
}: {
  date: string | Date
  relative?: boolean
  className?: string
}) {
  if (!date) return <span className={className}>-</span>
  const d = new Date(date)
  const formatted = relative
    ? formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
    : format(d, 'dd/MM/yyyy')
  return <span className={className}>{formatted}</span>
}
