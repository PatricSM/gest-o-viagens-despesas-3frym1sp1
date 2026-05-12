import { Search, Plus, MapPin, CalendarDays, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/formatters'

const MOCK_TRIPS = [
  {
    id: 1,
    dest: 'São Paulo, SP',
    purpose: 'Reunião Comercial',
    startDate: '2023-10-20',
    endDate: '2023-10-25',
    budget: 2500,
    status: 'Concluída',
  },
  {
    id: 2,
    dest: 'Rio de Janeiro, RJ',
    purpose: 'Conferência Tech',
    startDate: '2023-11-10',
    endDate: '2023-11-15',
    budget: 3200,
    status: 'Aprovada',
  },
  {
    id: 3,
    dest: 'Belo Horizonte, MG',
    purpose: 'Visita Técnica',
    startDate: '2023-12-05',
    endDate: '2023-12-08',
    budget: 1500,
    status: 'Pendente',
  },
]

export default function Trips() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-slide-in-bottom">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md text-foreground">Viagens</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Gerencie suas requisições de viagem.
          </p>
        </div>
        <Button className="shadow-elevation">
          <Plus className="w-4 h-4 mr-2" />
          Nova Viagem
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar destino ou motivo..."
            className="pl-9 bg-card shadow-subtle border-none"
          />
        </div>
        <Button variant="outline" className="bg-card shadow-subtle border-none">
          Filtros
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_TRIPS.map((trip) => (
          <Card
            key={trip.id}
            className="border-none shadow-elevation hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
          >
            <CardContent className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <Badge
                  variant="secondary"
                  className={
                    trip.status === 'Concluída'
                      ? 'bg-slate-100 text-slate-700'
                      : trip.status === 'Aprovada'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-amber-100 text-amber-700'
                  }
                >
                  {trip.status}
                </Badge>
              </div>
              <h3 className="text-headline-md text-lg mb-1 line-clamp-1">{trip.purpose}</h3>

              <div className="space-y-3 mt-4 text-body-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{trip.dest}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span className="font-medium text-foreground">
                    Orçamento: {formatCurrency(trip.budget)}
                  </span>
                </div>
              </div>
            </CardContent>
            <div className="p-4 border-t bg-secondary/20 flex justify-end gap-2">
              <Button variant="ghost" size="sm">
                Ver Detalhes
              </Button>
              <Button variant="secondary" size="sm">
                Add Despesa
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
