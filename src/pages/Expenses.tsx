import { useState, useEffect } from 'react'
import { Search, Plus, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog'
import { getDespesas } from '@/services/despesas'
import { useRealtime } from '@/hooks/use-realtime'

export default function Expenses() {
  const [despesas, setDespesas] = useState<any[]>([])

  const loadData = async () => {
    try {
      const data = await getDespesas()
      setDespesas(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('despesas', () => {
    loadData()
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-slide-in-bottom">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md text-foreground">Despesas</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Gerencie e registre seus gastos corporativos.
          </p>
        </div>
        <ExpenseFormDialog onSuccess={loadData}>
          <Button className="shadow-elevation">
            <Plus className="w-4 h-4 mr-2" />
            Nova Despesa
          </Button>
        </ExpenseFormDialog>
      </div>

      <Card className="border-none shadow-elevation">
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar despesas..." className="pl-9" />
            </div>
            <Button variant="outline">Filtros</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-label-caps">Data</TableHead>
                <TableHead className="text-label-caps">Descrição</TableHead>
                <TableHead className="text-label-caps">Categoria</TableHead>
                <TableHead className="text-label-caps">Viagem Associada</TableHead>
                <TableHead className="text-label-caps text-right">Valor</TableHead>
                <TableHead className="text-label-caps text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {despesas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma despesa registrada.
                  </TableCell>
                </TableRow>
              )}
              {despesas.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-body-sm whitespace-nowrap">
                    {formatDate(exp.data_despesa)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {exp.descricao || exp.expand?.categoria_id?.nome || 'Despesa'}
                      {exp.possivel_duplicidade && (
                        <AlertTriangle
                          className="w-4 h-4 text-amber-500"
                          title="Possível Duplicidade"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-body-sm text-muted-foreground">
                    {exp.expand?.categoria_id?.nome || 'Outros'}
                  </TableCell>
                  <TableCell className="text-body-sm text-muted-foreground">
                    {exp.expand?.viagem_id?.codigo || '-'}
                  </TableCell>
                  <TableCell className="text-right text-data-tabular font-medium">
                    {formatCurrency(exp.valor)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        exp.status === 'aprovada' || exp.status === 'reembolsada'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : exp.status === 'rejeitada'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                      }
                    >
                      {exp.status.toUpperCase()}
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
