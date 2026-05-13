import { ReactNode } from 'react'
import { Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'

/**
 * FilterPanel Component
 * Collapsible side panel for rendering advanced filters.
 * Synchronizing state with URL searchParams should be handled in the parent component.
 * @param children - Filter inputs and controls.
 * @param activeCount - Number of currently active filters to show as a badge.
 * @param onClear - Callback to clear all filters.
 */
export function FilterPanel({
  children,
  activeCount = 0,
  onClear,
}: {
  children: ReactNode
  activeCount?: number
  onClear?: () => void
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 px-1.5 min-w-5 h-5 flex items-center justify-center rounded-full"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle>Filtros Avançados</SheetTitle>
            {activeCount > 0 && onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                Limpar
              </Button>
            )}
          </div>
        </SheetHeader>
        <div className="space-y-6 pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
