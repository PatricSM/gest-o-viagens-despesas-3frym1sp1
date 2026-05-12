import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

export function ReportTable({ data, type }: { data: any[]; type: string }) {
  if (!data || data.length === 0) return null

  const isCurrency =
    type.startsWith('gasto') ||
    type === 'top-fornecedores' ||
    type === 'orcado-vs-realizado' ||
    type === 'por-forma-pagamento' ||
    type === 'top-viajantes'

  return (
    <Card className="flex-1 overflow-auto bg-background">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">
              {isCurrency ? 'Valor (BRL)' : 'Quantidade / Medida'}
            </TableHead>
            {data[0]?.secondaryValue !== undefined && (
              <TableHead className="text-right">Adicional</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} className="hover:bg-muted/30">
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {isCurrency ? formatCurrency(row.value) : row.value}
              </TableCell>
              {row.secondaryValue !== undefined && (
                <TableCell className="text-right text-muted-foreground">
                  {isCurrency ? formatCurrency(row.secondaryValue) : row.secondaryValue}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
