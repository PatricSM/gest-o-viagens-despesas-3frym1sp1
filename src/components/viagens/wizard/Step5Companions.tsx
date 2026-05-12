import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import {
  getAcompanhantes,
  saveAcompanhante,
  deleteAcompanhante,
  ViagemAcompanhante,
} from '@/services/viagens'
import { useToast } from '@/hooks/use-toast'

export function Step5Companions({
  viagemId,
  onNext,
  onPrev,
}: {
  viagemId: string
  onNext: () => void
  onPrev: () => void
}) {
  const { toast } = useToast()
  const [acompanhantes, setAcompanhantes] = useState<Partial<ViagemAcompanhante>[]>([])

  useEffect(() => {
    getAcompanhantes(viagemId).then(setAcompanhantes)
  }, [viagemId])

  const add = () => {
    setAcompanhantes((prev) => [
      ...prev,
      { viagem_id: viagemId, nome: '', cpf: '', parentesco: '', contato_emergencial: '' },
    ])
  }

  const remove = async (index: number) => {
    const t = acompanhantes[index]
    if (t.id) await deleteAcompanhante(t.id)
    setAcompanhantes((prev) => prev.filter((_, i) => i !== index))
  }

  const updateField = (index: number, field: keyof ViagemAcompanhante, value: string) => {
    setAcompanhantes((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)))
  }

  const handleNext = async () => {
    try {
      for (const e of acompanhantes) {
        if (!e.nome || !e.cpf)
          return toast({
            title: 'Atenção',
            description: 'Preencha nome e CPF.',
            variant: 'destructive',
          })
        await saveAcompanhante(e)
      }
      onNext()
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao salvar.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {acompanhantes.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Nenhum acompanhante adicionado. Clique abaixo se for levar alguém.
          </div>
        )}
        {acompanhantes.map((e, i) => (
          <div key={i} className="p-4 border rounded-lg shadow-sm space-y-4 relative bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Nome Completo *</label>
                <Input value={e.nome} onChange={(ev) => updateField(i, 'nome', ev.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">CPF *</label>
                <Input value={e.cpf} onChange={(ev) => updateField(i, 'cpf', ev.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Parentesco</label>
                <Input
                  value={e.parentesco}
                  onChange={(ev) => updateField(i, 'parentesco', ev.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Contato de Emergência</label>
                <Input
                  value={e.contato_emergencial}
                  onChange={(ev) => updateField(i, 'contato_emergencial', ev.target.value)}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-destructive"
              onClick={() => remove(i)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={add} className="w-full border-dashed">
        <Plus className="w-4 h-4 mr-2" /> Adicionar Acompanhante
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
