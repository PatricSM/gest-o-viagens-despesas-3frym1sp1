import { Search, Plus } from 'lucide-react'
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

const MOCK_EXPENSES = [
  {
    id: 101,
    date: '2023-10-24',
    desc: 'Jantar com Cliente - Restaurante Figueira',
    category: 'Alimentação',
    amount: 250.0,
    status: 'Pendente',
    trip: 'São Paulo - Out/23',
  },
  {
    id: 102,
    date: '2023-10-23',
    desc: 'Uber Aeroporto',
    category: 'Transporte',
    amount: 85.5,
    status: 'Aprovada',
    trip: 'São Paulo - Out/23',
  },
  {
    id: 103,
    date: '2023-10-20',
    desc: 'Material de Escritório',
    category: 'Outros',
    amount: 45.9,
    status: 'Reembolsado',
    trip: '-',
  },
  {
    id: 104,
    date: '2023-10-15',
    desc: 'Passagem Aérea GOL',
    category: 'Transporte',
    amount: 1200.0,
    status: 'Aprovada',
    trip: 'Rio de Janeiro - Nov/23',
  },
  {
    id: 105,
    date: '2023-10-10',
    desc: 'Café da manhã',
    category: 'Alimentação',
    amount: 40.0,
    status: 'Rejeitada',
    trip: '-',
  },
]

export default function Expenses() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-slide-in-bottom">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md text-foreground">Despesas</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Gerencie e registre seus gastos.
          </p>
        </div>
        <ExpenseFormDialog>
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
              {MOCK_EXPENSES.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-body-sm whitespace-nowrap">
                    {formatDate(exp.date)}
                  </TableCell>
                  <TableCell className="font-medium">{exp.desc}</TableCell>
                  <TableCell className="text-body-sm text-muted-foreground">
                    {exp.category}
                  </TableCell>
                  <TableCell className="text-body-sm">{exp.trip}</TableCell>
                  <TableCell className="text-right text-data-tabular font-medium">
                    {formatCurrency(exp.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        exp.status === 'Aprovada' || exp.status === 'Reembolsado'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : exp.status === 'Pendente'
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                      }
                    >
                      {exp.status}
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
