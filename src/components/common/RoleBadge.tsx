import { Badge } from '@/components/ui/badge'

const roleMap: Record<string, { color: string; label: string }> = {
  admin: { color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Admin' },
  financeiro: { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Financeiro' },
  gestor: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Gestor' },
  viajante: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Viajante' },
  auditor: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Auditor' },
}

/**
 * RoleBadge Component
 * Renders a standardized colored badge indicating the user's role.
 * @param role - The internal role key.
 * @param className - Optional CSS classes to append.
 */
export function RoleBadge({ role, className }: { role: string; className?: string }) {
  const config = roleMap[role?.toLowerCase()] || {
    color: 'bg-muted text-muted-foreground',
    label: role,
  }
  return (
    <Badge variant="outline" className={`${config.color} ${className || ''}`}>
      {config.label}
    </Badge>
  )
}
