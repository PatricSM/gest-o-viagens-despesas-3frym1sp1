import { Plane, Receipt, Clock, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'

const STATS = [
  {
    title: 'Viagens Ativas',
    value: '3',
    icon: Plane,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  {
    title: 'Despesas Pendentes',
    value: '12',
    icon: Receipt,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  {
    title: 'Aguardando Reembolso',
    value: formatCurrency(1450.5),
    icon: Clock,
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
  {
    title: 'Saldo Adiantamentos',
    value: formatCurrency(500.0),
    icon: Wallet,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
]

export function SummaryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((stat, index) => (
        <Card
          key={index}
          className="border-none shadow-elevation hover:-translate-y-1 transition-transform animate-slide-in-bottom"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-label-caps text-muted-foreground">{stat.title}</p>
              <h3 className="text-headline-md mt-1">{stat.value}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
