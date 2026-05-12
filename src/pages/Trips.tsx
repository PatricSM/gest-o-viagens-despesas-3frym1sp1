import { useEffect, useState } from 'react'
import { Search, Plus, CalendarDays, Wallet, Pencil, Trash2, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getViagens, deleteViagem, updateViagem, Viagem } from '@/services/viagens'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { TripFormDialog } from '@/components/TripFormDialog'

export default function Trips() {
  const [trips, setTrips] = useState<Viagem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Viagem | null>(null)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const data = await getViagens()
      setTrips(data)
    } catch (err) {
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar as viagens',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('viagens', () => {
    loadData()
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este rascunho?')) return
    try {
      await deleteViagem(id)
      toast({ title: 'Sucesso', description: 'Viagem excluída.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao excluir.', variant: 'destructive' })
    }
  }

  const handleSubmitTrip = async (id: string) => {
    if (!confirm('Deseja enviar para aprovação? Após o envio, não será possível editar.')) return
    try {
      await updateViagem(id, { status: 'em_aprovacao' })
      toast({ title: 'Sucesso', description: 'Viagem enviada para aprovação.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao enviar.', variant: 'destructive' })
    }
  }

  const filteredTrips = trips.filter(
    (t) =>
      t.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.codigo?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-slate-100 text-slate-700'
      case 'aprovada':
        return 'bg-primary/10 text-primary'
      case 'rascunho':
        return 'bg-zinc-100 text-zinc-600'
      case 'rejeitada':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-amber-100 text-amber-700'
    }
  }

  const getStatusLabel = (status: string) =>
    status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-headline-md text-foreground">Viagens</h2>
          <p className="text-body-md text-muted-foreground mt-1">
            Gerencie suas requisições de viagem.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTrip(null)
            setIsDialogOpen(true)
          }}
          className="shadow-elevation"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Viagem
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card shadow-subtle border-none"
          />
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhuma viagem encontrada.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip) => (
            <Card
              key={trip.id}
              className="border-none shadow-elevation hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
            >
              <CardContent className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className={getStatusColor(trip.status)}>
                    {getStatusLabel(trip.status)}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">{trip.codigo}</span>
                </div>
                <h3 className="text-headline-md text-lg mb-1 line-clamp-1">{trip.motivo}</h3>

                <div className="space-y-3 mt-4 text-body-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 shrink-0" />
                    <span className="font-medium text-foreground">
                      Estimado: {formatCurrency(trip.total_estimado || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 shrink-0" />
                    <span>Criado em {formatDate(trip.created)}</span>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t bg-secondary/20 flex justify-end gap-2 flex-wrap">
                {trip.status === 'rascunho' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTrip(trip)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(trip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleSubmitTrip(trip.id)}>
                      <Send className="w-4 h-4 mr-1" /> Enviar
                    </Button>
                  </>
                )}
                {trip.status !== 'rascunho' && (
                  <Button variant="secondary" size="sm">
                    Ver Detalhes
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {isDialogOpen && (
        <TripFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          trip={editingTrip}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
