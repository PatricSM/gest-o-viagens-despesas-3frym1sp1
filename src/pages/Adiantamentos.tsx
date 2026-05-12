import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

export default function Adiantamentos() {
  const [items, setItems] = useState<any[]>([])

  const loadData = async () => {
    try {
      const data = await pb.collection('adiantamentos').getFullList({
        sort: '-created',
        expand: 'moeda_id,viagem_id',
      })
      setItems(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('adiantamentos', () => {
    loadData()
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-slide-in-bottom">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md text-foreground">Adiantamentos</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Gerencie suas solicitações de adiantamento de viagem.
          </p>
        </div>
        <Button className="shadow-elevation">
          <Plus className="w-4 h-4 mr-2" />
          Novo Adiantamento
        </Button>
      </div>

      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-label-caps">Código</TableHead>
                <TableHead className="text-label-caps">Data</TableHead>
                <TableHead className="text-label-caps">Justificativa</TableHead>
                <TableHead className="text-label-caps">Viagem</TableHead>
                <TableHead className="text-label-caps text-right">Valor</TableHead>
                <TableHead className="text-label-caps text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum adiantamento encontrado.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.codigo || '-'}</TableCell>
                  <TableCell className="text-body-sm whitespace-nowrap">
                    {formatDate(item.created)}
                  </TableCell>
                  <TableCell>{item.justificativa}</TableCell>
                  <TableCell className="text-body-sm text-muted-foreground">
                    {item.expand?.viagem_id?.codigo || '-'}
                  </TableCell>
                  <TableCell className="text-right text-data-tabular font-medium">
                    {formatCurrency(item.valor)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="uppercase text-xs">
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
