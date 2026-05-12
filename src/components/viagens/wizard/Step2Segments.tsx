import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { getTrechos, saveTrecho, deleteTrecho, ViagemTrecho } from '@/services/viagens'
import { useToast } from '@/hooks/use-toast'

export function Step2Segments({
  viagemId,
  onNext,
  onPrev,
}: {
  viagemId: string
  onNext: () => void
  onPrev: () => void
}) {
  const { toast } = useToast()
  const [trechos, setTrechos] = useState<Partial<ViagemTrecho>[]>([])

  useEffect(() => {
    getTrechos(viagemId).then((data) => {
      if (data.length > 0) setTrechos(data)
      else addTrecho()
    })
  }, [viagemId])

  const addTrecho = () => {
    setTrechos((prev) => [
      ...prev,
      {
        viagem_id: viagemId,
        ordem: prev.length + 1,
        origem: '',
        destino: '',
        data_ida: '',
        tipo_transporte: 'aereo',
      },
    ])
  }

  const removeTrecho = async (index: number) => {
    const t = trechos[index]
    if (t.id) await deleteTrecho(t.id)
    setTrechos((prev) =>
      prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, ordem: i + 1 })),
    )
  }

  const updateField = (index: number, field: keyof ViagemTrecho, value: any) => {
    setTrechos((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }

  const handleNext = async () => {
    try {
      for (const t of trechos) {
        if (!t.origem || !t.destino || !t.data_ida) {
          return toast({
            title: 'Atenção',
            description: 'Preencha os campos obrigatórios dos trechos.',
            variant: 'destructive',
          })
        }
        await saveTrecho(t)
      }
      onNext()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar trechos.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {trechos.map((t, i) => (
          <div key={i} className="p-4 border rounded-lg bg-card shadow-sm space-y-4 relative">
            <h4 className="font-semibold text-sm">Trecho {i + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Origem *</label>
                <Input
                  value={t.origem}
                  onChange={(e) => updateField(i, 'origem', e.target.value)}
                  placeholder="Cidade de origem"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Destino *</label>
                <Input
                  value={t.destino}
                  onChange={(e) => updateField(i, 'destino', e.target.value)}
                  placeholder="Cidade de destino"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Data Ida *</label>
                <Input
                  type="date"
                  value={t.data_ida ? t.data_ida.substring(0, 10) : ''}
                  onChange={(e) => updateField(i, 'data_ida', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Transporte</label>
                <Select
                  value={t.tipo_transporte}
                  onValueChange={(v) => updateField(i, 'tipo_transporte', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aereo">Aéreo</SelectItem>
                    <SelectItem value="rodoviario">Rodoviário</SelectItem>
                    <SelectItem value="proprio">Veículo Próprio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {trechos.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-destructive"
                onClick={() => removeTrecho(i)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={addTrecho} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Trecho
      </Button>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          Voltar
        </Button>
        <Button onClick={handleNext}>Próximo</Button>
      </div>
    </div>
  )
}
