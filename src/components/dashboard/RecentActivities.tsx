import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const RECENT_ACTIVITIES = [
  {
    id: 1,
    date: '2023-10-24',
    desc: 'Uber Aeroporto',
    category: 'Transporte',
    amount: 85.5,
    status: 'Aprovada',
  },
  {
    id: 2,
    date: '2023-10-23',
    desc: 'Almoço Cliente',
    category: 'Alimentação',
    amount: 150.0,
    status: 'Pendente',
  },
  {
    id: 3,
    date: '2023-10-22',
    desc: 'Hotel SP',
    category: 'Hospedagem',
    amount: 850.0,
    status: 'Reembolsado',
  },
  {
    id: 4,
    date: '2023-10-20',
    desc: 'Café',
    category: 'Alimentação',
    amount: 25.0,
    status: 'Rejeitada',
  },
  {
    id: 5,
    date: '2023-10-18',
    desc: 'Táxi',
    category: 'Transporte',
    amount: 45.0,
    status: 'Aprovada',
  },
]

export function RecentActivities() {
  return (
    <Card
      className="border-none shadow-elevation animate-slide-in-bottom"
      style={{ animationDelay: '500ms' }}
    >
      <CardHeader>
        <CardTitle className="text-title-sm">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-label-caps">Data</TableHead>
              <TableHead className="text-label-caps">Descrição</TableHead>
              <TableHead className="text-label-caps">Categoria</TableHead>
              <TableHead className="text-label-caps text-right">Valor</TableHead>
              <TableHead className="text-label-caps text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RECENT_ACTIVITIES.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="text-body-sm">{formatDate(activity.date)}</TableCell>
                <TableCell className="font-medium">{activity.desc}</TableCell>
                <TableCell className="text-body-sm text-muted-foreground">
                  {activity.category}
                </TableCell>
                <TableCell className="text-right text-data-tabular">
                  {formatCurrency(activity.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={
                      activity.status === 'Aprovada' || activity.status === 'Reembolsado'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : activity.status === 'Pendente'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                    }
                  >
                    {activity.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
