import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createViagem, updateViagem, Viagem } from '@/services/viagens'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'

interface TripFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trip: Viagem | null
  onSuccess: () => void
}

export function TripFormDialog({ open, onOpenChange, trip, onSuccess }: TripFormDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [centrosCusto, setCentrosCusto] = useState<{ id: string; nome: string }[]>([])

  const [formData, setFormData] = useState({
    motivo: '',
    centro_custo_id: '',
    status: 'rascunho' as Viagem['status'],
  })

  useEffect(() => {
    if (open) {
      if (trip) {
        setFormData({
          motivo: trip.motivo,
          centro_custo_id: trip.centro_custo_id,
          status: trip.status,
        })
      } else {
        setFormData({ motivo: '', centro_custo_id: '', status: 'rascunho' })
      }

      pb.collection('centros_custo')
        .getFullList()
        .then((res) => setCentrosCusto(res))
        .catch(() => {})
    }
  }, [open, trip])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.motivo || !formData.centro_custo_id) {
      toast({
        title: 'Atenção',
        description: 'Preencha os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...formData,
        empresa_id: user?.empresa_id,
        usuario_id: user?.id,
      }

      if (trip) {
        await updateViagem(trip.id, payload)
        toast({ title: 'Sucesso', description: 'Viagem atualizada.' })
      } else {
        await createViagem(payload)
        toast({ title: 'Sucesso', description: 'Viagem criada.' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: err.message || 'Falha ao salvar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{trip ? 'Editar Viagem' : 'Nova Viagem'}</DialogTitle>
          <DialogDescription>
            {trip
              ? 'Edite os dados do seu rascunho de viagem.'
              : 'Crie uma nova requisição de viagem.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Motivo da Viagem *</Label>
            <Input
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ex: Visita a cliente, Evento corporativo"
            />
          </div>

          <div className="space-y-2">
            <Label>Centro de Custo *</Label>
            <Select
              value={formData.centro_custo_id}
              onValueChange={(v) => setFormData({ ...formData, centro_custo_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {centrosCusto.map((cc) => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
