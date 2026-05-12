import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  getEstimativas,
  saveEstimativa,
  deleteEstimativa,
  ViagemEstimativa,
} from '@/services/viagens'
import { useToast } from '@/hooks/use-toast'

export function Step4Advance({
  viagemId,
  onNext,
  onPrev,
}: {
  viagemId: string
  onNext: () => void
  onPrev: () => void
}) {
  const { toast } = useToast()
  const [enabled, setEnabled] = useState(false)
  const [estimativa, setEstimativa] = useState<Partial<ViagemEstimativa> | null>(null)

  useEffect(() => {
    getEstimativas(viagemId).then((data) => {
      const adiantamento = data.find(
        (e) => e.tipo === 'outros' && e.descricao.startsWith('[ADIANTAMENTO]'),
      )
      if (adiantamento) {
        setEnabled(true)
        setEstimativa({
          ...adiantamento,
          descricao: adiantamento.descricao.replace('[ADIANTAMENTO] ', ''),
        })
      } else {
        setEstimativa({ viagem_id: viagemId, tipo: 'outros', descricao: '', valor: 0 })
      }
    })
  }, [viagemId])

  const handleNext = async () => {
    try {
      if (enabled && estimativa) {
        if (!estimativa.valor || !estimativa.descricao) {
          return toast({
            title: 'Atenção',
            description: 'Preencha o valor e a justificativa.',
            variant: 'destructive',
          })
        }
        await saveEstimativa({ ...estimativa, descricao: `[ADIANTAMENTO] ${estimativa.descricao}` })
      } else if (!enabled && estimativa?.id) {
        await deleteEstimativa(estimativa.id)
      }
      onNext()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar adiantamento.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 border rounded-lg p-4 bg-card">
        <Switch id="solicitar" checked={enabled} onCheckedChange={setEnabled} />
        <label
          htmlFor="solicitar"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Solicitar adiantamento para esta viagem
        </label>
      </div>

      {enabled && estimativa && (
        <div className="space-y-4 p-4 border rounded-lg bg-card animate-in fade-in slide-in-from-top-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Valor Desejado *</label>
            <Input
              type="number"
              value={estimativa.valor || 0}
              onChange={(e) => setEstimativa({ ...estimativa, valor: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Justificativa *</label>
            <Textarea
              value={estimativa.descricao}
              onChange={(e) => setEstimativa({ ...estimativa, descricao: e.target.value })}
              placeholder="Para que será utilizado este valor?"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onPrev}>
          Voltar
        </Button>
        <Button onClick={handleNext}>Próximo</Button>
      </div>
    </div>
  )
}
