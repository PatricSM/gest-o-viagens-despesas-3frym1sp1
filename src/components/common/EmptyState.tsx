import { Button } from '@/components/ui/button'

/**
 * EmptyState Component
 * Displays an empty state with an icon, title, description, and an optional call-to-action button.
 * @param icon - The Lucide icon component to display.
 * @param title - The primary title of the empty state.
 * @param description - The secondary description text.
 * @param action - Optional CTA configuration containing a label and an onClick handler.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-300">
      <Icon className="w-12 h-12 mb-4 opacity-20" />
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm mb-4 max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}
