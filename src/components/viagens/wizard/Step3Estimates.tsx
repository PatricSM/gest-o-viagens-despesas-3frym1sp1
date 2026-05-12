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
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import {
  getEstimativas,
  saveEstimativa,
  deleteEstimativa,
  ViagemEstimativa,
  updateViagem,
} from '@/services/viagens'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { formatCurrency } from '@/lib/formatters'

export function Step3Estimates({
  viagemId,
  onNext,
  onPrev,
}: {
  viagemId: string
  onNext: () => void
  onPrev: () => void
}) {
  const { currentEmpresa } = useAuth()
  const { toast } = useToast()
  const [estimativas, setEstimativas] = useState<Partial<ViagemEstimativa>[]>([])
  const [diariaMax, setDiariaMax] = useState(0)

  useEffect(() => {
    getEstimativas(viagemId).then(setEstimativas)
    if (currentEmpresa) {
      pb.collection('politicas')
        .getFirstListItem(`empresa_id="${currentEmpresa.id}" && active=true`)
        .then((pol) => {
          pb.collection('politica_diarias')
            .getFullList({ filter: `politica_id="${pol.id}"` })
            .then((diarias) => {
              if (diarias.length > 0) setDiariaMax(diarias[0].hospedagem_max || 0)
            })
            .catch(() => {})
        })
        .catch(() => {})
    }
  }, [viagemId, currentEmpresa])

  const add = () => {
    setEstimativas((prev) => [
      ...prev,
      { viagem_id: viagemId, tipo: 'passagem', descricao: '', valor: 0, dias: 1, valor_diaria: 0 },
    ])
  }

  const remove = async (index: number) => {
    const t = estimativas[index]
    if (t.id) await deleteEstimativa(t.id)
    setEstimativas((prev) => prev.filter((_, i) => i !== index))
  }

  const updateField = (index: number, field: keyof ViagemEstimativa, value: any) => {
    setEstimativas((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t
        const updated = { ...t, [field]: value }
        if (updated.tipo === 'hospedagem')
          updated.valor = (updated.dias || 1) * (updated.valor_diaria || 0)
        return updated
      }),
    )
  }

  const handleNext = async () => {
    try {
      let total = 0
      for (const e of estimativas) {
        if (!e.descricao || !e.valor)
          return toast({
            title: 'Atenção',
            description: 'Preencha descrição e valor.',
            variant: 'destructive',
          })
        total += Number(e.valor)
        await saveEstimativa(e)
      }
      await updateViagem(viagemId, { total_estimado: total })
      onNext()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar estimativas.', variant: 'destructive' })
    }
  }

  const total = estimativas.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {estimativas.map((e, i) => {
          const isHospedagem = e.tipo === 'hospedagem'
          const violacao = isHospedagem && diariaMax > 0 && (e.valor_diaria || 0) > diariaMax
          return (
            <div
              key={i}
              className={`p-4 border rounded-lg shadow-sm space-y-4 relative ${violacao ? 'border-amber-500 bg-amber-50/50' : 'bg-card'}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-medium mb-1 block">Tipo</label>
                  <Select value={e.tipo} onValueChange={(v) => updateField(i, 'tipo', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passagem">Passagem</SelectItem>
                      <SelectItem value="hospedagem">Hospedagem</SelectItem>
                      <SelectItem value="alimentacao">Alimentação</SelectItem>
                      <SelectItem value="transporte_local">Transporte Local</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div
                  className={isHospedagem ? 'col-span-1 md:col-span-1' : 'col-span-1 md:col-span-2'}
                >
                  <label className="text-xs font-medium mb-1 block">Descrição *</label>
                  <Input
                    value={e.descricao}
                    onChange={(ev) => updateField(i, 'descricao', ev.target.value)}
                  />
                </div>
                {isHospedagem ? (
                  <>
                    <div className="col-span-1">
                      <label className="text-xs font-medium mb-1 block">Dias/Noites</label>
                      <Input
                        type="number"
                        min={1}
                        value={e.dias || 1}
                        onChange={(ev) => updateField(i, 'dias', Number(ev.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="text-xs font-medium mb-1 block">Valor Diária</label>
                      <Input
                        type="number"
                        value={e.valor_diaria || 0}
                        onChange={(ev) => updateField(i, 'valor_diaria', Number(ev.target.value))}
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-1">
                    <label className="text-xs font-medium mb-1 block">Valor Total *</label>
                    <Input
                      type="number"
                      value={e.valor || 0}
                      onChange={(ev) => updateField(i, 'valor', Number(ev.target.value))}
                    />
                  </div>
                )}
              </div>
              {violacao && (
                <div className="flex items-center text-amber-700 text-sm mt-2">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Política violada: O teto para hospedagem é {formatCurrency(diariaMax)}.
                </div>
              )}
              {isHospedagem && (
                <div className="text-sm font-medium text-right text-muted-foreground mt-2 border-t pt-2">
                  Total desta linha: {formatCurrency(Number(e.valor) || 0)}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-destructive"
                onClick={() => remove(i)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )
        })}
      </div>

      <Button variant="outline" onClick={add} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Adicionar Estimativa
      </Button>

      <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
        <span className="font-semibold text-muted-foreground">Total Estimado</span>
        <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          Voltar
        </Button>
        <Button onClick={handleNext}>Próximo</Button>
      </div>
    </div>
  )
}
