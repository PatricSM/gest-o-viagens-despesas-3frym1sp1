import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import * as adminService from '@/services/admin'
import { useToast } from '@/hooks/use-toast'

export default function GeralForm({ politica }: { politica: any }) {
  const [dias, setDias] = useState(politica?.antecedencia_minima_viagem_dias || 0)
  const [valor, setValor] = useState(politica?.valor_max_sem_comprovante || 0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setLoading(true)
    try {
      await adminService.updatePolitica(politica.id, {
        antecedencia_minima_viagem_dias: Number(dias),
        valor_max_sem_comprovante: Number(valor),
      })
      toast({ title: 'Configurações salvas' })
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label>Antecedência Mínima Viagem (dias)</Label>
        <Input type="number" value={dias} onChange={(e) => setDias(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Valor Máx. Sem Comprovante (R$)</Label>
        <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
      </div>
      <Button onClick={handleSave} disabled={loading}>
        Salvar Alterações
      </Button>
    </div>
  )
}
