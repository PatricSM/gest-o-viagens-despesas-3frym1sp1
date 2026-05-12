import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bookmark, Trash2 } from 'lucide-react'

export function SavedReports({ onSelect }: { onSelect: (rep: any) => void }) {
  const [reports, setReports] = useState<any[]>([])

  const load = async () => {
    try {
      const records = await pb.collection('relatorios_salvos').getFullList({ sort: '-created' })
      setReports(records)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    load()
    const handle = () => load()
    window.addEventListener('reports-saved', handle)
    return () => window.removeEventListener('reports-saved', handle)
  }, [])

  return (
    <Card className="w-64 h-full flex flex-col shrink-0 bg-background overflow-hidden">
      <CardHeader className="py-4 border-b bg-muted/30 shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-primary" /> Relatórios Salvos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 overflow-y-auto">
        {reports.length === 0 && (
          <p className="text-xs text-muted-foreground p-2 text-center mt-4">
            Nenhum relatório salvo.
          </p>
        )}
        {reports.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md group transition-colors"
          >
            <button
              className="text-sm text-left flex-1 font-medium truncate"
              onClick={() => onSelect(r)}
            >
              {r.nome}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => pb.collection('relatorios_salvos').delete(r.id).then(load)}
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
