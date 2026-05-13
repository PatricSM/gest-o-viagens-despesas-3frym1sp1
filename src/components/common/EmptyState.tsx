import { Button } from '@/components/ui/button'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon?: any
  title: string
  description?: string
  action?: { label: string; onClick: () => void; icon?: any }
  secondary?: { label: string; onClick: () => void }
  variant?: 'default' | 'success' | 'filter'
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondary,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in duration-300',
        className,
      )}
    >
      <div
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center mb-4',
          variant === 'success' &&
            'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          variant === 'filter' &&
            'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
          variant === 'default' && 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>}
      {(action || secondary) && (
        <div className="flex gap-2 mt-6">
          {secondary && (
            <Button onClick={secondary.onClick} variant="outline">
              {secondary.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick}>
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
