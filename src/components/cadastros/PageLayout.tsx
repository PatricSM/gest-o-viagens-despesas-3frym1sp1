import { ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  description?: string
  children: ReactNode
  onSearch?: (q: string) => void
  filters?: ReactNode
  action?: ReactNode
  page?: number
  totalPages?: number
  onPageChange?: (p: number) => void
}

export function PageLayout({
  title,
  description,
  children,
  onSearch,
  filters,
  action,
  page,
  totalPages,
  onPageChange,
}: Props) {
  const [q, setQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => onSearch?.(q), 300)
    return () => clearTimeout(t)
  }, [q, onSearch])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link to="/cadastros">
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-headline-md">{title}</h1>
            {description && <p className="text-body-sm mt-1">{description}</p>}
          </div>
        </div>
        {action}
      </div>

      <div className="bg-card border border-border/40 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 bg-background"
              placeholder="Buscar..."
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {filters && <div className="flex items-center gap-2 overflow-x-auto">{filters}</div>}
        </div>

        <div className="flex-1 overflow-auto">{children}</div>

        {totalPages !== undefined && totalPages > 1 && (
          <div className="p-4 border-t border-border/40 flex justify-between items-center text-sm bg-muted/20">
            <span className="text-muted-foreground font-medium">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => onPageChange?.((page || 1) - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => onPageChange?.((page || 1) + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
